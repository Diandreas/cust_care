<?php

namespace App\Http\Controllers;

use App\Models\Flyer;
use App\Models\ContentTemplate;
use App\Services\AIContentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class FlyerController extends Controller
{
    private AIContentService $aiService;

    public function __construct(AIContentService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function index()
    {
        $flyers = Flyer::where('user_id', auth()->id())
            ->with('template')
            ->latest()
            ->paginate(12);

        return Inertia::render('MarketingAssistant/Flyers/Index', [
            'flyers' => $flyers
        ]);
    }

    public function create()
    {
        $templates = ContentTemplate::where('type', ContentTemplate::TYPE_FLYER)
            ->where(function($query) {
                $query->where('user_id', auth()->id())
                      ->orWhere('is_public', true);
            })
            ->get();

        return Inertia::render('MarketingAssistant/Flyers/Create', [
            'templates' => $templates,
            'formats' => [
                Flyer::FORMAT_A4 => 'A4 (210x297mm)',
                Flyer::FORMAT_A5 => 'A5 (148x210mm)',
                Flyer::FORMAT_SQUARE => 'Carré (1080x1080px)',
                Flyer::FORMAT_STORY => 'Story (1080x1920px)',
                Flyer::FORMAT_POST => 'Post (1200x630px)'
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:200',
            'format' => 'required|string|in:' . implode(',', [
                Flyer::FORMAT_A4, Flyer::FORMAT_A5, Flyer::FORMAT_SQUARE, 
                Flyer::FORMAT_STORY, Flyer::FORMAT_POST
            ]),
            'design_data' => 'required|array',
            'template_id' => 'nullable|exists:content_templates,id'
        ]);

        $flyer = Flyer::create([
            'user_id' => auth()->id(),
            'template_id' => $request->template_id,
            'title' => $request->title,
            'format' => $request->format,
            'design_data' => $request->design_data,
            'status' => Flyer::STATUS_DRAFT,
            'ai_generated' => $request->ai_generated ?? false
        ]);

        return response()->json(['success' => true, 'flyer' => $flyer]);
    }

    public function show(Flyer $flyer)
    {
        $this->authorize('view', $flyer);

        return Inertia::render('MarketingAssistant/Flyers/Show', [
            'flyer' => $flyer->load('template')
        ]);
    }

    public function edit(Flyer $flyer)
    {
        $this->authorize('update', $flyer);

        $templates = ContentTemplate::where('type', ContentTemplate::TYPE_FLYER)
            ->where(function($query) {
                $query->where('user_id', auth()->id())
                      ->orWhere('is_public', true);
            })
            ->get();

        return Inertia::render('MarketingAssistant/Flyers/Edit', [
            'flyer' => $flyer->load('template'),
            'templates' => $templates
        ]);
    }

    public function update(Request $request, Flyer $flyer)
    {
        $this->authorize('update', $flyer);

        $request->validate([
            'title' => 'string|max:200',
            'design_data' => 'array',
            'status' => 'string|in:' . implode(',', [
                Flyer::STATUS_DRAFT, Flyer::STATUS_COMPLETED, Flyer::STATUS_ARCHIVED
            ])
        ]);

        $flyer->update($request->only(['title', 'design_data', 'status']));

        return response()->json(['success' => true, 'flyer' => $flyer]);
    }

    public function destroy(Flyer $flyer)
    {
        $this->authorize('delete', $flyer);

        $flyer->delete();

        return response()->json(['success' => true]);
    }

    public function generateContent(Request $request)
    {
        $request->validate([
            'purpose' => 'required|string|max:200',
            'business' => 'string|max:100',
            'details' => 'array',
            'style' => 'string|max:50',
            'colors' => 'array'
        ]);

        $result = $this->aiService->generateFlyerContent(
            $request->purpose,
            $request->business ?? auth()->user()->name ?? 'Mon Entreprise',
            $request->details ?? []
        );

        return response()->json($result);
    }

    public function export(Request $request, Flyer $flyer)
    {
        $this->authorize('view', $flyer);

        $request->validate([
            'format' => 'required|string|in:png,jpg,pdf',
            'quality' => 'integer|min:1|max:100'
        ]);

        try {
            $exportPath = $this->exportFlyer($flyer, $request->format, $request->quality ?? 90);
            
            $flyer->incrementDownloads();

            return response()->download($exportPath)->deleteFileAfterSend();

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function exportFlyer(Flyer $flyer, string $format, int $quality): string
    {
        $dimensions = $flyer->getDimensions();
        $designData = $flyer->design_data;

        // Créer une nouvelle image avec les dimensions du flyer
        $manager = new ImageManager(new Driver());
        $image = $manager->create($dimensions['width'], $dimensions['height']);

        // Appliquer la couleur de fond
        $backgroundColor = $designData['background_color'] ?? '#ffffff';
        $image->fill($backgroundColor);

        // Ajouter les éléments du design
        foreach ($designData['elements'] ?? [] as $element) {
            $this->addElementToImage($image, $element);
        }

        // Générer le nom de fichier
        $filename = $flyer->title . '_' . time() . '.' . $format;
        $path = storage_path('app/temp/' . $filename);

        // Créer le dossier s'il n'existe pas
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        // Sauvegarder l'image
        switch ($format) {
            case 'png':
                $image->toPng()->save($path);
                break;
            case 'jpg':
                $image->toJpeg($quality)->save($path);
                break;
            case 'pdf':
                // Pour le PDF, on sauvegarde d'abord en PNG puis on convertit
                $tempPng = str_replace('.pdf', '.png', $path);
                $image->toPng()->save($tempPng);
                $this->convertToPdf($tempPng, $path, $dimensions);
                unlink($tempPng);
                break;
        }

        return $path;
    }

    private function addElementToImage($image, array $element)
    {
        switch ($element['type']) {
            case 'text':
                $this->addTextElement($image, $element);
                break;
            case 'image':
                $this->addImageElement($image, $element);
                break;
            case 'shape':
                $this->addShapeElement($image, $element);
                break;
        }
    }

    private function addTextElement($image, array $element)
    {
        $text = $element['content'] ?? '';
        $x = $element['x'] ?? 0;
        $y = $element['y'] ?? 0;
        $fontSize = $element['fontSize'] ?? 16;
        $color = $element['color'] ?? '#000000';
        $fontFamily = $element['fontFamily'] ?? 'Arial';

        // Note: Cette implémentation basique pourrait être améliorée
        // avec des polices personnalisées et un meilleur positionnement
        $image->text($text, $x, $y, function($font) use ($fontSize, $color) {
            $font->size($fontSize);
            $font->color($color);
        });
    }

    private function addImageElement($image, array $element)
    {
        $imagePath = $element['src'] ?? '';
        $x = $element['x'] ?? 0;
        $y = $element['y'] ?? 0;
        $width = $element['width'] ?? 100;
        $height = $element['height'] ?? 100;

        if (file_exists($imagePath)) {
            $elementImage = $image->manager->read($imagePath);
            $elementImage->resize($width, $height);
            $image->place($elementImage, 'top-left', $x, $y);
        }
    }

    private function addShapeElement($image, array $element)
    {
        $type = $element['shape'] ?? 'rectangle';
        $x = $element['x'] ?? 0;
        $y = $element['y'] ?? 0;
        $width = $element['width'] ?? 100;
        $height = $element['height'] ?? 100;
        $color = $element['color'] ?? '#cccccc';

        switch ($type) {
            case 'rectangle':
                $image->drawRectangle($x, $y, function($shape) use ($width, $height, $color) {
                    $shape->size($width, $height);
                    $shape->background($color);
                });
                break;
            case 'circle':
                $radius = min($width, $height) / 2;
                $image->drawCircle($x + $radius, $y + $radius, function($shape) use ($radius, $color) {
                    $shape->radius($radius);
                    $shape->background($color);
                });
                break;
        }
    }

    private function convertToPdf(string $imagePath, string $pdfPath, array $dimensions)
    {
        // Pour une conversion PDF complète, vous pourriez utiliser des bibliothèques comme TCPDF ou DomPDF
        // Cette implémentation basique copie simplement l'image
        copy($imagePath, $pdfPath);
    }

    public function getDefaultTemplates()
    {
        $templates = [
            [
                'name' => 'Promotion Simple',
                'design_data' => [
                    'background_color' => '#ffffff',
                    'elements' => [
                        [
                            'type' => 'text',
                            'content' => 'OFFRE SPÉCIALE',
                            'x' => 50,
                            'y' => 100,
                            'fontSize' => 32,
                            'color' => '#ff6b35',
                            'fontWeight' => 'bold'
                        ],
                        [
                            'type' => 'text',
                            'content' => 'Votre texte ici',
                            'x' => 50,
                            'y' => 200,
                            'fontSize' => 18,
                            'color' => '#333333'
                        ]
                    ]
                ]
            ],
            [
                'name' => 'Événement',
                'design_data' => [
                    'background_color' => '#f8f9fa',
                    'elements' => [
                        [
                            'type' => 'text',
                            'content' => 'ÉVÉNEMENT',
                            'x' => 50,
                            'y' => 80,
                            'fontSize' => 28,
                            'color' => '#007bff',
                            'fontWeight' => 'bold'
                        ],
                        [
                            'type' => 'text',
                            'content' => 'Date et lieu',
                            'x' => 50,
                            'y' => 150,
                            'fontSize' => 16,
                            'color' => '#6c757d'
                        ]
                    ]
                ]
            ]
        ];

        return response()->json($templates);
    }

    public function duplicate(Flyer $flyer)
    {
        $this->authorize('view', $flyer);

        $newFlyer = $flyer->replicate();
        $newFlyer->title = $flyer->title . ' (Copie)';
        $newFlyer->status = Flyer::STATUS_DRAFT;
        $newFlyer->download_count = 0;
        $newFlyer->save();

        return response()->json(['success' => true, 'flyer' => $newFlyer]);
    }
}