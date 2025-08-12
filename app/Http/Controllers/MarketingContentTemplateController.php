<?php

namespace App\Http\Controllers;

use App\Models\MarketingContentTemplate;
use App\Services\AIContentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class MarketingContentTemplateController extends Controller
{
    protected $aiService;

    public function __construct(AIContentService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Afficher la liste des templates
     */
    public function index(Request $request)
    {
        $query = MarketingContentTemplate::where('user_id', auth()->id());

        // Filtres
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('platform')) {
            $query->whereJsonContains('platforms', $request->platform);
        }

        $templates = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Marketing/Templates/Index', [
            'templates' => $templates,
            'filters' => $request->only(['search', 'type', 'status', 'platform'])
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        $types = MarketingContentTemplate::getTypeOptions();
        $tones = MarketingContentTemplate::getToneOptions();
        $platforms = MarketingContentTemplate::getPlatformOptions();

        return Inertia::render('Marketing/Templates/Create', [
            'types' => $types,
            'tones' => $tones,
            'platforms' => $platforms
        ]);
    }

    /**
     * Stocker un nouveau template
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|in:social_post,article,email,flyer,ad_copy',
            'content_structure' => 'required|string|max:2000',
            'variables' => 'nullable|array',
            'default_values' => 'nullable|array',
            'platforms' => 'nullable|array',
            'tone' => 'required|string|in:professional,casual,friendly,persuasive,informative',
            'ai_settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $template = MarketingContentTemplate::create([
                'user_id' => auth()->id(),
                'name' => $request->name,
                'description' => $request->description,
                'type' => $request->type,
                'content_structure' => $request->content_structure,
                'variables' => $request->variables ?? [],
                'default_values' => $request->default_values ?? [],
                'platforms' => $request->platforms ?? [],
                'tone' => $request->tone,
                'ai_settings' => $request->ai_settings ?? [],
                'is_active' => true,
            ]);

            return redirect()->route('marketing.templates.index')
                ->with('success', 'Template créé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de template: ' . $e->getMessage());
            return back()->withErrors(['creation' => 'Erreur lors de la création: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Afficher un template spécifique
     */
    public function show(MarketingContentTemplate $template)
    {
        $this->authorize('view', $template);

        return Inertia::render('Marketing/Templates/Show', [
            'template' => $template
        ]);
    }

    /**
     * Afficher le formulaire de modification
     */
    public function edit(MarketingContentTemplate $template)
    {
        $this->authorize('update', $template);

        $types = MarketingContentTemplate::getTypeOptions();
        $tones = MarketingContentTemplate::getToneOptions();
        $platforms = MarketingContentTemplate::getPlatformOptions();

        return Inertia::render('Marketing/Templates/Edit', [
            'template' => $template,
            'types' => $types,
            'tones' => $tones,
            'platforms' => $platforms
        ]);
    }

    /**
     * Mettre à jour un template
     */
    public function update(Request $request, MarketingContentTemplate $template)
    {
        $this->authorize('update', $template);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|in:social_post,article,email,flyer,ad_copy',
            'content_structure' => 'required|string|max:2000',
            'variables' => 'nullable|array',
            'default_values' => 'nullable|array',
            'platforms' => 'nullable|array',
            'tone' => 'required|string|in:professional,casual,friendly,persuasive,informative',
            'ai_settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $template->update($request->all());

            return back()->with('success', 'Template mis à jour avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de template: ' . $e->getMessage());
            return back()->withErrors(['update' => 'Erreur lors de la mise à jour: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Supprimer un template
     */
    public function destroy(MarketingContentTemplate $template)
    {
        $this->authorize('delete', $template);

        try {
            $template->delete();

            return redirect()->route('marketing.templates.index')
                ->with('success', 'Template supprimé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de template: ' . $e->getMessage());
            return back()->withErrors(['delete' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
    }

    /**
     * Activer un template
     */
    public function activate(MarketingContentTemplate $template)
    {
        $this->authorize('update', $template);

        try {
            $template->activate();

            return back()->with('success', 'Template activé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'activation de template: ' . $e->getMessage());
            return back()->withErrors(['activation' => 'Erreur lors de l\'activation: ' . $e->getMessage()]);
        }
    }

    /**
     * Désactiver un template
     */
    public function deactivate(MarketingContentTemplate $template)
    {
        $this->authorize('update', $template);

        try {
            $template->deactivate();

            return back()->with('success', 'Template désactivé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la désactivation de template: ' . $e->getMessage());
            return back()->withErrors(['deactivation' => 'Erreur lors de la désactivation: ' . $e->getMessage()]);
        }
    }

    /**
     * Dupliquer un template
     */
    public function duplicate(MarketingContentTemplate $template)
    {
        $this->authorize('view', $template);

        try {
            $newTemplate = $template->duplicate();

            return redirect()->route('marketing.templates.edit', $newTemplate)
                ->with('success', 'Template dupliqué avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la duplication de template: ' . $e->getMessage());
            return back()->withErrors(['duplication' => 'Erreur lors de la duplication: ' . $e->getMessage()]);
        }
    }

    /**
     * Générer du contenu avec un template
     */
    public function generateContent(Request $request, MarketingContentTemplate $template)
    {
        $this->authorize('view', $template);

        $validator = Validator::make($request->all(), [
            'variables' => 'nullable|array',
            'use_ai' => 'boolean',
            'ai_prompt' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $variables = array_merge(
                $template->getDefaultValues(),
                $request->variables ?? []
            );

            if ($request->use_ai && $template->isAIGenerated()) {
                // Utiliser l'IA pour générer le contenu
                $content = $this->aiService->generateMarketingContent(
                    $template->type,
                    $template->name,
                    [
                        'template' => $template,
                        'variables' => $variables,
                        'ai_prompt' => $request->ai_prompt,
                        'user_id' => auth()->id(),
                    ]
                );
            } else {
                // Utiliser le template standard
                $content = $template->generateContent($variables);
            }

            return response()->json([
                'success' => true,
                'content' => $content,
                'variables_used' => $variables
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de contenu: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prévisualiser un template
     */
    public function preview(MarketingContentTemplate $template)
    {
        $this->authorize('view', $template);

        try {
            // Utiliser les valeurs par défaut pour la prévisualisation
            $variables = $template->getDefaultValues();
            $content = $template->generateContent($variables);

            return response()->json([
                'success' => true,
                'preview' => $content,
                'variables' => $variables
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la prévisualisation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la prévisualisation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valider les variables d'un template
     */
    public function validateVariables(Request $request, MarketingContentTemplate $template)
    {
        $this->authorize('view', $template);

        $validator = Validator::make($request->all(), [
            'variables' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validationResult = $template->validateVariables($request->variables);

            return response()->json([
                'success' => true,
                'is_valid' => $validationResult['is_valid'],
                'errors' => $validationResult['errors'] ?? [],
                'warnings' => $validationResult['warnings'] ?? [],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la validation des variables: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la validation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques d'utilisation d'un template
     */
    public function getUsageStats(MarketingContentTemplate $template)
    {
        $this->authorize('view', $template);

        $stats = [
            'usage_count' => $template->getUsageCount(),
            'last_used_at' => $template->getLastUsedAt(),
            'is_popular' => $template->getUsageCount() > 10,
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    /**
     * Rechercher des templates par type
     */
    public function searchByType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:social_post,article,email,flyer,ad_copy',
            'platform' => 'nullable|string',
            'tone' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = MarketingContentTemplate::where('user_id', auth()->id())
                ->where('type', $request->type)
                ->where('is_active', true);

            if ($request->filled('platform')) {
                $query->whereJsonContains('platforms', $request->platform);
            }

            if ($request->filled('tone')) {
                $query->where('tone', $request->tone);
            }

            $templates = $query->orderBy('usage_count', 'desc')
                ->take(10)
                ->get();

            return response()->json([
                'success' => true,
                'templates' => $templates
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la recherche de templates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la recherche: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les suggestions de templates
     */
    public function getSuggestions(Request $request)
    {
        try {
            $suggestions = [];

            // Templates les plus utilisés
            $popularTemplates = MarketingContentTemplate::where('user_id', auth()->id())
                ->where('is_active', true)
                ->orderBy('usage_count', 'desc')
                ->take(5)
                ->get();

            $suggestions['popular'] = $popularTemplates;

            // Templates récents
            $recentTemplates = MarketingContentTemplate::where('user_id', auth()->id())
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            $suggestions['recent'] = $recentTemplates;

            // Templates par type
            $templatesByType = MarketingContentTemplate::where('user_id', auth()->id())
                ->where('is_active', true)
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->orderBy('count', 'desc')
                ->get();

            $suggestions['by_type'] = $templatesByType;

            return response()->json([
                'success' => true,
                'suggestions' => $suggestions
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des suggestions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des suggestions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Importer des templates depuis un fichier
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:json,csv|max:2048',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();

            if ($extension === 'json') {
                $this->importFromJson($file);
            } else {
                $this->importFromCsv($file);
            }

            return back()->with('success', 'Import des templates réussi.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'import de templates: ' . $e->getMessage());
            return back()->withErrors(['import' => 'Erreur lors de l\'import: ' . $e->getMessage()]);
        }
    }

    /**
     * Exporter les templates
     */
    public function export(Request $request)
    {
        try {
            $query = MarketingContentTemplate::where('user_id', auth()->id());

            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            if ($request->filled('status')) {
                $query->where('is_active', $request->status === 'active');
            }

            $templates = $query->get();

            $filename = 'templates-marketing-' . date('Y-m-d') . '.json';
            
            return response()->json($templates)
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Content-Type', 'application/json');

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'export de templates: ' . $e->getMessage());
            return back()->withErrors(['export' => 'Erreur lors de l\'export: ' . $e->getMessage()]);
        }
    }

    /**
     * Importer depuis un fichier JSON
     */
    private function importFromJson($file)
    {
        $content = file_get_contents($file->getPathname());
        $templates = json_decode($content, true);

        if (!is_array($templates)) {
            throw new \Exception('Format de fichier JSON invalide');
        }

        foreach ($templates as $templateData) {
            $templateData['user_id'] = auth()->id();
            $templateData['is_active'] = false; // Désactiver par défaut pour vérification
            
            MarketingContentTemplate::create($templateData);
        }
    }

    /**
     * Importer depuis un fichier CSV
     */
    private function importFromCsv($file)
    {
        $handle = fopen($file->getPathname(), 'r');
        $headers = fgetcsv($handle);
        
        while (($data = fgetcsv($handle)) !== false) {
            $row = array_combine($headers, $data);
            
            $this->createTemplateFromImport($row);
        }
        
        fclose($handle);
    }

    /**
     * Créer un template depuis les données d'import
     */
    private function createTemplateFromImport($row)
    {
        $templateData = [
            'user_id' => auth()->id(),
            'name' => $row['name'] ?? $row['nom'] ?? '',
            'description' => $row['description'] ?? $row['description'] ?? '',
            'type' => $row['type'] ?? 'social_post',
            'content_structure' => $row['content_structure'] ?? $row['structure'] ?? '',
            'tone' => $row['tone'] ?? 'professional',
            'is_active' => false,
        ];

        // Nettoyer et valider les données
        if (empty($templateData['name']) || empty($templateData['content_structure'])) {
            return; // Ignorer les lignes invalides
        }

        // Vérifier si le template existe déjà
        $existingTemplate = MarketingContentTemplate::where('user_id', auth()->id())
            ->where('name', $templateData['name'])
            ->first();

        if (!$existingTemplate) {
            MarketingContentTemplate::create($templateData);
        }
    }
}