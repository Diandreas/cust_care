<?php

namespace App\Http\Controllers;

use App\Models\MarketingFlyer;
use App\Services\FlyerGeneratorService;
use App\Services\AIContentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MarketingFlyerController extends Controller
{
    protected $flyerService;
    protected $aiService;

    public function __construct(FlyerGeneratorService $flyerService, AIContentService $aiService)
    {
        $this->flyerService = $flyerService;
        $this->aiService = $aiService;
    }

    /**
     * Afficher la liste des flyers
     */
    public function index(Request $request)
    {
        $query = MarketingFlyer::where('user_id', auth()->id());

        // Filtres
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('format')) {
            $query->where('format', $request->format);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('template')) {
            $query->where('template_name', $request->template);
        }

        $flyers = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Marketing/Flyers/Index', [
            'flyers' => $flyers,
            'filters' => $request->only(['search', 'format', 'status', 'template'])
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        $templates = $this->flyerService->getAvailableTemplates();
        $formats = $this->flyerService->getFormatOptions();
        $orientations = $this->flyerService->getOrientationOptions();

        return Inertia::render('Marketing/Flyers/Create', [
            'templates' => $templates,
            'formats' => $formats,
            'orientations' => $orientations
        ]);
    }

    /**
     * Stocker un nouveau flyer
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'format' => 'required|string|in:a4,a5,square,story,post',
            'orientation' => 'required|string|in:portrait,landscape',
            'design_data' => 'nullable|array',
            'content_data' => 'nullable|array',
            'template_name' => 'nullable|string|max:255',
            'ai_generation' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $flyer = MarketingFlyer::create([
                'user_id' => auth()->id(),
                'name' => $request->name,
                'description' => $request->description,
                'format' => $request->format,
                'orientation' => $request->orientation,
                'design_data' => $request->design_data ?? $this->flyerService->getDefaultDesignData($request->format, $request->orientation),
                'content_data' => $request->content_data ?? [],
                'template_name' => $request->template_name,
                'ai_generated_content' => $request->ai_generation ?? [],
                'status' => 'draft',
            ]);

            // Si l'IA est demandée, générer le contenu
            if (!empty($request->ai_generation) && ($request->ai_generation['enabled'] ?? false)) {
                $this->generateAIContent($flyer, $request->ai_generation);
            }

            return redirect()->route('marketing.flyers.edit', $flyer)
                ->with('success', 'Flyer créé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de flyer: ' . $e->getMessage());
            return back()->withErrors(['creation' => 'Erreur lors de la création: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Afficher un flyer spécifique
     */
    public function show(MarketingFlyer $flyer)
    {
        $this->authorize('view', $flyer);

        return Inertia::render('Marketing/Flyers/Show', [
            'flyer' => $flyer
        ]);
    }

    /**
     * Afficher le formulaire de modification
     */
    public function edit(MarketingFlyer $flyer)
    {
        $this->authorize('update', $flyer);

        $templates = $this->flyerService->getAvailableTemplates();
        $formats = $this->flyerService->getFormatOptions();
        $orientations = $this->flyerService->getOrientationOptions();

        return Inertia::render('Marketing/Flyers/Edit', [
            'flyer' => $flyer,
            'templates' => $templates,
            'formats' => $formats,
            'orientations' => $orientations
        ]);
    }

    /**
     * Mettre à jour un flyer
     */
    public function update(Request $request, MarketingFlyer $flyer)
    {
        $this->authorize('update', $flyer);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'format' => 'required|string|in:a4,a5,square,story,post',
            'orientation' => 'required|string|in:portrait,landscape',
            'design_data' => 'nullable|array',
            'content_data' => 'nullable|array',
            'template_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $flyer->update($request->all());

            return back()->with('success', 'Flyer mis à jour avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de flyer: ' . $e->getMessage());
            return back()->withErrors(['update' => 'Erreur lors de la mise à jour: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Supprimer un flyer
     */
    public function destroy(MarketingFlyer $flyer)
    {
        $this->authorize('delete', $flyer);

        try {
            // Nettoyer les fichiers associés
            $this->flyerService->cleanupFlyerFiles($flyer);
            
            $flyer->delete();

            return redirect()->route('marketing.flyers.index')
                ->with('success', 'Flyer supprimé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de flyer: ' . $e->getMessage());
            return back()->withErrors(['delete' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
    }

    /**
     * Publier un flyer
     */
    public function publish(MarketingFlyer $flyer)
    {
        $this->authorize('update', $flyer);

        try {
            $flyer->publish();

            return back()->with('success', 'Flyer publié avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la publication de flyer: ' . $e->getMessage());
            return back()->withErrors(['publish' => 'Erreur lors de la publication: ' . $e->getMessage()]);
        }
    }

    /**
     * Archiver un flyer
     */
    public function archive(MarketingFlyer $flyer)
    {
        $this->authorize('update', $flyer);

        try {
            $flyer->archive();

            return back()->with('success', 'Flyer archivé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'archivage de flyer: ' . $e->getMessage());
            return back()->withErrors(['archive' => 'Erreur lors de l\'archivage: ' . $e->getMessage()]);
        }
    }

    /**
     * Dupliquer un flyer
     */
    public function duplicate(MarketingFlyer $flyer)
    {
        $this->authorize('view', $flyer);

        try {
            $newFlyer = $this->flyerService->duplicateFlyer($flyer);

            return redirect()->route('marketing.flyers.edit', $newFlyer)
                ->with('success', 'Flyer dupliqué avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la duplication de flyer: ' . $e->getMessage());
            return back()->withErrors(['duplication' => 'Erreur lors de la duplication: ' . $e->getMessage()]);
        }
    }

    /**
     * Aperçu d'un flyer
     */
    public function preview(MarketingFlyer $flyer)
    {
        $this->authorize('view', $flyer);

        try {
            $previewUrl = $this->flyerService->generatePreview($flyer);

            return response()->json([
                'success' => true,
                'preview_url' => $previewUrl
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de l\'aperçu: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération de l\'aperçu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter un flyer
     */
    public function export(Request $request, MarketingFlyer $flyer)
    {
        $this->authorize('view', $flyer);

        $validator = Validator::make($request->all(), [
            'format' => 'required|string|in:png,jpg,pdf',
            'quality' => 'nullable|integer|min:1|max:100',
            'resolution' => 'nullable|integer|min:72|max:600',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $exportSettings = [
                'format' => $request->format,
                'quality' => $request->quality ?? 90,
                'resolution' => $request->resolution ?? 300,
            ];

            $exportUrl = $this->flyerService->exportFlyer($flyer, $exportSettings);

            return response()->json([
                'success' => true,
                'export_url' => $exportUrl,
                'download_filename' => $flyer->name . '.' . $request->format
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'export de flyer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Appliquer un template à un flyer
     */
    public function applyTemplate(Request $request, MarketingFlyer $flyer)
    {
        $this->authorize('update', $flyer);

        $validator = Validator::make($request->all(), [
            'template_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $this->flyerService->applyTemplate($flyer, $request->template_name);

            return back()->with('success', 'Template appliqué avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'application du template: ' . $e->getMessage());
            return back()->withErrors(['template' => 'Erreur lors de l\'application du template: ' . $e->getMessage()]);
        }
    }

    /**
     * Générer du contenu IA pour un flyer
     */
    public function generateAIContent(Request $request, MarketingFlyer $flyer)
    {
        $this->authorize('update', $flyer);

        $validator = Validator::make($request->all(), [
            'topic' => 'required|string|max:255',
            'requirements' => 'nullable|array',
            'tone' => 'required|string|in:professional,casual,friendly,persuasive',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $content = $this->aiService->generateFlyerContent(
                $request->topic,
                $flyer->format,
                [
                    'requirements' => $request->requirements ?? [],
                    'tone' => $request->tone,
                    'user_id' => auth()->id(),
                ]
            );

            // Mettre à jour le flyer avec le contenu généré
            $flyer->update([
                'ai_generated_content' => array_merge(
                    $flyer->ai_generated_content ?? [],
                    [
                        'last_generated' => now()->toISOString(),
                        'content' => $content
                    ]
                )
            ]);

            return response()->json([
                'success' => true,
                'content' => $content
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de contenu IA: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Télécharger un flyer exporté
     */
    public function download(MarketingFlyer $flyer, $format = 'png')
    {
        $this->authorize('view', $flyer);

        try {
            $exportSettings = [
                'format' => $format,
                'quality' => 90,
                'resolution' => 300,
            ];

            $exportUrl = $this->flyerService->exportFlyer($flyer, $exportSettings);

            // Vérifier que le fichier existe
            if (!Storage::exists($exportUrl)) {
                return back()->withErrors(['download' => 'Fichier d\'export introuvable.']);
            }

            $filename = $flyer->name . '.' . $format;
            
            return Storage::download($exportUrl, $filename);

        } catch (\Exception $e) {
            Log::error('Erreur lors du téléchargement: ' . $e->getMessage());
            return back()->withErrors(['download' => 'Erreur lors du téléchargement: ' . $e->getMessage()]);
        }
    }

    /**
     * Obtenir les statistiques des flyers
     */
    public function getStats()
    {
        $stats = [
            'total_flyers' => MarketingFlyer::where('user_id', auth()->id())->count(),
            'published_flyers' => MarketingFlyer::where('user_id', auth()->id())->where('status', 'published')->count(),
            'draft_flyers' => MarketingFlyer::where('user_id', auth()->id())->where('status', 'draft')->count(),
            'archived_flyers' => MarketingFlyer::where('user_id', auth()->id())->where('status', 'archived')->count(),
            'ai_generated_flyers' => MarketingFlyer::where('user_id', auth()->id())->whereNotNull('ai_generated_content')->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    /**
     * Générer du contenu IA pour un flyer (méthode privée)
     */
    private function generateAIContent($flyer, $aiSettings)
    {
        try {
            $content = $this->aiService->generateFlyerContent(
                $aiSettings['topic'] ?? 'Flyer marketing',
                $flyer->format,
                [
                    'requirements' => $aiSettings['requirements'] ?? [],
                    'tone' => $aiSettings['tone'] ?? 'professional',
                    'user_id' => auth()->id(),
                ]
            );

            $flyer->update([
                'ai_generated_content' => [
                    'generated_at' => now()->toISOString(),
                    'settings' => $aiSettings,
                    'content' => $content
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération automatique de contenu IA: ' . $e->getMessage());
        }
    }
}