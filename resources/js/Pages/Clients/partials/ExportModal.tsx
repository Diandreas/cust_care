import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { FileText, Download, ChevronRight } from 'lucide-react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClients: number[];
    filters: {
        search: string;
        tag_id: string | number;
        date_range: string;
        birthday_month: string | number;
        sort_by: string;
        sort_direction: 'asc' | 'desc';
    };
}

export default function ExportModal({ isOpen, onClose, selectedClients, filters }: ExportModalProps) {
    const { t } = useTranslation();

    // Handle export
    const handleExport = (format: 'csv' | 'excel') => {
        try {
            // Create URL with export parameters
            const params = new URLSearchParams();

            // Add current filters
            if (filters.search) params.append('search', filters.search);
            if (filters.tag_id) params.append('tag_id', filters.tag_id.toString());
            if (filters.date_range) params.append('date_range', filters.date_range);
            if (filters.birthday_month) params.append('birthday_month', filters.birthday_month.toString());

            // If clients are selected, export only those
            if (selectedClients.length > 0) {
                selectedClients.forEach(id => params.append('selected[]', id.toString()));
            }

            // Add export format
            params.append('format', format);

            // Create invisible link, click it, then remove it
            const link = document.createElement('a');
            link.href = `${route('clients.export')}?${params.toString()}`;
            link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.${format}`);
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Close modal and show success message
            onClose();
            toast.success(t('export.success'));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('export.error'));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        {t('export.title')}
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        {selectedClients.length > 0
                            ? t('export.selectedDescription', { count: selectedClients.length })
                            : t('export.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        {t('export.format')}
                    </h3>
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            onClick={() => handleExport('csv')}
                            className="w-full justify-between border-border/60 bg-white/80 px-6 py-4 text-left hover:bg-indigo-50 dark:border-slate-700/60 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-indigo-900/20 group transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-600 dark:from-indigo-900/50 dark:to-indigo-800/50 dark:text-indigo-400 mr-3">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block font-medium">CSV</span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                                        {t('export.csvDescription')}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => handleExport('excel')}
                            className="w-full justify-between border-border/60 bg-white/80 px-6 py-4 text-left hover:bg-green-50 dark:border-slate-700/60 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-green-900/20 group transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-100 to-green-200 text-green-600 dark:from-green-900/50 dark:to-green-800/50 dark:text-green-400 mr-3">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block font-medium">Excel</span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                                        {t('export.excelDescription')}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors duration-200" />
                        </Button>
                    </div>

                    {/* Export summary */}
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {t('export.summary')}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {selectedClients.length > 0 ? (
                                <p>• {selectedClients.length} {t('export.selectedClients')}</p>
                            ) : (
                                <>
                                    <p>• {t('export.allClients')}</p>
                                    {filters.search && <p>• {t('export.withSearch')}: "{filters.search}"</p>}
                                    {filters.tag_id && <p>• {t('export.withTag')}</p>}
                                    {filters.date_range && <p>• {t('export.withDateFilter')}</p>}
                                    {filters.birthday_month && <p>• {t('export.withBirthdayFilter')}</p>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}