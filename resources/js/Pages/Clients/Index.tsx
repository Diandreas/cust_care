import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FileUp, FileDown } from 'lucide-react';

// Partial Components
import StatsCards from './partials/StatsCards';
import FiltersPanel from './partials/FiltersPanel';
import BulkActionBar from './partials/BulkActionBar';
import ClientTable from './partials/ClientTable';
import ClientGrid from './partials/ClientGrid';
import QuickAddModal from './partials/QuickAddModal';
import BulkSmsModal from './partials/BulkSmsModal';
import DeleteConfirmModal from './partials/DeleteConfirmModal';

// ShadCN UI Components
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Card, CardContent } from '@/Components/ui/card';
import { Transition } from '@headlessui/react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';

// Icons
import {
    Search, SlidersHorizontal, LayoutGrid, List, PlusCircle,
    AlertCircle, UserPlus, RefreshCw
} from 'lucide-react';

// État initial pour la suppression
const INITIAL_DELETE_STATE = {
    isDeleting: false,
    itemToDelete: null,
    itemsToDelete: []
};

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    birthday: string | null;
    address: string | null;
    notes: string | null;
    lastContact: string | null;
    tags: Tag[];
    totalSmsCount: number;
    lastSmsDate: string | null;
}

interface Tag {
    id: number;
    name: string;
}

interface ClientsIndexProps {
    clients: {
        data: Client[];
        links: any[];
        total: number;
    };
    tags: Tag[];
    filters: {
        search: string;
        tag_id: number | null;
        date_range: string | null;
        birthday_month: number | null;
        sort_by: string;
        sort_direction: 'asc' | 'desc';
    };
    stats: {
        totalClients: number;
        newClientsThisMonth: number;
        activeClientsLast30Days: number;
        totalSmsSent: number;
    };
    subscription: {
        plan: string;
        clientsLimit: number;
        clientsCount: number;
        smsBalance: number;
    };
}

export default function ClientsIndex({
    auth,
    clients,
    tags,
    filters,
    stats,
    subscription,
}: PageProps & ClientsIndexProps) {
    const { t } = useTranslation();

    // État principal
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [duplicateClients, setDuplicateClients] = useState<any[]>([]);
    const [deleteState, setDeleteState] = useState(INITIAL_DELETE_STATE);

    // États des modals
    const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<number | null>(null);
    const [clientsToDelete, setClientsToDelete] = useState<number[]>([]);

    // Form handling
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        tag_id: filters.tag_id || '',
        date_range: filters.date_range || '',
        birthday_month: filters.birthday_month || '',
        sort_by: filters.sort_by || 'name',
        sort_direction: filters.sort_direction || 'asc',
    });

    // Fonction centralisée pour réinitialiser l'état de suppression
    const resetDeleteState = useCallback(() => {
        console.log('🔄 Resetting delete state');
        setDeleteState(INITIAL_DELETE_STATE);

        // S'assurer que le focus est restitué au body
        setTimeout(() => {
            if (document.activeElement && 'blur' in document.activeElement) {
                (document.activeElement as HTMLElement).blur();
            }
            document.body.focus();
        }, 100);
    }, []);

    // Detect duplicate clients
    useEffect(() => {
        const phoneMap = new Map();
        const emailMap = new Map();
        const potentialDuplicates = [];

        for (const client of clients.data) {
            if (client.phone) {
                if (phoneMap.has(client.phone)) {
                    potentialDuplicates.push({
                        type: 'phone',
                        value: client.phone,
                        clients: [phoneMap.get(client.phone), client]
                    });
                } else {
                    phoneMap.set(client.phone, client);
                }
            }

            if (client.email) {
                if (emailMap.has(client.email)) {
                    potentialDuplicates.push({
                        type: 'email',
                        value: client.email,
                        clients: [emailMap.get(client.email), client]
                    });
                } else {
                    emailMap.set(client.email, client);
                }
            }
        }

        setDuplicateClients(potentialDuplicates);
    }, [clients]);

    // Handle search form submission
    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        get(route('clients.index'), {
            preserveState: true,
            replace: true,
        });
    }, [data, get]);

    // Toggle all clients selection
    const toggleAllClients = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedClients(clients.data.map(client => client.id));
        } else {
            setSelectedClients([]);
        }
    }, [clients.data]);

    // Toggle single client selection
    const toggleClient = useCallback((clientId: number) => {
        setSelectedClients(prev => {
            if (prev.includes(clientId)) {
                return prev.filter(id => id !== clientId);
            } else {
                return [...prev, clientId];
            }
        });
    }, []);

    // Handle bulk actions
    const handleBulkAction = useCallback((action: string) => {
        if (action === 'delete') {
            if (selectedClients.length === 0) {
                toast.error(t('clients.noClientsSelected'));
                return;
            }
            setClientsToDelete(selectedClients);
            setShowDeleteConfirmModal(true);
        } else if (action === 'sms') {
            if (selectedClients.length === 0) {
                toast.error(t('clients.noClientsSelected'));
                return;
            }
            setShowBulkSmsModal(true);
        }
    }, [selectedClients, t]);

    // Handle single client deletion
    const handleDeleteClient = useCallback((clientId: number) => {
        setClientToDelete(clientId);
        setShowDeleteConfirmModal(true);
    }, []);

    // Handle sort change
    const handleSortChange = useCallback((field: string) => {
        setData(prevData => {
            const newDirection = prevData.sort_by === field && prevData.sort_direction === 'asc' ? 'desc' : 'asc';
            return {
                ...prevData,
                sort_by: field,
                sort_direction: newDirection,
            };
        });

        // Trigger the search with new sort parameters
        setTimeout(() => {
            get(route('clients.index'), {
                preserveState: true,
                replace: true,
            });
        }, 0);
    }, [setData, get]);

    // Refresh client list
    const refreshClients = useCallback(() => {
        get(route('clients.index'), {
            preserveState: true,
            only: ['clients', 'stats']
        });
    }, [get]);

    // Handle delete success
    const handleDeleteSuccess = useCallback(() => {
        setSelectedClients([]);
        refreshClients();
    }, [refreshClients]);

    // Clear selections
    const clearSelections = useCallback(() => {
        setSelectedClients([]);
    }, []);

    // Handle quick add modal
    const handleQuickAddClose = useCallback(() => {
        setShowQuickAddModal(false);
    }, []);

    const handleQuickAddOpen = useCallback(() => {
        setShowQuickAddModal(true);
    }, []);

    // Filtres actifs compteur
    const activeFiltersCount = useMemo(() => {
        return [data.tag_id, data.date_range, data.birthday_month].filter(Boolean).length;
    }, [data.tag_id, data.date_range, data.birthday_month]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {t('common.clients')}
                </h2>
            }
        >
            <Head title={t('common.clients')} />

            <div className="py-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <StatsCards stats={stats} subscription={subscription} />

                    {/* Alert for duplicates */}
                    {duplicateClients.length > 0 && (
                        <Alert className="mb-6 border-indigo-200 bg-indigo-50/90 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-900/30 dark:text-indigo-300">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                                <span>
                                    {duplicateClients.length} {t('clients.possibleDuplicates')}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/50"
                                    onClick={() => { /* Add handler for duplicates management */ }}
                                >
                                    {t('clients.manageDuplicates')}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="mb-6 space-y-4">
                        {/* Search and actions bar */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <form onSubmit={handleSearch} className="flex w-full gap-2 md:w-auto md:flex-1">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            value={data.search}
                                            onChange={(e) => setData('search', e.target.value)}
                                            placeholder={t('common.searchClients')}
                                            className="w-full pl-9 border-border/60 bg-white dark:bg-slate-800/80 dark:text-gray-100 dark:border-slate-700/60"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                    >
                                        {processing ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            t('common.search')
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                        className={`flex items-center justify-center gap-2 border-border/60 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-gray-200 ${showFiltersPanel || activeFiltersCount > 0
                                            ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-300 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 dark:border-indigo-800/60'
                                            : ''
                                            }`}
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                        {t('common.filters')}
                                        {activeFiltersCount > 0 && (
                                            <Badge className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                                                {activeFiltersCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </form>

                                <div className="flex flex-row gap-2 sm:justify-end">
                                    <Tabs
                                        value={viewMode}
                                        onValueChange={(value) => setViewMode(value as 'table' | 'grid')}
                                        className="sm:w-auto"
                                    >
                                        <TabsList className="border-border/60 bg-white dark:border-slate-700/60 dark:bg-slate-800/80">
                                            <TabsTrigger
                                                value="table"
                                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:from-indigo-900/30 dark:data-[state=active]:via-purple-900/30 dark:data-[state=active]:to-pink-900/30 dark:data-[state=active]:text-indigo-400"
                                            >
                                                <List className="mr-2 h-4 w-4" />
                                                {t('common.list')}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="grid"
                                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:from-indigo-900/30 dark:data-[state=active]:via-purple-900/30 dark:data-[state=active]:to-pink-900/30 dark:data-[state=active]:text-indigo-400"
                                            >
                                                <LayoutGrid className="mr-2 h-4 w-4" />
                                                {t('common.grid')}
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <Button
                                        onClick={() => setShowQuickAddModal(true)}
                                        className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        {t('common.quickAdd')}
                                    </Button>

                                    {/* Actions dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="border-border/60 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-gray-200"
                                            >
                                                <FileDown className="mr-2 h-4 w-4" />
                                                {t('common.export')}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                            <DropdownMenuItem className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                                <Link
                                                    href={route('clients.export', { format: 'csv' })}
                                                    className="w-full flex items-center"
                                                >
                                                    CSV
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                                <Link
                                                    href={route('clients.export', { format: 'xlsx' })}
                                                    className="w-full flex items-center"
                                                >
                                                    Excel
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Filters panel */}
                        <Transition
                            show={showFiltersPanel}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <FiltersPanel
                                tags={tags}
                                data={data}
                                setData={(newData) => {
                                    if (typeof newData === 'function') {
                                        const updatedData = newData(data);
                                        setData(updatedData);
                                    } else {
                                        setData({ ...data, ...newData });
                                    }
                                }}
                                onApplyFilters={() => get(route('clients.index'), { preserveState: true, replace: true })}
                                onResetFilters={() => {
                                    setData({
                                        search: '',
                                        tag_id: '',
                                        date_range: '',
                                        birthday_month: '',
                                        sort_by: 'name',
                                        sort_direction: 'asc',
                                    });
                                    get(route('clients.index'), { preserveState: true, replace: true });
                                }}
                            />
                        </Transition>

                        {/* Bulk action bar */}
                        {selectedClients.length > 0 && (
                            <BulkActionBar
                                selectedCount={selectedClients.length}
                                onBulkAction={handleBulkAction}
                                onCancel={clearSelections}
                            />
                        )}
                    </div>

                    {/* Table or Grid View */}
                    {viewMode === 'table' ? (
                        <ClientTable
                            clients={clients}
                            selectedClients={selectedClients}
                            onToggleAll={toggleAllClients}
                            onToggleClient={toggleClient}
                            onSortChange={handleSortChange}
                            sortBy={data.sort_by}
                            sortDirection={data.sort_direction}
                            onDeleteClient={handleDeleteClient}
                        />
                    ) : (
                        <ClientGrid
                            clients={clients}
                            selectedClients={selectedClients}
                            onToggleClient={toggleClient}
                            onDeleteClient={handleDeleteClient}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            <QuickAddModal
                isOpen={showQuickAddModal}
                onClose={handleQuickAddClose}
                tags={tags}
                onSuccess={refreshClients}
            />

            {/* Bulk SMS Modal */}
            <BulkSmsModal
                isOpen={showBulkSmsModal}
                onClose={() => setShowBulkSmsModal(false)}
                selectedClients={selectedClients}
                onSuccess={clearSelections}
            />

            {/* Delete Confirm Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteConfirmModal}
                onClose={() => {
                    setClientToDelete(null);
                    setClientsToDelete([]);
                    setShowDeleteConfirmModal(false);
                }}
                clientToDelete={clientToDelete}
                clientsToDelete={clientsToDelete}
                onSuccess={() => {
                    setSelectedClients([]);
                    refreshClients();
                }}
            />
        </AuthenticatedLayout>
    );
}
