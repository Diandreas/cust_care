import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientToDelete: number | null;
    clientsToDelete: number[];
    onSuccess: () => void;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    clientToDelete,
    clientsToDelete,
    onSuccess
}: DeleteConfirmModalProps) {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);

    // Determine if it's single or bulk delete
    const isBulkDelete = clientsToDelete.length > 0;
    const deleteCount = isBulkDelete ? clientsToDelete.length : 1;

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        setIsDeleting(true);

        try {
            if (clientToDelete) {
                // Delete single client
                await axios.post(route('clients.destroy', clientToDelete), {
                    _method: 'DELETE'
                });

                toast.success(t('clients.deleteSuccess', { count: 1 }));
            } else if (clientsToDelete.length > 0) {
                // Bulk delete clients
                await axios.post('/api/clients/bulk-delete', {
                    _method: 'DELETE',
                    clients: clientsToDelete
                });

                toast.success(t('clients.deleteSuccess', { count: clientsToDelete.length }));
            }

            // Close modal and trigger success callback
            onClose();
            onSuccess();
        } catch (err: any) {
            console.error('Delete error:', err);

            if (err.response?.status === 403) {
                toast.error(t('common.unauthorized'));
            } else if (err.response?.status === 404) {
                toast.error(t('clients.notFound'));
            } else if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat().join(', ');
                toast.error(`Erreur de validation: ${errorMessages}`);
            } else {
                toast.error(t('common.error', {
                    details: err.response?.data?.message || t('common.unknownError')
                }));
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-5 w-5" />
                        {isBulkDelete
                            ? t('clients.bulkDeleteConfirmation', { count: deleteCount })
                            : t('clients.deleteConfirmation')}
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        {isBulkDelete ? (
                            <div className="space-y-2">
                                <p>{t('clients.bulkDeleteWarning', { count: deleteCount })}</p>
                                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 p-3">
                                    <div className="flex items-center">
                                        <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 mr-2 flex-shrink-0" />
                                        <p className="text-sm text-rose-700 dark:text-rose-300">
                                            Cette action supprimera définitivement <span className="font-semibold">{deleteCount} clients</span> et toutes leurs données associées (messages, historique, etc.).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p>{t('clients.deleteWarning')}</p>
                                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 p-3">
                                    <div className="flex items-center">
                                        <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 mr-2 flex-shrink-0" />
                                        <p className="text-sm text-rose-700 dark:text-rose-300">
                                            Cette action supprimera définitivement ce client et toutes ses données associées (messages, historique, etc.).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Warning message for bulk delete */}
                {isBulkDelete && deleteCount > 10 && (
                    <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-3">
                        <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                <span className="font-semibold">Attention :</span> Vous êtes sur le point de supprimer un grand nombre de clients. Cette opération peut prendre quelques instants.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                        className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 focus:ring-rose-500"
                    >
                        {isDeleting ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                {isBulkDelete ? t('clients.deleting') : t('clients.deleting')}
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isBulkDelete
                                    ? t('clients.deleteClients', { count: deleteCount })
                                    : t('common.delete')
                                }
                            </>
                        )}
                    </Button>
                </DialogFooter>

                {/* Progress indicator for bulk operations */}
                {isDeleting && isBulkDelete && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Suppression en cours...</span>
                            <span>{deleteCount} clients</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div className="bg-rose-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}