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
import { RefreshCw, Upload, Download, FileText, ArrowLeft } from 'lucide-react';

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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        {t('clients.importExport') || 'Importation / Exportation de Clients'}
                    </h2>
                    <Button
                        onClick={() => router.visit(route('clients.index'))}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('common.back') || 'Retour'}
                    </Button>
                </div>
            }
        >
            <Head title={t('clients.importExport') || 'Importation / Exportation'} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'import' | 'export')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="import" className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                {t('import.title') || 'Importer des contacts'}
                            </TabsTrigger>
                            <TabsTrigger value="export" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                {t('export.title') || 'Exporter des contacts'}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="import" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('import.method') || 'Méthode d\'importation'}</CardTitle>
                                    <CardDescription>
                                        {t('import.methodDescription') || 'Choisissez comment vous souhaitez importer vos contacts'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs value={importMethod} onValueChange={(val) => setImportMethod(val as 'csv' | 'simple')} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-6">
                                            <TabsTrigger value="csv" className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                {t('import.fromCSV') || 'Depuis CSV'}
                                            </TabsTrigger>
                                            <TabsTrigger value="simple">
                                                {t('import.simpleFormat') || 'Format simple'}
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="csv" className="space-y-6">
                                            <div>
                                                <Label htmlFor="file_import">{t('import.selectFile') || 'Sélectionner un fichier'}</Label>
                                                <Input
                                                    id="file_import"
                                                    type="file"
                                                    accept=".csv,.txt"
                                                    onChange={handleFileChange}
                                                    className="mt-1 bg-white border-border/60 dark:bg-slate-700 dark:border-slate-600"
                                                    disabled={importLoading}
                                                />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {t('import.fileFormats') || 'Formats acceptés: CSV, TXT (max 5MB)'}
                                                </p>
                                            </div>

                                            {previewData.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                        {t('import.preview') || 'Aperçu'}
                                                    </h3>
                                                    <ScrollArea className="h-40 rounded-md border border-border/60 bg-gray-50/80 p-2 dark:border-slate-700/60 dark:bg-slate-700/80">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="dark:border-slate-600">
                                                                    {Object.keys(previewData[0]).map(header => (
                                                                        <TableHead key={header} className="px-3 py-2 text-xs font-medium">
                                                                            {header}
                                                                        </TableHead>
                                                                    ))}
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {previewData.map((row, rowIndex) => (
                                                                    <TableRow key={rowIndex} className="dark:border-slate-600">
                                                                        {Object.entries(row).map(([key, value]) => (
                                                                            <TableCell key={key} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                                                {value}
                                                                            </TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </ScrollArea>
                                                </div>
                                            )}

                                            {Object.keys(fieldMapping).length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {t('import.fieldMapping') || 'Correspondance des champs'}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                                                        {t('import.fieldMappingDescription') || 'Associez les colonnes de votre fichier aux champs de l\'application'}
                                                    </p>
                                                    <ScrollArea className="h-60 pr-4">
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            {Object.entries(fieldMapping).map(([csvField, appField]) => (
                                                                <div key={csvField}>
                                                                    <Label htmlFor={`mapping_${csvField}`} className="text-sm font-medium">
                                                                        {csvField}
                                                                    </Label>
                                                                    <Select
                                                                        value={appField}
                                                                        onValueChange={(val) => setFieldMapping({
                                                                            ...fieldMapping,
                                                                            [csvField]: val,
                                                                        })}
                                                                        disabled={importLoading}
                                                                    >
                                                                        <SelectTrigger id={`mapping_${csvField}`} className="mt-1 w-full border-border/60 dark:bg-slate-700 dark:border-slate-600">
                                                                            <SelectValue placeholder={t('import.ignore') || 'Ignorer'} />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                                            <SelectItem value="ignore">{t('import.ignore') || 'Ignorer'}</SelectItem>
                                                                            <SelectItem value="name">{t('common.name') || 'Nom'} *</SelectItem>
                                                                            <SelectItem value="phone">{t('common.phone') || 'Téléphone'} *</SelectItem>
                                                                            <SelectItem value="email">{t('common.email') || 'Email'}</SelectItem>
                                                                            <SelectItem value="birthday">{t('common.birthday') || 'Anniversaire'}</SelectItem>
                                                                            <SelectItem value="address">{t('common.address') || 'Adresse'}</SelectItem>
                                                                            <SelectItem value="notes">{t('common.notes') || 'Notes'}</SelectItem>
                                                                            <SelectItem value="tags">{t('common.tags') || 'Tags'}</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                        * Champs obligatoires
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleCsvImport}
                                                    disabled={
                                                        importLoading ||
                                                        !selectedFile ||
                                                        Object.values(fieldMapping).filter(v => v !== 'ignore').length === 0
                                                    }
                                                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200 disabled:opacity-70"
                                                >
                                                    {importLoading ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                            {t('import.importing') || 'Importation...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            {t('import.import') || 'Importer'}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="simple" className="space-y-6">
                                            <div>
                                                <Label htmlFor="contacts_text">{t('import.contactList') || 'Liste des contacts'}</Label>
                                                <Textarea
                                                    id="contacts_text"
                                                    value={contactsText}
                                                    onChange={(e) => setContactsText(e.target.value)}
                                                    rows={12}
                                                    placeholder={t('import.contactsPlaceholder') || 'Jean Dupont - 0123456789\nMarie Martin - 0987654321\n...'}
                                                    className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600"
                                                    disabled={importLoading}
                                                />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {t('import.contactsExample') || 'Format: Nom - Numéro (un contact par ligne)'}
                                                </p>
                                            </div>

                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleSimpleImport}
                                                    disabled={importLoading || !contactsText.trim()}
                                                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200 disabled:opacity-70"
                                                >
                                                    {importLoading ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                            {t('import.importing') || 'Importation...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            {t('import.import') || 'Importer'}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="export" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('export.title') || 'Exportation de contacts'}</CardTitle>
                                    <CardDescription>
                                        {t('export.description') || 'Exportez vos contacts dans différents formats'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label htmlFor="export_format" className="text-sm font-medium">
                                            {t('export.format') || 'Format d\'exportation'}
                                        </Label>
                                        <Select
                                            value={exportFormat}
                                            onValueChange={(val) => setExportFormat(val as 'csv' | 'excel')}
                                            disabled={exportLoading}
                                        >
                                            <SelectTrigger id="export_format" className="mt-1 w-full border-border/60 dark:bg-slate-700 dark:border-slate-600">
                                                <SelectValue placeholder={t('export.selectFormat') || 'Sélectionner un format'} />
                                            </SelectTrigger>
                                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                <SelectItem value="csv">CSV</SelectItem>
                                                <SelectItem value="excel">Excel (XLSX)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="export_filter" className="text-sm font-medium">
                                            {t('export.filter') || 'Filtre d\'exportation'}
                                        </Label>
                                        <Select
                                            value={exportFilter}
                                            onValueChange={(val) => setExportFilter(val as 'all' | 'filtered')}
                                            disabled={exportLoading}
                                        >
                                            <SelectTrigger id="export_filter" className="mt-1 w-full border-border/60 dark:bg-slate-700 dark:border-slate-600">
                                                <SelectValue placeholder={t('export.selectFilter') || 'Sélectionner un filtre'} />
                                            </SelectTrigger>
                                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                <SelectItem value="all">{t('export.allContacts') || 'Tous les contacts'}</SelectItem>
                                                <SelectItem value="filtered">{t('export.filteredContacts') || 'Contacts filtrés'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {t('export.filterDescription') || 'Exportez tous les contacts ou uniquement ceux correspondant à vos filtres actuels'}
                                        </p>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleExport}
                                            disabled={exportLoading}
                                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200 disabled:opacity-70"
                                        >
                                            {exportLoading ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    {t('export.exporting') || 'Exportation...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {t('export.export') || 'Exporter'}
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