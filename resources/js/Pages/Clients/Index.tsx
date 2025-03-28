// resources/js/Pages/Clients/Index.tsx
import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Dropdown from '@/Components/Dropdown';
import Checkbox from '@/Components/Checkbox';
import { Transition } from '@headlessui/react';
import { useToast } from '@/Utils/toast';
import { toast } from 'sonner';
import axios from 'axios';

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
}: PageProps<ClientsIndexProps & Record<string, unknown>>) {
    const { t } = useTranslation();
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards'>('table');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const { success, error } = useToast();
    const [bulkSmsContent, setBulkSmsContent] = useState('');
    const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
    const [selectedCategoryForBulk, setSelectedCategoryForBulk] = useState<number | null>(null);
    const [importLoading, setImportLoading] = useState(false);

    // État pour la recherche et les filtres
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        tag_id: filters.tag_id || '',
        date_range: filters.date_range || '',
        birthday_month: filters.birthday_month || '',
        sort_by: filters.sort_by || 'name',
        sort_direction: filters.sort_direction || 'asc',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('clients.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    // Dans votre composant ClientsIndex.tsx

    // 1. Fonction d'importation simplifiée
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    // Analyse simple du CSV
                    const text = event.target?.result as string;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());

                    // Mapping automatique des colonnes
                    const initialMapping: Record<string, string> = {};
                    headers.forEach(header => {
                        const normalizedHeader = header.toLowerCase();
                        if (normalizedHeader.includes('name') || normalizedHeader.includes('nom'))
                            initialMapping[header] = 'name';
                        else if (normalizedHeader.includes('phone') || normalizedHeader.includes('tel'))
                            initialMapping[header] = 'phone';
                        else if (normalizedHeader.includes('email'))
                            initialMapping[header] = 'email';
                        else if (normalizedHeader.includes('birth') || normalizedHeader.includes('naissance'))
                            initialMapping[header] = 'birthday';
                        else if (normalizedHeader.includes('address') || normalizedHeader.includes('adresse'))
                            initialMapping[header] = 'address';
                        else if (normalizedHeader.includes('note'))
                            initialMapping[header] = 'notes';
                        else
                            initialMapping[header] = '';
                    });
                    setFieldMapping(initialMapping);

                    // Prévisualisation des 5 premières lignes
                    const previewRows = [];
                    for (let i = 1; i < Math.min(6, lines.length); i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',');
                            const row: Record<string, string> = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index]?.trim() || '';
                            });
                            previewRows.push(row);
                        }
                    }
                    setPreviewData(previewRows);
                } catch (error) {
                    console.error('Error parsing file:', error);
                    error('import.fileError');
                }
            };
            reader.readAsText(file);
        }
    };

    // 2. Fonction d'importation simplifiée
    const handleImport = () => {
        if (!selectedFile) {
            error(t('import.fileRequired'));
            return;
        }

        // Montrer un indicateur de chargement
        setImportLoading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mapping', JSON.stringify(fieldMapping));
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');

        axios.post(route('clients.import'), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
            .then(response => {
                setImportLoading(false);
                success(t('import.success'));
                setShowImportModal(false);

                // Actualiser la liste sans rechargement complet
                get(route('clients.index'), {
                    preserveState: true,
                    only: ['clients', 'stats']
                });
            })
            .catch(err => {
                setImportLoading(false);

                if (err.response && err.response.status === 403) {
                    error(t('subscription.limit.upgradeRequired'));
                } else {
                    error(t('common.importError', {
                        details: err.response?.data?.message || t('common.unknownError')
                    }));
                }
            });
    };

    // 3. Fonction d'exportation simplifiée sans rechargement de page
    const handleExport = (format: 'csv' | 'excel') => {
        // Créer une URL avec les paramètres d'exportation
        const params = new URLSearchParams();

        // Ajouter les filtres actuels
        if (data.search) params.append('search', data.search);
        if (data.tag_id) params.append('tag_id', data.tag_id.toString());
        if (data.date_range) params.append('date_range', data.date_range);
        if (data.birthday_month) params.append('birthday_month', data.birthday_month.toString());

        // Si des clients sont sélectionnés, les exporter spécifiquement
        if (selectedClients.length > 0) {
            selectedClients.forEach(id => params.append('selected[]', id.toString()));
        }

        // Ajouter le format d'exportation
        params.append('format', format);

        // Créer un lien invisible, cliquer dessus, puis le supprimer
        const link = document.createElement('a');
        link.href = `${route('clients.export')}?${params.toString()}`;
        link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.${format}`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Fermer le modal
        setShowExportModal(false);
        success(t('export.success'));
    };

    // Fonction pour gérer les réponses d'importation
    const handleImportResponse = (response: Response) => {
        if (!response.ok) {
            if (response.status === 403) {
                error('subscription.limit.upgradeRequired');
                return;
            }

            // Traiter la réponse comme un JSON pour obtenir le message d'erreur
            response.json().then(data => {
                error('common.importError', { details: data.message });
            }).catch(() => {
                error('common.importError');
            });

            return;
        }

        response.json().then(data => {
            if (data.success) {
                success('import.success');
                // Recharger la page
                window.location.reload();
            } else {
                error('common.importError', { details: data.message || '' });
            }
        }).catch(() => {
            error('common.importError');
        });
    };

    // Modifier la fonction handleImport pour utiliser selectedFile correctement

    const toggleAllClients = (checked: boolean) => {
        if (checked) {
            setSelectedClients(clients.data.map(client => client.id));
        } else {
            setSelectedClients([]);
        }
    };

    const toggleClient = (clientId: number) => {
        if (selectedClients.includes(clientId)) {
            setSelectedClients(selectedClients.filter(id => id !== clientId));
        } else {
            setSelectedClients([...selectedClients, clientId]);
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedClients.length === 0) {
            error(t('clients.noClientsSelected'));
            return;
        }

        switch (action) {
            case 'sms':
                setShowBulkSmsModal(true);
                break;
            case 'delete':
                if (confirm(t('clients.confirmDelete', { count: selectedClients.length }))) {
                    axios.delete('/api/clients/bulk-delete', {
                        data: { clients: selectedClients }
                    })
                        .then(response => {
                            success(t('clients.deleteSuccess', { count: selectedClients.length }));
                            window.location.reload();
                        })
                        .catch(err => {
                            error(t('common.error'));
                        });
                }
                break;
        }
    };

    const handleBulkCategoryChange = () => {
        if (selectedCategoryForBulk === null) {
            error('clients.selectCategory');
            return;
        }

        axios.post(route('clients.bulkCategory'), {
            ids: selectedClients,
            category_id: selectedCategoryForBulk
        })
            .then(response => {
                success('clients.categoryUpdateSuccess');
                setShowBulkCategoryModal(false);
                window.location.reload();
            })
            .catch(err => {
                error('common.error', { details: err.response?.data?.message || 'Erreur inconnue' });
            });
    };

    const handleSortChange = (field: string) => {
        setData(prevData => {
            const newDirection = prevData.sort_by === field && prevData.sort_direction === 'asc' ? 'desc' : 'asc';
            return {
                ...prevData,
                sort_by: field,
                sort_direction: newDirection,
            };
        });
        get(route('clients.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const handleBulkSms = () => {
        if (!bulkSmsContent.trim()) {
            error('sms.contentRequired');
            return;
        }

        axios.post(route('messages.bulkSend'), {
            client_ids: selectedClients,
            content: bulkSmsContent,
        })
            .then(response => {
                success('sms.sendSuccess');
                setShowBulkSmsModal(false);
                setBulkSmsContent('');
            })
            .catch(err => {
                if (err.response && err.response.status === 403) {
                    error('subscription.limit.upgradeRequired');
                } else {
                    error('common.error', { details: err.response?.data?.message || 'Erreur inconnue' });
                }
            });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.clients')}</h2>}
        >
            <Head title={t('common.clients')} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Statistiques clients */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.totalClients')}</div>
                            <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.totalClients}</div>
                            <div className="mt-2 text-xs">
                                <span className="text-green-600 dark:text-green-400">
                                    +{stats.newClientsThisMonth} {t('stats.thisMonth')}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.activeClients')}</div>
                            <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.activeClientsLast30Days}</div>
                            <div className="mt-2 text-xs">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {Math.round((stats.activeClientsLast30Days / stats.totalClients) * 100)}% {t('stats.ofTotal')}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.smsSent')}</div>
                            <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.totalSmsSent}</div>
                            <div className="mt-2 text-xs">
                                <span className="text-blue-600 dark:text-blue-400">
                                    {subscription.smsBalance} {t('stats.smsRemaining')}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.subscription')}</div>
                            <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{subscription.plan}</div>
                            <div className="mt-2 text-xs">
                                <span className={`${subscription.clientsCount > subscription.clientsLimit * 0.9 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {subscription.clientsCount}/{subscription.clientsLimit} {t('stats.clientsUsed')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 flex flex-col gap-4">
                        {/* Barre d'actions et recherche */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <form onSubmit={handleSearch} className="flex w-full gap-2 md:w-auto md:flex-1">
                                    <input
                                        type="text"
                                        value={data.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                        placeholder={t('common.searchClients')}
                                        className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('common.search')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                        className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        {t('common.filters')}
                                    </button>
                                </form>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('table')}
                                        className={`flex items-center rounded-md px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        {t('common.tableView')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`flex items-center rounded-md px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                        </svg>
                                        {t('common.gridView')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('cards')}
                                        className={`flex items-center rounded-md px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        {t('common.cardsView')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={route('clients.create')}
                                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                >
                                    <svg
                                        className="-ml-1 mr-2 h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                    {t('common.addClient')}
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(true)}
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    <svg
                                        className="-ml-1 mr-2 h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                        />
                                    </svg>
                                    {t('common.import')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowExportModal(true)}
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    <svg
                                        className="-ml-1 mr-2 h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                        />
                                    </svg>
                                    {t('common.export')}
                                </button>
                            </div>
                        </div>

                        {/* Panneau de filtres avancés */}
                        <Transition
                            show={showFiltersPanel}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('filters.tags')}
                                        </label>
                                        <select
                                            value={data.tag_id}
                                            onChange={(e) => setData('tag_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">{t('common.all')}</option>
                                            {tags.map((tag) => (
                                                <option key={tag.id} value={tag.id}>
                                                    {tag.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('filters.dateRange')}
                                        </label>
                                        <select
                                            value={data.date_range}
                                            onChange={(e) => setData('date_range', e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">{t('common.all')}</option>
                                            <option value="today">{t('filters.today')}</option>
                                            <option value="this_week">{t('filters.thisWeek')}</option>
                                            <option value="this_month">{t('filters.thisMonth')}</option>
                                            <option value="last_30_days">{t('filters.last30Days')}</option>
                                            <option value="this_year">{t('filters.thisYear')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('filters.birthdayMonth')}
                                        </label>
                                        <select
                                            value={data.birthday_month}
                                            onChange={(e) => setData('birthday_month', e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">{t('common.all')}</option>
                                            <option value="1">{t('months.january')}</option>
                                            <option value="2">{t('months.february')}</option>
                                            <option value="3">{t('months.march')}</option>
                                            <option value="4">{t('months.april')}</option>
                                            <option value="5">{t('months.may')}</option>
                                            <option value="6">{t('months.june')}</option>
                                            <option value="7">{t('months.july')}</option>
                                            <option value="8">{t('months.august')}</option>
                                            <option value="9">{t('months.september')}</option>
                                            <option value="10">{t('months.october')}</option>
                                            <option value="11">{t('months.november')}</option>
                                            <option value="12">{t('months.december')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('filters.sortBy')}
                                        </label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <select
                                                value={data.sort_by}
                                                onChange={(e) => setData('sort_by', e.target.value)}
                                                className="block w-full rounded-l-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="name">{t('common.name')}</option>
                                                <option value="created_at">{t('common.dateAdded')}</option>
                                                <option value="last_contact">{t('common.lastContact')}</option>
                                                <option value="birthday">{t('common.birthday')}</option>
                                                <option value="total_sms">{t('common.totalSms')}</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setData('sort_direction', data.sort_direction === 'asc' ? 'desc' : 'asc')}
                                                className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200"
                                            >
                                                {data.sort_direction === 'asc' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData({
                                                search: '',
                                                tag_id: '',
                                                date_range: '',
                                                birthday_month: '',
                                                sort_by: 'name',
                                                sort_direction: 'asc',
                                            });
                                            get(route('clients.index'), {
                                                preserveState: true,
                                                replace: true,
                                            });
                                        }}
                                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    >
                                        {t('common.resetFilters')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            get(route('clients.index'), {
                                                preserveState: true,
                                                replace: true,
                                            });
                                        }}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('common.applyFilters')}
                                    </button>
                                </div>
                            </div>
                        </Transition>

                        {/* Actions de lot si clients sélectionnés */}
                        {selectedClients.length > 0 && (
                            <div className="sticky top-20 z-10 mt-2 rounded-lg bg-indigo-50 p-3 shadow-sm dark:bg-indigo-900">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-indigo-700 dark:text-indigo-200">
                                        {selectedClients.length} {t('clients.selectedClients')}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => handleBulkAction('sms')}
                                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            <svg
                                                className="mr-2 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                                />
                                            </svg>
                                            {t('clients.sendMessage')}
                                        </button>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    {t('common.moreActions')}
                                                    <svg
                                                        className="ml-2 -mr-0.5 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content>
                                                <button
                                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onClick={() => setShowExportModal(true)}
                                                >
                                                    {t('clients.exportSelected')}
                                                </button>
                                                <button
                                                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    onClick={() => handleBulkAction('delete')}
                                                >
                                                    {t('clients.deleteSelected')}
                                                </button>
                                            </Dropdown.Content>
                                        </Dropdown>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedClients([])}
                                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            <svg
                                                className="-ml-0.5 mr-1.5 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vue en tableau */}
                    {viewMode === 'table' && (
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="w-10 px-6 py-3">
                                                <Checkbox
                                                    checked={clients.data.length > 0 && selectedClients.length === clients.data.length}
                                                    onChange={(e) => toggleAllClients(e.target.checked)}
                                                />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer"
                                                onClick={() => handleSortChange('name')}
                                            >
                                                <div className="flex items-center">
                                                    {t('common.name')}
                                                    {data.sort_by === 'name' && (
                                                        <span className="ml-1">
                                                            {data.sort_direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {t('common.phone')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {t('common.email')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {t('common.tags')}
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer"
                                                onClick={() => handleSortChange('birthday')}
                                            >
                                                <div className="flex items-center">
                                                    {t('common.birthday')}
                                                    {data.sort_by === 'birthday' && (
                                                        <span className="ml-1">
                                                            {data.sort_direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer"
                                                onClick={() => handleSortChange('last_contact')}
                                            >
                                                <div className="flex items-center">
                                                    {t('common.lastContact')}
                                                    {data.sort_by === 'last_contact' && (
                                                        <span className="ml-1">
                                                            {data.sort_direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                {t('common.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {clients.data.map((client) => (
                                            <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <Checkbox
                                                        checked={selectedClients.includes(client.id)}
                                                        onChange={() => toggleClient(client.id)}
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <Link
                                                        href={route('clients.show', client.id)}
                                                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    >
                                                        {client.name}
                                                    </Link>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <a href={`tel:${client.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                                        {client.phone}
                                                    </a>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {client.email && (
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <a href={`mailto:${client.email}`} className="truncate hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                {client.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {client.tags && client.tags.length > 0 && (
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                            </svg>
                                                            <div className="flex flex-wrap gap-1">
                                                                {client.tags.map(tag => (
                                                                    <span key={tag.id} className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                                        {tag.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {client.birthday && (
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                                            </svg>
                                                            {formatDate(client.birthday)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {client.lastContact && (
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19h-7a4 4 0 00-4 4 4 4 0 004-4v-4zM7 10h10a4 4 0 004-4 4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4z" />
                                                            </svg>
                                                            {formatDate(client.lastContact)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19h-7a4 4 0 00-4 4 4 4 0 004-4v-4zM7 10h10a4 4 0 004-4 4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4z" />
                                                        </svg>
                                                        <a href={route('clients.show', client.id)} className="truncate hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            {t('common.show')}
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {Object.keys(fieldMapping).length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('import.fieldMapping')}
                            </h3>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {t('import.fieldMappingDescription')}
                            </p>
                            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {Object.entries(fieldMapping).map(([csvField, appField]) => (
                                    <div key={csvField}>
                                        <InputLabel htmlFor={`mapping_${csvField}`} value={csvField} />
                                        <select
                                            id={`mapping_${csvField}`}
                                            value={appField}
                                            onChange={(e) => setFieldMapping({
                                                ...fieldMapping,
                                                [csvField]: e.target.value,
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        >
                                            <option value="">{t('import.ignore')}</option>
                                            <option value="name">{t('common.name')}</option>
                                            <option value="phone">{t('common.phone')}</option>
                                            <option value="email">{t('common.email')}</option>
                                            <option value="birthday">{t('common.birthday')}</option>
                                            <option value="address">{t('common.address')}</option>
                                            <option value="notes">{t('common.notes')}</option>
                                            <option value="tags">{t('common.tags')}</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-2">
                        <SecondaryButton onClick={() => setShowImportModal(false)} disabled={importLoading}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={handleImport}
                            disabled={importLoading || !selectedFile || Object.values(fieldMapping).filter(Boolean).length === 0}
                        >
                            {importLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('import.importing')}
                                </>
                            ) : t('import.import')}
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            {/* Modal d'importation */}
            <Modal show={showImportModal} onClose={() => !importLoading && setShowImportModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t('import.title')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t('import.description')}
                    </p>

                    <div className="mt-6">
                        <InputLabel htmlFor="file_import" value={t('import.selectFile')} />
                        <input
                            id="file_import"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            disabled={importLoading}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('import.fileFormats')}
                        </p>
                    </div>

                    {previewData.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('import.preview')}
                            </h3>
                            <div className="mt-2 max-h-40 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                        <tr>
                                            {Object.keys(previewData[0]).map(header => (
                                                <th key={header} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {previewData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Object.entries(row).map(([key, value]) => (
                                                    <td key={key} className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {value}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {Object.keys(fieldMapping).length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('import.fieldMapping')}
                            </h3>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {t('import.fieldMappingDescription')}
                            </p>
                            <div className="mt-2 max-h-60 overflow-y-auto grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {Object.entries(fieldMapping).map(([csvField, appField]) => (
                                    <div key={csvField}>
                                        <InputLabel htmlFor={`mapping_${csvField}`} value={csvField} />
                                        <select
                                            id={`mapping_${csvField}`}
                                            value={appField}
                                            onChange={(e) => setFieldMapping({
                                                ...fieldMapping,
                                                [csvField]: e.target.value,
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            disabled={importLoading}
                                        >
                                            <option value="">{t('import.ignore')}</option>
                                            <option value="name">{t('common.name')}</option>
                                            <option value="phone">{t('common.phone')}</option>
                                            <option value="email">{t('common.email')}</option>
                                            <option value="birthday">{t('common.birthday')}</option>
                                            <option value="address">{t('common.address')}</option>
                                            <option value="notes">{t('common.notes')}</option>
                                            <option value="tags">{t('common.tags')}</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-2">
                        <SecondaryButton onClick={() => setShowImportModal(false)} disabled={importLoading}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={handleImport}
                            disabled={importLoading || !selectedFile || Object.values(fieldMapping).filter(Boolean).length === 0}
                        >
                            {importLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('import.importing')}
                                </>
                            ) : t('import.import')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Modal d'exportation */}
            <Modal show={showExportModal} onClose={() => setShowExportModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t('export.title')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {selectedClients.length > 0
                            ? t('export.selectedDescription', { count: selectedClients.length })
                            : t('export.description')}
                    </p>

                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t('export.format')}
                        </h3>
                        <div className="mt-2 space-y-2">
                            <button
                                type="button"
                                onClick={() => handleExport('csv')}
                                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div>
                                        <span className="block font-medium text-gray-900 dark:text-gray-100">CSV</span>
                                        <span className="block text-xs text-gray-500">{t('export.csvDescription')}</span>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExport('excel')}
                                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div>
                                        <span className="block font-medium text-gray-900 dark:text-gray-100">Excel</span>
                                        <span className="block text-xs text-gray-500">{t('export.excelDescription')}</span>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal d'envoi de SMS en masse */}
            <Modal show={showBulkSmsModal} onClose={() => setShowBulkSmsModal(false)} maxWidth="xl">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t('bulk.sendSms')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t('bulk.sendSmsDescription', { count: selectedClients.length })}
                    </p>

                    <div className="mt-6">
                        <InputLabel htmlFor="message_template" value={t('bulk.messageTemplate')} />
                        <select
                            id="message_template"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="">{t('bulk.selectTemplate')}</option>
                            <option value="promotion">{t('templates.promotion')}</option>
                            <option value="reminder">{t('templates.reminder')}</option>
                            <option value="birthday">{t('templates.birthday')}</option>
                            <option value="holiday">{t('templates.holiday')}</option>
                        </select>
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="message_content" value={t('bulk.messageContent')} />
                        <textarea
                            id="message_content"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            rows={5}
                            placeholder={t('bulk.messagePlaceholder')}
                            value={bulkSmsContent}
                            onChange={(e) => setBulkSmsContent(e.target.value)}
                        ></textarea>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('bulk.availableTags')}: {'{{name}}, {{category}}, {{birthday}}, {{phone}}'}
                        </p>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <InputLabel htmlFor="schedule_message" value={t('bulk.scheduleMessage')} />
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-indigo-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-indigo-800"></div>
                            </label>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="schedule_date" value={t('bulk.scheduleDate')} />
                                <input
                                    type="date"
                                    id="schedule_date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="schedule_time" value={t('bulk.scheduleTime')} />
                                <input
                                    type="time"
                                    id="schedule_time"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('bulk.summary')}
                        </div>
                        <div className="mt-2 rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-600">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('bulk.recipients')}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedClients.length}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 py-2 dark:border-gray-600">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('bulk.estimatedCost')}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedClients.length} SMS</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('bulk.remaining')}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{subscription.smsBalance - selectedClients.length} SMS</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-2">
                        <SecondaryButton onClick={() => setShowBulkSmsModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton onClick={handleBulkSms}>
                            {t('bulk.send')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
