<?php

namespace App\Services;

use App\Models\MarketingFlyer;
use App\Models\MarketingContentTemplate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class FlyerGeneratorService
{
    protected $aiService;
    protected $imageManager;

    public function __construct(AIContentService $aiService)
    {
        $this->aiService = $aiService;
        $this->imageManager = new ImageManager(new Driver());
    }

    /**
     * Créer un nouveau flyer
     */
    public function createFlyer(int $userId, array $data): MarketingFlyer
    {
        $flyer = MarketingFlyer::create([
            'user_id' => $userId,
            'name' => $data['name'] ?? 'Nouveau Flyer',
            'description' => $data['description'] ?? '',
            'format' => $data['format'] ?? 'a4',
            'orientation' => $data['orientation'] ?? 'portrait',
            'design_data' => $data['design_data'] ?? $this->getDefaultDesignData($data['format'] ?? 'a4'),
            'content_data' => $data['content_data'] ?? [],
            'template_name' => $data['template_name'] ?? null,
            'export_settings' => $data['export_settings'] ?? $this->getDefaultExportSettings(),
            'status' => 'draft',
        ]);

        // Générer le contenu IA si demandé
        if (!empty($data['ai_generation']) && $data['ai_generation']['enabled']) {
            $this->generateAIContent($flyer, $data['ai_generation']);
        }

        return $flyer;
    }

    /**
     * Générer du contenu IA pour un flyer
     */
    public function generateAIContent(MarketingFlyer $flyer, array $settings): array
    {
        try {
            $topic = $settings['topic'] ?? 'Promotion spéciale';
            $format = $flyer->format;
            $requirements = $settings['requirements'] ?? [];

            $result = $this->aiService->generateFlyerContent($topic, $format, $requirements);

            if ($result['success']) {
                $flyer->updateAIGeneratedContent($result['content']);
                
                // Mettre à jour le contenu du flyer avec le contenu IA
                $contentData = $flyer->getContentData();
                $contentData = array_merge($contentData, $result['content']);
                $flyer->updateContentData($contentData);

                return [
                    'success' => true,
                    'content' => $result['content'],
                    'message' => 'Contenu IA généré avec succès',
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $result['error'] ?? 'Erreur lors de la génération du contenu IA',
                ];
            }

        } catch (\Exception $e) {
            Log::error('AI content generation for flyer failed', [
                'flyer_id' => $flyer->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Erreur technique lors de la génération du contenu IA',
            ];
        }
    }

    /**
     * Générer l'aperçu d'un flyer
     */
    public function generatePreview(MarketingFlyer $flyer): string
    {
        try {
            $dimensions = $flyer->getFormatDimensions();
            $designData = $flyer->getDesignData();
            $contentData = $flyer->getContentData();

            // Créer l'image de base
            $image = $this->imageManager->create($dimensions['width'], $dimensions['height']);

            // Appliquer le fond
            $backgroundColor = $designData['background_color'] ?? '#ffffff';
            $image->fill($backgroundColor);

            // Ajouter le contenu textuel
            $this->addTextContent($image, $contentData, $designData);

            // Ajouter les éléments graphiques
            $this->addGraphicElements($image, $designData);

            // Générer le chemin de l'aperçu
            $previewPath = "flyers/previews/preview_{$flyer->id}.png";
            
            // Sauvegarder l'aperçu
            Storage::disk('public')->put($previewPath, $image->encode('png'));

            return Storage::disk('public')->url($previewPath);

        } catch (\Exception $e) {
            Log::error('Flyer preview generation failed', [
                'flyer_id' => $flyer->id,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception('Erreur lors de la génération de l\'aperçu : ' . $e->getMessage());
        }
    }

    /**
     * Exporter un flyer
     */
    public function exportFlyer(MarketingFlyer $flyer, string $format = 'png'): string
    {
        try {
            $dimensions = $flyer->getFormatDimensions();
            $designData = $flyer->getDesignData();
            $contentData = $flyer->getContentData();
            $exportSettings = $flyer->getExportSettings();

            // Créer l'image de haute qualité
            $image = $this->imageManager->create($dimensions['width'], $dimensions['height']);

            // Appliquer le fond
            $backgroundColor = $designData['background_color'] ?? '#ffffff';
            $image->fill($backgroundColor);

            // Ajouter le contenu textuel
            $this->addTextContent($image, $contentData, $designData);

            // Ajouter les éléments graphiques
            $this->addGraphicElements($image, $designData);

            // Appliquer les paramètres d'export
            $this->applyExportSettings($image, $exportSettings);

            // Générer le nom du fichier
            $filename = "flyer_{$flyer->id}_{$format}_" . time() . ".{$format}";
            $exportPath = "flyers/exports/{$filename}";

            // Sauvegarder l'export
            $encodedImage = $this->encodeImage($image, $format, $exportSettings);
            Storage::disk('public')->put($exportPath, $encodedImage);

            return Storage::disk('public')->url($exportPath);

        } catch (\Exception $e) {
            Log::error('Flyer export failed', [
                'flyer_id' => $flyer->id,
                'format' => $format,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception('Erreur lors de l\'export du flyer : ' . $e->getMessage());
        }
    }

    /**
     * Ajouter le contenu textuel au flyer
     */
    protected function addTextContent($image, array $contentData, array $designData): void
    {
        $textColor = $designData['text_color'] ?? '#000000';
        $fontSize = $designData['font_size'] ?? 16;
        $fontFamily = $designData['font_family'] ?? 'Arial';

        // Titre principal
        if (!empty($contentData['headline'])) {
            $this->addText($image, $contentData['headline'], [
                'x' => 50,
                'y' => 50,
                'size' => $fontSize * 1.5,
                'color' => $textColor,
                'font' => $fontFamily,
                'weight' => 'bold',
            ]);
        }

        // Sous-titre
        if (!empty($contentData['subheadline'])) {
            $this->addText($image, $contentData['subheadline'], [
                'x' => 50,
                'y' => 100,
                'size' => $fontSize * 1.2,
                'color' => $textColor,
                'font' => $fontFamily,
                'weight' => 'normal',
            ]);
        }

        // Texte principal
        if (!empty($contentData['body_text'])) {
            $this->addWrappedText($image, $contentData['body_text'], [
                'x' => 50,
                'y' => 150,
                'max_width' => 500,
                'size' => $fontSize,
                'color' => $textColor,
                'font' => $fontFamily,
            ]);
        }

        // Appel à l'action
        if (!empty($contentData['call_to_action'])) {
            $this->addText($image, $contentData['call_to_action'], [
                'x' => 50,
                'y' => 400,
                'size' => $fontSize * 1.3,
                'color' => $designData['accent_color'] ?? '#007bff',
                'font' => $fontFamily,
                'weight' => 'bold',
            ]);
        }
    }

    /**
     * Ajouter du texte simple
     */
    protected function addText($image, string $text, array $options): void
    {
        $x = $options['x'] ?? 0;
        $y = $options['y'] ?? 0;
        $size = $options['size'] ?? 16;
        $color = $options['color'] ?? '#000000';
        $font = $options['font'] ?? 'Arial';
        $weight = $options['weight'] ?? 'normal';

        // Ici, vous implémenteriez l'ajout de texte réel
        // Intervention Image a des méthodes pour cela
        // $image->text($text, $x, $y, function($font) use ($size, $color, $weight) {
        //     $font->size($size);
        //     $font->color($color);
        //     $font->file($font);
        //     if ($weight === 'bold') {
        //         $font->weight(700);
        //     }
        // });
    }

    /**
     * Ajouter du texte avec retour à la ligne
     */
    protected function addWrappedText($image, string $text, array $options): void
    {
        $maxWidth = $options['max_width'] ?? 500;
        $words = explode(' ', $text);
        $lines = [];
        $currentLine = '';

        foreach ($words as $word) {
            $testLine = $currentLine . ' ' . $word;
            // Ici, vous vérifieriez la largeur du texte
            // Pour simplifier, on divise par nombre de caractères
            if (strlen($testLine) * ($options['size'] ?? 16) * 0.6 > $maxWidth) {
                $lines[] = trim($currentLine);
                $currentLine = $word;
            } else {
                $currentLine = $testLine;
            }
        }
        $lines[] = trim($currentLine);

        $y = $options['y'] ?? 0;
        foreach ($lines as $line) {
            $this->addText($image, $line, array_merge($options, ['y' => $y]));
            $y += ($options['size'] ?? 16) * 1.5;
        }
    }

    /**
     * Ajouter des éléments graphiques
     */
    protected function addGraphicElements($image, array $designData): void
    {
        // Ajouter des formes géométriques si configurées
        if (!empty($designData['shapes'])) {
            foreach ($designData['shapes'] as $shape) {
                $this->addShape($image, $shape);
            }
        }

        // Ajouter des images si configurées
        if (!empty($designData['images'])) {
            foreach ($designData['images'] as $imageData) {
                $this->addImage($image, $imageData);
            }
        }
    }

    /**
     * Ajouter une forme
     */
    protected function addShape($image, array $shapeData): void
    {
        $type = $shapeData['type'] ?? 'rectangle';
        $x = $shapeData['x'] ?? 0;
        $y = $shapeData['y'] ?? 0;
        $width = $shapeData['width'] ?? 100;
        $height = $shapeData['height'] ?? 100;
        $color = $shapeData['color'] ?? '#000000';

        switch ($type) {
            case 'rectangle':
                // $image->rectangle($x, $y, $x + $width, $y + $height, function($draw) use ($color) {
                //     $draw->background($color);
                // });
                break;
            case 'circle':
                // $image->circle($width, $x, $y, function($draw) use ($color) {
                //     $draw->background($color);
                // });
                break;
        }
    }

    /**
     * Ajouter une image
     */
    protected function addImage($image, array $imageData): void
    {
        $path = $imageData['path'] ?? '';
        $x = $imageData['x'] ?? 0;
        $y = $imageData['y'] ?? 0;
        $width = $imageData['width'] ?? 100;
        $height = $imageData['height'] ?? 100;

        if (Storage::disk('public')->exists($path)) {
            $imagePath = Storage::disk('public')->path($path);
            // $image->insert($imagePath, 'top-left', $x, $y);
        }
    }

    /**
     * Appliquer les paramètres d'export
     */
    protected function applyExportSettings($image, array $exportSettings): void
    {
        $quality = $exportSettings['quality'] ?? 'high';
        $resolution = $exportSettings['resolution'] ?? 300;

        // Ajuster la résolution
        if ($resolution !== 300) {
            $scale = $resolution / 300;
            $image->scale($scale);
        }

        // Ajuster la qualité (pour JPEG)
        if ($quality === 'low') {
            $image->quality(60);
        } elseif ($quality === 'medium') {
            $image->quality(80);
        } else {
            $image->quality(95);
        }
    }

    /**
     * Encoder l'image selon le format
     */
    protected function encodeImage($image, string $format, array $exportSettings): string
    {
        switch ($format) {
            case 'jpg':
            case 'jpeg':
                return $image->encode('jpg', $exportSettings['quality'] ?? 95);
            case 'png':
                return $image->encode('png');
            case 'webp':
                return $image->encode('webp', $exportSettings['quality'] ?? 95);
            default:
                return $image->encode('png');
        }
    }

    /**
     * Obtenir les données de design par défaut
     */
    protected function getDefaultDesignData(string $format): array
    {
        $defaults = [
            'a4' => [
                'background_color' => '#ffffff',
                'text_color' => '#000000',
                'accent_color' => '#007bff',
                'font_size' => 12,
                'font_family' => 'Arial',
                'margins' => ['top' => 20, 'right' => 20, 'bottom' => 20, 'left' => 20],
            ],
            'a5' => [
                'background_color' => '#ffffff',
                'text_color' => '#000000',
                'accent_color' => '#007bff',
                'font_size' => 10,
                'font_family' => 'Arial',
                'margins' => ['top' => 15, 'right' => 15, 'bottom' => 15, 'left' => 15],
            ],
            'square' => [
                'background_color' => '#ffffff',
                'text_color' => '#000000',
                'accent_color' => '#007bff',
                'font_size' => 24,
                'font_family' => 'Arial',
                'margins' => ['top' => 40, 'right' => 40, 'bottom' => 40, 'left' => 40],
            ],
            'story' => [
                'background_color' => '#ffffff',
                'text_color' => '#000000',
                'accent_color' => '#007bff',
                'font_size' => 18,
                'font_family' => 'Arial',
                'margins' => ['top' => 60, 'right' => 40, 'bottom' => 60, 'left' => 40],
            ],
            'post' => [
                'background_color' => '#ffffff',
                'text_color' => '#000000',
                'accent_color' => '#007bff',
                'font_size' => 16,
                'font_family' => 'Arial',
                'margins' => ['top' => 30, 'right' => 30, 'bottom' => 30, 'left' => 30],
            ],
        ];

        return $defaults[$format] ?? $defaults['a4'];
    }

    /**
     * Obtenir les paramètres d'export par défaut
     */
    protected function getDefaultExportSettings(): array
    {
        return [
            'format' => 'png',
            'quality' => 'high',
            'resolution' => 300,
            'compression' => 'none',
        ];
    }

    /**
     * Obtenir les templates disponibles
     */
    public function getAvailableTemplates(): array
    {
        return [
            'business' => [
                'name' => 'Business',
                'description' => 'Template professionnel pour entreprises',
                'colors' => ['#2c3e50', '#3498db', '#ecf0f1'],
                'fonts' => ['Arial', 'Helvetica'],
            ],
            'creative' => [
                'name' => 'Créatif',
                'description' => 'Template coloré et moderne',
                'colors' => ['#e74c3c', '#f39c12', '#27ae60'],
                'fonts' => ['Comic Sans MS', 'Arial'],
            ],
            'minimal' => [
                'name' => 'Minimaliste',
                'description' => 'Design épuré et élégant',
                'colors' => ['#000000', '#ffffff', '#cccccc'],
                'fonts' => ['Arial', 'Times New Roman'],
            ],
            'elegant' => [
                'name' => 'Élégant',
                'description' => 'Style sophistiqué et raffiné',
                'colors' => ['#8b4513', '#d2691e', '#f4a460'],
                'fonts' => ['Georgia', 'Times New Roman'],
            ],
        ];
    }

    /**
     * Appliquer un template à un flyer
     */
    public function applyTemplate(MarketingFlyer $flyer, string $templateName): void
    {
        $templates = $this->getAvailableTemplates();
        
        if (!isset($templates[$templateName])) {
            throw new \InvalidArgumentException('Template non trouvé : ' . $templateName);
        }

        $template = $templates[$templateName];
        $designData = $flyer->getDesignData();

        // Appliquer les couleurs du template
        $designData['template_colors'] = $template['colors'];
        $designData['primary_color'] = $template['colors'][0];
        $designData['secondary_color'] = $template['colors'][1];
        $designData['accent_color'] = $template['colors'][2];

        // Appliquer les polices du template
        $designData['template_fonts'] = $template['fonts'];
        $designData['font_family'] = $template['fonts'][0];

        $flyer->updateDesignData($designData);
        $flyer->setTemplateName($templateName);
    }

    /**
     * Dupliquer un flyer
     */
    public function duplicateFlyer(MarketingFlyer $flyer): MarketingFlyer
    {
        $newFlyer = $flyer->duplicate();
        
        // Générer un nouvel aperçu
        $this->generatePreview($newFlyer);
        
        return $newFlyer;
    }

    /**
     * Supprimer un flyer
     */
    public function deleteFlyer(MarketingFlyer $flyer): bool
    {
        try {
            // Supprimer les fichiers associés
            $this->cleanupFlyerFiles($flyer);
            
            // Supprimer le flyer
            return $flyer->delete();
            
        } catch (\Exception $e) {
            Log::error('Flyer deletion failed', [
                'flyer_id' => $flyer->id,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Nettoyer les fichiers d'un flyer
     */
    protected function cleanupFlyerFiles(MarketingFlyer $flyer): void
    {
        // Supprimer l'aperçu
        $previewPath = "flyers/previews/preview_{$flyer->id}.png";
        if (Storage::disk('public')->exists($previewPath)) {
            Storage::disk('public')->delete($previewPath);
        }

        // Supprimer les exports
        $exportPattern = "flyers/exports/flyer_{$flyer->id}_*";
        $files = Storage::disk('public')->files('flyers/exports');
        foreach ($files as $file) {
            if (str_contains($file, "flyer_{$flyer->id}_")) {
                Storage::disk('public')->delete($file);
            }
        }
    }
}