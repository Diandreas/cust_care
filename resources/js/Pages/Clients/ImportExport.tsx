import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';

// UI Components
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import {
    RefreshCw,
    Upload,
    Download,
    FileText,
    ArrowLeft,
    FileSpreadsheet,
    Users,
    CheckCircle,
    AlertCircle,
    Info,
    ChevronRight,
    Zap
} from 'lucide-react';

export default function ImportExport({ auth }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
    const [importMethod, setImportMethod] = useState<'csv' | 'simple'>('csv');

    // Import states
    const [importLoading, setImportLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [contactsText, setContactsText] = useState('');

    // Export states
    const [exportLoading, setExportLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
    const [exportFilter, setExportFilter] = useState<'all' | 'filtered'>('all');

    // Fonction pour parser CSV de manière robuste
    const parseCSVLine = (line: string): string[] => {
        console.log('Parsing de la ligne:', line);

        // Si le séparateur semble être un point-virgule, l'utiliser à la place de la virgule
        const separator = line.includes(';') && !line.includes(',') ? ';' : ',';
        console.log('Séparateur détecté:', separator);

        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === separator && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        console.log('Résultat du parsing:', result);
        return result;
    };

    // Handle file analysis for CSV import
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);

        if (file) {
            // Vérifier la taille du fichier (limite à 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Le fichier est trop volumineux (max 5MB)');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string;
                    const lines = text.split(/\r?\n/).filter(line => line.trim());

                    if (lines.length < 2) {
                        toast.error(t('import.fileEmpty') || 'Fichier vide ou invalide');
                        return;
                    }

                    // Parser la première ligne (headers)
                    const headers = parseCSVLine(lines[0]);
                    console.log('En-têtes détectés:', headers);

                    if (headers.length === 0) {
                        toast.error('Aucune colonne détectée dans le fichier');
                        return;
                    }

                    // Auto-map columns avec une logique améliorée
                    const initialMapping: Record<string, string> = {};
                    headers.forEach((header, index) => {
                        const normalizedHeader = header.toLowerCase().trim();
                        console.log('Traitement de l\'en-tête:', header, 'normalisé:', normalizedHeader);

                        // Correction: Utiliser l'index pour s'assurer que le mapping est correct
                        // Les deux premières colonnes sont généralement nom et téléphone
                        if (index === 0) {
                            initialMapping[header] = 'name';
                        } else if (index === 1) {
                            initialMapping[header] = 'phone';
                        } else if (normalizedHeader.includes('email') || normalizedHeader.includes('mail') ||
                            normalizedHeader.includes('e-mail')) {
                            initialMapping[header] = 'email';
                        } else if (normalizedHeader.includes('birth') || normalizedHeader.includes('naissance') ||
                            normalizedHeader.includes('birthday') || normalizedHeader.includes('né') ||
                            normalizedHeader.includes('anniversaire')) {
                            initialMapping[header] = 'birthday';
                        } else if (normalizedHeader.includes('address') || normalizedHeader.includes('adresse') ||
                            normalizedHeader.includes('rue')) {
                            initialMapping[header] = 'address';
                        } else if (normalizedHeader.includes('note') || normalizedHeader.includes('comment') ||
                            normalizedHeader.includes('remarque')) {
                            initialMapping[header] = 'notes';
                        } else if (normalizedHeader.includes('tag') || normalizedHeader.includes('étiquette') ||
                            normalizedHeader.includes('label')) {
                            initialMapping[header] = 'tags';
                        } else {
                            initialMapping[header] = 'ignore';
                        }
                    });
                    console.log('Mappage initial:', initialMapping);
                    setFieldMapping(initialMapping);

                    // Preview first 5 rows avec parsing amélioré
                    const previewRows = [];
                    for (let i = 1; i < Math.min(6, lines.length); i++) {
                        if (lines[i].trim()) {
                            const values = parseCSVLine(lines[i]);
                            console.log(`Ligne ${i} valeurs:`, values);

                            const row: Record<string, string> = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index] || '';
                            });
                            previewRows.push(row);
                        }
                    }
                    console.log('Lignes de prévisualisation:', previewRows);
                    setPreviewData(previewRows);
                } catch (err) {
                    console.error('Error parsing file:', err);
                    toast.error(t('import.fileError') || 'Erreur lors de la lecture du fichier');
                }
            };

            reader.onerror = () => {
                toast.error('Erreur lors de la lecture du fichier');
            };

            reader.readAsText(file, 'UTF-8');
        } else {
            setFieldMapping({});
            setPreviewData([]);
        }
    };

    // Handle CSV import submission
    const handleCsvImport = async () => {
        if (!selectedFile) {
            toast.error(t('import.fileRequired') || 'Veuillez sélectionner un fichier');
            return;
        }

        // Check if at least name and phone are mapped
        const mappedFields = Object.values(fieldMapping).filter(v => v !== 'ignore');
        if (!mappedFields.includes('name') || !mappedFields.includes('phone')) {
            toast.error('Les champs Nom et Téléphone sont obligatoires');
            return;
        }

        setImportLoading(true);

        try {
            // Vérifier que la route existe
            if (typeof route !== 'function') {
                throw new Error('La fonction route() n\'est pas disponible');
            }

            // Get CSRF token plus robuste
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                document.querySelector('input[name="_token"]')?.getAttribute('value');

            if (!csrfToken) {
                throw new Error('Token CSRF non trouvé');
            }

            // Vérification du mappage avant envoi
            console.log('Mappage avant envoi:', fieldMapping);

            // Log des données de prévisualisation pour debug
            console.log('Données prévisualisées:', previewData);

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('mapping', JSON.stringify(fieldMapping));
            formData.append('_token', csrfToken);

            // Ajouter des logs pour voir ce qui est envoyé
            console.log('Fichier envoyé:', selectedFile.name);
            console.log('Taille du fichier:', selectedFile.size);

            const response = await axios.post(route('clients.import'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                timeout: 30000 // 30 secondes timeout
            });

            setImportLoading(false);

            if (response.data && response.data.success !== false) {
                const importedCount = response.data.imported || 0;
                toast.success(t('import.success', { count: importedCount }) || `${importedCount} contacts importés avec succès`);
                router.visit(route('clients.index'));
            } else {
                throw new Error(response.data.message || 'Échec de l\'importation');
            }
        } catch (err: any) {
            setImportLoading(false);

            console.error('Import error:', err);

            if (err.code === 'ECONNABORTED') {
                toast.error('Timeout: L\'importation prend trop de temps');
            } else if (err.response?.status === 403) {
                toast.error(t('subscription.limit.upgradeRequired') || 'Limite d\'abonnement atteinte');
            } else if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                if (errors) {
                    const errorMessages = Object.values(errors).flat().join(', ');
                    toast.error(`Erreur de validation: ${errorMessages}`);
                } else {
                    toast.error('Données invalides');
                }
            } else if (err.response?.status === 419) {
                toast.error('Session expirée. Veuillez recharger la page.');
            } else if (err.response?.status === 500) {
                toast.error('Erreur serveur. Veuillez réessayer plus tard.');
            } else {
                const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
                toast.error(`Erreur d'importation: ${errorMessage}`);
            }
        }
    };

    // Handle simple import submission
    const handleSimpleImport = async () => {
        if (!contactsText.trim()) {
            toast.error(t('import.noContacts') || 'Aucun contact à importer');
            return;
        }

        setImportLoading(true);

        try {
            // Parse contacts from text area avec validation améliorée
            const lines = contactsText.trim().split('\n');
            const contacts = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                const parts = trimmedLine.split('-').map(part => part.trim());
                if (parts.length >= 2 && parts[0] && parts[1]) {
                    // Validation basique du numéro de téléphone
                    const phoneRegex = /^[\d\s\+\-\(\)\.]{6,}$/;
                    if (phoneRegex.test(parts[1])) {
                        contacts.push({
                            name: parts[0],
                            phone: parts[1]
                        });
                    }
                }
            }

            if (contacts.length === 0) {
                toast.error(t('import.noValidContacts') || 'Aucun contact valide trouvé');
                setImportLoading(false);
                return;
            }

            // Vérifier que la route existe
            if (typeof route !== 'function') {
                throw new Error('La fonction route() n\'est pas disponible');
            }

            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (!csrfToken) {
                // Essayer de récupérer un nouveau token CSRF
                await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
            }

            const response = await axios.post(route('clients.import.simple'), {
                contacts: JSON.stringify(contacts)
            }, {
                withCredentials: true,
                headers: {
                    'X-CSRF-TOKEN': csrfToken || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            setImportLoading(false);

            if (response.data && response.data.success !== false) {
                const importedCount = response.data.imported || 0;
                toast.success(t('import.success', { count: importedCount }) || `${importedCount} contacts importés avec succès`);
                router.visit(route('clients.index'));
            } else {
                throw new Error(response.data.message || 'Échec de l\'importation');
            }
        } catch (err: any) {
            setImportLoading(false);

            console.error('Simple import error:', err);

            if (err.code === 'ECONNABORTED') {
                toast.error('Timeout: L\'importation prend trop de temps');
            } else if (err.response?.status === 419) {
                toast.error("Session expirée. Veuillez recharger la page.");
            } else if (err.response?.status === 403) {
                toast.error(t('subscription.limit.upgradeRequired') || 'Limite d\'abonnement atteinte');
            } else if (err.response?.status === 500) {
                toast.error('Erreur serveur. Veuillez réessayer plus tard.');
            } else {
                const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
                toast.error(`Erreur d'importation: ${errorMessage}`);
            }
        }
    };

    // Handle export
    const handleExport = () => {
        setExportLoading(true);

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('format', exportFormat);

            if (exportFilter === 'filtered') {
                // Récupérer les filtres de la session ou localStorage si nécessaire
                const savedFilters = localStorage.getItem('clientFilters');
                if (savedFilters) {
                    const filters = JSON.parse(savedFilters);
                    if (filters.search) queryParams.append('search', filters.search);
                    if (filters.tagId) queryParams.append('tag_id', filters.tagId);
                }
            }

            // Rediriger vers l'URL d'exportation
            window.location.href = `${route('clients.export')}?${queryParams.toString()}`;

            // Simuler un délai avant de désactiver le loader
            setTimeout(() => {
                setExportLoading(false);
                toast.success('Exportation réussie');
            }, 2000);
        } catch (error) {
            setExportLoading(false);
            toast.error('Erreur lors de l\'exportation');
            console.error('Export error:', error);
        }
    };

    const requiredFields = Object.values(fieldMapping).filter(v => ['name', 'phone'].includes(v));
    const isImportReady = selectedFile && requiredFields.length >= 2;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100 leading-tight">
                                {t('clients.importExport') || 'Gestion des Contacts'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Importez et exportez vos contacts facilement
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.visit(route('clients.index'))}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:border-gray-400 dark:border-slate-600 dark:hover:border-slate-500"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
                </div>
            }
        >
            <Head title={t('clients.importExport') || 'Importation / Exportation'} />

            <div className="py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-700/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Import CSV</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fichier</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800/50 dark:to-slate-700/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Import Simple</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Texte</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50 dark:from-slate-800/50 dark:to-slate-700/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Export</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Multi-format</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'import' | 'export')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border-0">
                            <TabsTrigger
                                value="import"
                                className="flex items-center gap-3 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 font-medium"
                            >
                                <Upload className="h-4 w-4" />
                                Importer des contacts
                            </TabsTrigger>
                            <TabsTrigger
                                value="export"
                                className="flex items-center gap-3 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 font-medium"
                            >
                                <Download className="h-4 w-4" />
                                Exporter des contacts
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="import" className="mt-8 space-y-6">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Méthode d'importation</CardTitle>
                                            <CardDescription className="text-sm">
                                                Choisissez comment vous souhaitez importer vos contacts
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Tabs value={importMethod} onValueChange={(val) => setImportMethod(val as 'csv' | 'simple')} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                            <TabsTrigger
                                                value="csv"
                                                className="flex items-center gap-2 h-9 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                                            >
                                                <FileSpreadsheet className="h-4 w-4" />
                                                Fichier CSV
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="simple"
                                                className="flex items-center gap-2 h-9 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Format simple
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="csv" className="mt-6 space-y-6">
                                            {/* File Upload Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="file_import" className="text-sm font-medium">
                                                        Sélectionner un fichier
                                                    </Label>
                                                    {selectedFile && (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            {selectedFile.name}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="relative">
                                                    <Input
                                                        id="file_import"
                                                        type="file"
                                                        accept=".csv,.txt"
                                                        onChange={handleFileChange}
                                                        className="h-12 bg-white border-2 border-dashed border-gray-300 hover:border-gray-400 dark:bg-slate-800 dark:border-slate-600 dark:hover:border-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                                                        disabled={importLoading}
                                                    />
                                                </div>

                                                <Alert>
                                                    <Info className="h-4 w-4" />
                                                    <AlertDescription className="text-xs">
                                                        Formats acceptés: CSV, TXT • Taille maximale: 5MB • Encodage: UTF-8 recommandé
                                                    </AlertDescription>
                                                </Alert>
                                            </div>

                                            {/* Preview Section */}
                                            {previewData.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center space-x-2">
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                                            Aperçu des données
                                                        </h3>
                                                        <Badge variant="outline">
                                                            {previewData.length} lignes détectées
                                                        </Badge>
                                                    </div>

                                                    <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                                                        <ScrollArea className="h-48">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-50 dark:bg-slate-800/50">
                                                                        {Object.keys(previewData[0]).map(header => (
                                                                            <TableHead key={header} className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                                                {header}
                                                                            </TableHead>
                                                                        ))}
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {previewData.map((row, rowIndex) => (
                                                                        <TableRow key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                                                            {Object.entries(row).map(([key, value]) => (
                                                                                <TableCell key={key} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                                                    {value || <span className="text-gray-400 italic">vide</span>}
                                                                                </TableCell>
                                                                            ))}
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </ScrollArea>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Field Mapping Section */}
                                            {Object.keys(fieldMapping).length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <Zap className="h-5 w-5 text-orange-500" />
                                                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                                                Correspondance des champs
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {requiredFields.includes('name') && (
                                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Nom mappé
                                                                </Badge>
                                                            )}
                                                            {requiredFields.includes('phone') && (
                                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Téléphone mappé
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Alert>
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription className="text-xs">
                                                            Associez les colonnes de votre fichier aux champs de l'application. Les champs <strong>Nom</strong> et <strong>Téléphone</strong> sont obligatoires.
                                                        </AlertDescription>
                                                    </Alert>

                                                    <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                                                        <ScrollArea className="max-h-80">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                {Object.entries(fieldMapping).map(([csvField, appField]) => (
                                                                    <div key={csvField} className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <Label htmlFor={`mapping_${csvField}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                                {csvField}
                                                                            </Label>
                                                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                                                        </div>
                                                                        <Select
                                                                            value={appField}
                                                                            onValueChange={(val) => setFieldMapping({
                                                                                ...fieldMapping,
                                                                                [csvField]: val,
                                                                            })}
                                                                            disabled={importLoading}
                                                                        >
                                                                            <SelectTrigger
                                                                                id={`mapping_${csvField}`}
                                                                                className={`h-10 ${['name', 'phone'].includes(appField)
                                                                                        ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                                                                                        : 'border-gray-300 dark:border-slate-600'
                                                                                    }`}
                                                                            >
                                                                                <SelectValue placeholder="Ignorer" />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                                                                <SelectItem value="ignore" className="text-gray-500">
                                                                                    <span className="flex items-center">
                                                                                        Ignorer ce champ
                                                                                    </span>
                                                                                </SelectItem>
                                                                                <Separator className="my-1" />
                                                                                <SelectItem value="name" className="font-medium">
                                                                                    <span className="flex items-center">
                                                                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                                                        Nom *
                                                                                    </span>
                                                                                </SelectItem>
                                                                                <SelectItem value="phone" className="font-medium">
                                                                                    <span className="flex items-center">
                                                                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                                                        Téléphone *
                                                                                    </span>
                                                                                </SelectItem>
                                                                                <Separator className="my-1" />
                                                                                <SelectItem value="email">Email</SelectItem>
                                                                                <SelectItem value="birthday">Anniversaire</SelectItem>
                                                                                <SelectItem value="address">Adresse</SelectItem>
                                                                                <SelectItem value="notes">Notes</SelectItem>
                                                                                <SelectItem value="tags">Tags</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Import Button */}
                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    onClick={handleCsvImport}
                                                    disabled={importLoading || !isImportReady}
                                                    size="lg"
                                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {importLoading ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                                            Importation en cours...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-5 w-5" />
                                                            Importer {selectedFile ? `(${Object.keys(fieldMapping).length} colonnes)` : ''}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="simple" className="mt-6 space-y-6">
                                            {/* Instructions */}
                                            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <AlertDescription className="text-blue-800 dark:text-blue-300">
                                                    <strong>Format requis:</strong> Nom - Numéro de téléphone (un contact par ligne)
                                                    <br />
                                                    <strong>Exemple:</strong> Jean Dupont - 0123456789
                                                </AlertDescription>
                                            </Alert>

                                            <div className="space-y-3">
                                                <Label htmlFor="contacts_text" className="text-sm font-medium">
                                                    Liste des contacts
                                                </Label>
                                                <Textarea
                                                    id="contacts_text"
                                                    value={contactsText}
                                                    onChange={(e) => setContactsText(e.target.value)}
                                                    rows={12}
                                                    placeholder={`Jean Dupont - 0123456789
Marie Martin - 0987654321
Pierre Durand - 0156789432
Sophie Leblanc - 0178945623

Ajoutez un contact par ligne...`}
                                                    className="font-mono text-sm resize-none border-2 border-gray-300 focus:border-blue-500 dark:border-slate-600 dark:focus:border-blue-400 dark:bg-slate-800"
                                                    disabled={importLoading}
                                                />
                                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                    <span>
                                                        {contactsText.trim().split('\n').filter(line => line.trim()).length} lignes détectées
                                                    </span>
                                                    <span>Format: Nom - Numéro</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    onClick={handleSimpleImport}
                                                    disabled={importLoading || !contactsText.trim()}
                                                    size="lg"
                                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                                                >
                                                    {importLoading ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                                            Importation en cours...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-5 w-5" />
                                                            Importer les contacts
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="export" className="mt-8">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Exportation de contacts</CardTitle>
                                            <CardDescription className="text-sm">
                                                Téléchargez vos contacts dans le format de votre choix
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Export Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="export_format" className="text-sm font-medium">
                                                Format d'exportation
                                            </Label>
                                            <Select
                                                value={exportFormat}
                                                onValueChange={(val) => setExportFormat(val as 'csv' | 'excel')}
                                                disabled={exportLoading}
                                            >
                                                <SelectTrigger id="export_format" className="h-12 border-2 border-gray-300 dark:border-slate-600">
                                                    <SelectValue placeholder="Sélectionner un format" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                                    <SelectItem value="csv" className="py-3">
                                                        <div className="flex items-center space-x-3">
                                                            <FileText className="h-4 w-4 text-blue-500" />
                                                            <div>
                                                                <div className="font-medium">CSV</div>
                                                                <div className="text-xs text-gray-500">Compatible avec Excel, Google Sheets</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="excel" className="py-3">
                                                        <div className="flex items-center space-x-3">
                                                            <FileSpreadsheet className="h-4 w-4 text-green-500" />
                                                            <div>
                                                                <div className="font-medium">Excel (XLSX)</div>
                                                                <div className="text-xs text-gray-500">Format natif Microsoft Excel</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="export_filter" className="text-sm font-medium">
                                                Sélection des contacts
                                            </Label>
                                            <Select
                                                value={exportFilter}
                                                onValueChange={(val) => setExportFilter(val as 'all' | 'filtered')}
                                                disabled={exportLoading}
                                            >
                                                <SelectTrigger id="export_filter" className="h-12 border-2 border-gray-300 dark:border-slate-600">
                                                    <SelectValue placeholder="Sélectionner un filtre" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                                    <SelectItem value="all" className="py-3">
                                                        <div className="flex items-center space-x-3">
                                                            <Users className="h-4 w-4 text-blue-500" />
                                                            <div>
                                                                <div className="font-medium">Tous les contacts</div>
                                                                <div className="text-xs text-gray-500">Exporter l'intégralité de votre base</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="filtered" className="py-3">
                                                        <div className="flex items-center space-x-3">
                                                            <CheckCircle className="h-4 w-4 text-orange-500" />
                                                            <div>
                                                                <div className="font-medium">Contacts filtrés</div>
                                                                <div className="text-xs text-gray-500">Selon vos filtres actuels</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Export Preview Info */}
                                    <Alert className="border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Colonnes exportées:</strong> Nom, Téléphone, Email, Anniversaire, Adresse, Notes, Tags
                                            <br />
                                            <strong>Encodage:</strong> UTF-8 pour une compatibilité maximale
                                        </AlertDescription>
                                    </Alert>

                                    {/* Export Button */}
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleExport}
                                            disabled={exportLoading}
                                            size="lg"
                                            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                                        >
                                            {exportLoading ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                                    Préparation du fichier...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-5 w-5" />
                                                    Télécharger ({exportFormat.toUpperCase()})
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}