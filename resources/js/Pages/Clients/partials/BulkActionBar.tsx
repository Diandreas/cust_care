import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';
import { Check, X, MessageSquare } from 'lucide-react';

interface BulkActionBarProps {
    selectedCount: number;
    onBulkAction: (action: string) => void;
    onCancel: () => void;
    onExport: () => void;
}

export default function BulkActionBar({ selectedCount, onBulkAction, onCancel, onExport }: BulkActionBarProps) {
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-border/60 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-slate-700/90"
                            >
                                {t('common.moreActions')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="dark:bg-slate-800 dark:border-slate-700/60">
                            <DropdownMenuItem onSelect={onExport} className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                {t('clients.exportSelected')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => onBulkAction('delete')}
                                className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400 dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90"
                            >
                                {t('clients.deleteSelected')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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