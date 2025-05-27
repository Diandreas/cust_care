import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { AlertTriangle, Trash2, Loader2, Users, User } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientToDelete?: number | null;
    clientsToDelete?: number[];
    onSuccess?: () => void;
    clientName?: string; // Pour afficher le nom du client
}

interface DeleteData {
    clientToDelete: number | null;
    clientsToDelete: number[];
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

const INITIAL_DELETE_STATE: DeleteData = {
    clientToDelete: null,
    clientsToDelete: []
};

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    clientToDelete = null,
    clientsToDelete = [],
    onSuccess,
    clientName
}: DeleteConfirmModalProps) {
    const { t } = useTranslation();

    // États du modal - MÊME structure que QuickAddModal
    const [deleteData, setDeleteData] = useState<DeleteData>(() => ({
        clientToDelete,
        clientsToDelete
    }));

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Configuration de suppression - MÊME approche que QuickAddModal avec useMemo
    const deleteConfig = useMemo(() => {
        const actualClientsToDelete = clientsToDelete.length > 0 ? clientsToDelete : deleteData.clientsToDelete;
        const actualClientToDelete = clientToDelete || deleteData.clientToDelete;

        const isBulkDelete = actualClientsToDelete.length > 0;
        const deleteCount = isBulkDelete ? actualClientsToDelete.length : 1;
        const isLargeBatch = deleteCount > 10;
        const hasValidTarget = actualClientToDelete !== null || actualClientsToDelete.length > 0;

        return {
            isBulkDelete,
            deleteCount,
            isLargeBatch,
            hasValidTarget,
            actualClientToDelete,
            actualClientsToDelete
        };
    }, [clientToDelete, clientsToDelete, deleteData]);

    // Gestion de la suppression unique - MÊME pattern que QuickAddModal
    const handleSingleDelete = useCallback(async (clientId: number) => {
        const response = await axios.post(route('clients.destroy', clientId), {
            _method: 'DELETE'
        }, {
            withCredentials: true,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        toast.success(t('clients.deleteSuccess', { count: 1 }));
        return response;
    }, [t]);

    // Gestion de la suppression en lot - MÊME pattern que QuickAddModal
    const handleBulkDelete = useCallback(async (clientIds: number[]) => {
        const response = await axios.post('/api/clients/bulk-delete', {
            _method: 'DELETE',
            clients: clientIds
        }, {
            withCredentials: true,
            timeout: 30000, // Plus de temps pour les suppressions en lot
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        toast.success(t('clients.deleteSuccess', { count: clientIds.length }));
        return response;
    }, [t]);

    // Gestionnaire principal de suppression - EXACTEMENT comme handleSubmit dans QuickAddModal
    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteConfig.hasValidTarget) {
            toast.error(t('common.noSelectionError'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Configuration Axios avec token CSRF - EXACTEMENT comme QuickAddModal
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (token) {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
            }

            // Rafraîchir le cookie CSRF - EXACTEMENT comme QuickAddModal
            await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

            // Exécuter la suppression
            if (deleteConfig.actualClientToDelete) {
                await handleSingleDelete(deleteConfig.actualClientToDelete);
            } else if (deleteConfig.actualClientsToDelete.length > 0) {
                await handleBulkDelete(deleteConfig.actualClientsToDelete);
            }

            // Fermer la modal et déclencher le callback de succès - EXACTEMENT comme QuickAddModal
            handleClose();
            onSuccess?.();

        } catch (error) {
            console.error('Delete error:', error);
            handleSubmitError(error as AxiosError<ApiErrorResponse>);
        } finally {
            setIsSubmitting(false);
        }
    }, [
        deleteConfig,
        handleSingleDelete,
        handleBulkDelete,
        onSuccess,
        t
    ]);

    // Gestion des erreurs de suppression - EXACTEMENT comme QuickAddModal
    const handleSubmitError = useCallback((error: AxiosError<ApiErrorResponse>) => {
        const status = error.response?.status;
        const data = error.response?.data;

        switch (status) {
            case 419:
                toast.error("Session expirée. Veuillez recharger la page.");
                break;
            case 403:
                toast.error(t('common.unauthorized'));
                break;
            case 404:
                toast.error(t('clients.notFound'));
                break;
            case 422:
                if (data?.errors) {
                    const errorMessages = Object.entries(data.errors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('\n');
                    toast.error('Erreur de validation', { description: errorMessages });
                } else {
                    toast.error('Données de suppression invalides');
                }
                break;
            case 409:
                toast.error('Conflit lors de la suppression');
                break;
            default:
                toast.error(t('common.error'), {
                    description: data?.message || error.message || t('common.unknownError')
                });
        }
    }, [t]);

    // Fermeture de la modal - EXACTEMENT comme QuickAddModal
    const handleClose = useCallback(() => {
        if (isSubmitting) return;

        setDeleteData(INITIAL_DELETE_STATE);
        onClose();
    }, [isSubmitting, onClose]);

    // Ne pas afficher la modal si aucune cible valide - MÊME logique que QuickAddModal
    if (!deleteConfig.hasValidTarget) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700/60">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        {deleteConfig.isBulkDelete
                            ? t('clients.bulkDeleteConfirmation', { count: deleteConfig.deleteCount })
                            : t('clients.deleteConfirmation')
                        }
                    </DialogTitle>

                    <DialogDescription className="dark:text-gray-400">
                        {deleteConfig.isBulkDelete
                            ? t('clients.bulkDeleteWarning', { count: deleteConfig.deleteCount })
                            : clientName
                                ? t('clients.deleteWarningWithName', { name: clientName })
                                : t('clients.deleteWarning')
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Informations sur la suppression */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {deleteConfig.isBulkDelete ? (
                                <>
                                    <Users className="h-4 w-4" />
                                    Suppression en lot
                                </>
                            ) : (
                                <>
                                    <User className="h-4 w-4" />
                                    Suppression individuelle
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge
                                variant={deleteConfig.isBulkDelete ? "destructive" : "outline"}
                                className="text-xs"
                            >
                                {deleteConfig.deleteCount} {deleteConfig.deleteCount > 1 ? 'clients' : 'client'}
                            </Badge>

                            {deleteConfig.isLargeBatch && (
                                <Badge variant="secondary" className="text-xs">
                                    Lot important
                                </Badge>
                            )}
                        </div>
                    </div>

                    <Separator className="dark:border-slate-700" />

                    {/* Avertissements */}
                    <div className="space-y-3">
                        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-rose-700 dark:text-rose-300">
                                    <div className="font-medium mb-1">Action irréversible</div>
                                    <div>
                                        {deleteConfig.isBulkDelete
                                            ? `${deleteConfig.deleteCount} clients et toutes leurs données associées seront définitivement supprimés.`
                                            : 'Ce client et toutes ses données associées seront définitivement supprimés.'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Avertissement pour les gros lots */}
                        {deleteConfig.isLargeBatch && (
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-amber-700 dark:text-amber-300">
                                        <div className="font-medium mb-1">Attention</div>
                                        <div>
                                            Vous êtes sur le point de supprimer un grand nombre de clients ({deleteConfig.deleteCount}).
                                            Cette opération peut prendre plusieurs secondes.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Données concernées */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <div className="font-medium mb-1">Données qui seront supprimées :</div>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Informations personnelles</li>
                            <li>Historique des messages</li>
                            <li>Tags et catégories</li>
                            <li>Notes et commentaires</li>
                            <li>Statistiques d'engagement</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                    >
                        {t('common.cancel')}
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                        disabled={isSubmitting}
                        className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 focus:ring-rose-500 min-w-[140px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {deleteConfig.isBulkDelete
                                    ? 'Suppression...'
                                    : 'Suppression...'
                                }
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deleteConfig.isBulkDelete
                                    ? `Supprimer ${deleteConfig.deleteCount} clients`
                                    : 'Supprimer le client'
                                }
                            </>
                        )}
                    </Button>
                </DialogFooter>

                {/* Indicateur de progression pour suppressions en lot */}
                {isSubmitting && deleteConfig.isBulkDelete && (
                    <div className="border-t dark:border-slate-700 pt-4 mt-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span>Suppression en cours...</span>
                                <span>{deleteConfig.deleteCount} clients</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                                <div
                                    className="bg-rose-500 h-1.5 rounded-full animate-pulse transition-all duration-300"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
