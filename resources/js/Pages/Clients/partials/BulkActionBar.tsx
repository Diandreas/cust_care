import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Check, X, MessageSquare, Trash2 } from 'lucide-react';

interface BulkActionBarProps {
    selectedCount: number;
    onBulkAction: (action: string) => void;
    onCancel: () => void;
}

export default function BulkActionBar({ selectedCount, onBulkAction, onCancel }: BulkActionBarProps) {
    const { t } = useTranslation();

    return (
        <Card className="sticky top-20 z-10 mt-2 border-none bg-gradient-to-r from-indigo-100 to-purple-100 shadow-md transition-all dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-800/40">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center text-indigo-700 dark:text-indigo-300">
                    <Check className="mr-2 h-5 w-5" />
                    <span className="font-medium">
                        {selectedCount} {t('clients.selectedClients')}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() => onBulkAction('sms')}
                        className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {t('clients.sendMessage')}
                    </Button>

                    <Button
                        onClick={() => onBulkAction('delete')}
                        variant="outline"
                        className="border-border/60 bg-white/80 text-rose-600 hover:bg-rose-50 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-rose-400 dark:hover:bg-slate-700/90"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('clients.deleteSelected')}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="border-border/60 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-slate-700/90"
                    >
                        <X className="mr-2 h-4 w-4" />
                        {t('common.cancel')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}