import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { RefreshCw, Upload, FileText } from 'lucide-react';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
    const { t } = useTranslation();

    // States
    const [importLoading, setImportLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [contactsText, setContactsText] = useState('');
    const [activeTab, setActiveTab] = useState<'csv' | 'simple'>('csv');

    // Handle file analysis for CSV import
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());

                    if (lines.length < 2) {
                        toast.error(t('import.fileEmpty'));
                        return;
                    }

                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

                    // Auto-map columns
                    const initialMapping: Record<string, string> = {};
                    headers.forEach(header => {
                        const normalizedHeader = header.toLowerCase();
                        if (normalizedHeader.includes('name') || normalizedHeader.includes('nom')) {
                            initialMapping[header] = 'name';
                        } else if (normalizedHeader.includes('phone') || normalizedHeader.includes('tel') || normalizedHeader.includes('telephone')) {
                            initialMapping[header] = 'phone';
                        } else if (normalizedHeader.includes('email') || normalizedHeader.includes('mail')) {
                            initialMapping[header] = 'email';
                        } else if (normalizedHeader.includes('birth') || normalizedHeader.includes('naissance') || normalizedHeader.includes('birthday')) {
                            initialMapping[header] = 'birthday';
                        } else if (normalizedHeader.includes('address') || normalizedHeader.includes('adresse')) {
                            initialMapping[header] = 'address';
                        } else if (normalizedHeader.includes('note')) {
                            initialMapping[header] = 'notes';
                        } else if (normalizedHeader.includes('tag')) {
                            initialMapping[header] = 'tags';
                        } else {
                            initialMapping[header] = 'ignore';
                        }
                    });
                    setFieldMapping(initialMapping);

                    // Preview first 5 rows
                    const previewRows = [];
                    for (let i = 1; i < Math.min(6, lines.length); i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                            const row: Record<string, string> = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index] || '';
                            });
                            previewRows.push(row);
                        }
                    }
                    setPreviewData(previewRows);
                } catch (err) {
                    console.error('Error parsing file:', err);
                    toast.error(t('import.fileError'));
                }
            };
            reader.readAsText(file);
        } else {
            setFieldMapping({});
            setPreviewData([]);
        }
    };

    // Handle CSV import submission
    const handleCsvImport = async () => {
        if (!selectedFile) {
            toast.error(t('import.fileRequired'));
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
            // Get CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('mapping', JSON.stringify(fieldMapping));

            if (token) {
                formData.append('_token', token);
            }

            const response = await axios.post(route('clients.import'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': token
                }
            });

            setImportLoading(false);
            toast.success(t('import.success', { count: response.data.imported || 0 }));
            handleClose();
            onSuccess();
        } catch (err: any) {
            setImportLoading(false);

            if (err.response?.status === 403) {
                toast.error(t('subscription.limit.upgradeRequired'));
            } else if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat().join(', ');
                toast.error(`Erreur de validation: ${errorMessages}`);
            } else {
                toast.error(t('common.importError', {
                    details: err.response?.data?.message || t('common.unknownError')
                }));
            }
        }
    };

    // Handle simple import submission
    const handleSimpleImport = async () => {
        if (!contactsText.trim()) {
            toast.error(t('import.noContacts'));
            return;
        }

        setImportLoading(true);

        try {
            // Parse contacts from text area
            const lines = contactsText.trim().split('\n');
            const contacts = lines.map(line => {
                const parts = line.split('-').map(part => part.trim());
                return {
                    name: parts[0] || '',
                    phone: parts.length > 1 ? parts[1] : ''
                };
            }).filter(c => c.name && c.phone);

            if (contacts.length === 0) {
                toast.error(t('import.noValidContacts'));
                setImportLoading(false);
                return;
            }

            // Get fresh CSRF token
            await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

            const response = await axios.post(route('clients.import.simple'), {
                contacts: JSON.stringify(contacts)
            }, {
                withCredentials: true,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });

            setImportLoading(false);
            toast.success(t('import.success', { count: response.data.imported || 0 }));
            handleClose();
            onSuccess();
        } catch (err: any) {
            setImportLoading(false);

            if (err.response?.status === 419) {
                toast.error("Session expirée. Veuillez recharger la page.");
            } else if (err.response?.status === 403) {
                toast.error(t('subscription.limit.upgradeRequired'));
            } else {
                toast.error(t('common.importError', {
                    details: err.response?.data?.message || t('common.unknownError')
                }));
            }
        }
    };

    // Handle modal close
    const handleClose = () => {
        setSelectedFile(null);
        setFieldMapping({});
        setPreviewData([]);
        setContactsText('');
        setActiveTab('csv');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl dark:bg-slate-800 dark:border-slate-700/60">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        {t('import.title')}
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        {t('import.description')}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'csv' | 'simple')} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="csv" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('import.fromCSV')}
                        </TabsTrigger>
                        <TabsTrigger value="simple">
                            {t('import.simpleFormat')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="csv" className="space-y-4">
                        <div>
                            <Label htmlFor="file_import">{t('import.selectFile')}</Label>
                            <Input
                                id="file_import"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="mt-1 bg-white border-border/60 dark:bg-slate-700 dark:border-slate-600"
                                disabled={importLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('import.fileFormats')}
                            </p>
                        </div>

                        {previewData.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    {t('import.preview')}
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
                                    {t('import.fieldMapping')}
                                </h3>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    {t('import.fieldMappingDescription')}
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
                                                        <SelectValue placeholder={t('import.ignore')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                        <SelectItem value="ignore">{t('import.ignore')}</SelectItem>
                                                        <SelectItem value="name">{t('common.name')} *</SelectItem>
                                                        <SelectItem value="phone">{t('common.phone')} *</SelectItem>
                                                        <SelectItem value="email">{t('common.email')}</SelectItem>
                                                        <SelectItem value="birthday">{t('common.birthday')}</SelectItem>
                                                        <SelectItem value="address">{t('common.address')}</SelectItem>
                                                        <SelectItem value="notes">{t('common.notes')}</SelectItem>
                                                        <SelectItem value="tags">{t('common.tags')}</SelectItem>
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
                    </TabsContent>

                    <TabsContent value="simple" className="space-y-4">
                        <div>
                            <Label htmlFor="contacts_text">{t('import.contactList')}</Label>
                            <Textarea
                                id="contacts_text"
                                value={contactsText}
                                onChange={(e) => setContactsText(e.target.value)}
                                rows={12}
                                placeholder={t('import.contactsPlaceholder')}
                                className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600"
                                disabled={importLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('import.contactsExample')}
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={importLoading}
                        className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={activeTab === 'csv' ? handleCsvImport : handleSimpleImport}
                        disabled={
                            importLoading ||
                            (activeTab === 'csv' && (!selectedFile || Object.values(fieldMapping).filter(v => v !== 'ignore').length === 0)) ||
                            (activeTab === 'simple' && !contactsText.trim())
                        }
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200 disabled:opacity-70"
                    >
                        {importLoading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                {t('import.importing')}
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                {t('import.import')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}