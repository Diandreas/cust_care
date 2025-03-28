import React, { useState, useEffect, useRef } from 'react';
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
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const { success, error } = useToast();
    const [bulkSmsContent, setBulkSmsContent] = useState('');
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

    // Fonction d'analyse de fichier CSV simplifiée
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
                    error(t('import.fileError'));
                }
            };
            reader.readAsText(file);
        }
    };

    // Fonction d'importation simplifiée
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

    // Fonction d'exportation simplifiée sans rechargement de page
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

    const formatPhoneNumber = (phone: string) => {
        return phone?.replace(/(\d{2})(?=\d)/g, '$1 ');
    };

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
                            get(route('clients.index'), {
                                preserveState: true,
                                only: ['clients', 'stats']
                            });
                            setSelectedClients([]);
                        })
                        .catch(err => {
                            error(t('common.error'));
                        });
                }
                break;
        }
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
            error(t('sms.contentRequired'));
            return;
        }

        axios.post(route('messages.bulkSend'), {
            client_ids: selectedClients,
            content: bulkSmsContent,
        })
            .then(response => {
                success(t('sms.sendSuccess'));
                setShowBulkSmsModal(false);
                setBulkSmsContent('');
            })
            .catch(err => {
                if (err.response && err.response.status === 403) {
                    error(t('subscription.limit.upgradeRequired'));
                } else {
                    error(t('common.error', { details: err.response?.data?.message || t('common.unknownError') }));
                }
            });
    };

    // Fonction pour obtenir l'initiale du nom du client (pour l'avatar)
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Générer une couleur d'arrière-plan d'avatar basée sur le nom
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.clients')}</h2>}
        >
            <Head title={t('common.clients')} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Statistiques clients avec design amélioré */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.totalClients')}</div>
                                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        {stats.totalClients.toLocaleString()}
                                        <span className="ml-2 text-sm font-medium text-green-500 dark:text-green-400">
                                            +{stats.newClientsThisMonth} {t('stats.thisMonth')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.activeClients')}</div>
                                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        {stats.activeClientsLast30Days.toLocaleString()}
                                        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {Math.round((stats.activeClientsLast30Days / stats.totalClients) * 100)}% {t('stats.ofTotal')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.smsSent')}</div>
                                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        {stats.totalSmsSent.toLocaleString()}
                                        <span className="ml-2 text-sm font-medium text-blue-500 dark:text-blue-400">
                                            {subscription.smsBalance} {t('stats.smsRemaining')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.subscription')}</div>
                                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {subscription.plan}
                                        <div className="mt-1 text-sm font-medium">
                                            <span className={`${subscription.clientsCount > subscription.clientsLimit * 0.9 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {subscription.clientsCount}/{subscription.clientsLimit} {t('stats.clientsUsed')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 space-y-4">
                        {/* Barre d'actions et recherche avec design amélioré */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <form onSubmit={handleSearch} className="flex w-full gap-2 md:w-auto md:flex-1">
                                    <div className="relative flex-grow">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={data.search}
                                            onChange={(e) => setData('search', e.target.value)}
                                            placeholder={t('common.searchClients')}
                                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('common.search')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                        className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        {t('common.filters')}
                                        {(data.tag_id || data.date_range || data.birthday_month) && (
                                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                                                {[data.tag_id, data.date_range, data.birthday_month].filter(Boolean).length}
                                            </span>
                                        )}
                                    </button>
                                </form>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('table')}
                                        className={`flex items-center rounded-lg px-4 py-2 ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        {t('common.tableView')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`flex items-center rounded-lg px-4 py-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                        </svg>
                                        {t('common.gridView')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={route('clients.create')}
                                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
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
                                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
                                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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

                        {/* Panneau de filtres avancés avec design amélioré */}
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
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                        <div className="mt-1 flex rounded-lg shadow-sm">
                                            <select
                                                value={data.sort_by}
                                                onChange={(e) => setData('sort_by', e.target.value)}
                                                className="block w-full rounded-l-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                                className="inline-flex items-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200"
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
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('common.applyFilters')}
                                    </button>
                                </div>
                            </div>
                        </Transition>

                        {/* Actions de lot si clients sélectionnés avec design amélioré */}
                        {selectedClients.length > 0 && (
                            <div className="sticky top-20 z-10 mt-2 rounded-lg bg-indigo-50 p-4 shadow-sm transition-all dark:bg-indigo-900/40">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center text-indigo-700 dark:text-indigo-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="font-medium">
                                            {selectedClients.length} {t('clients.selectedClients')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleBulkAction('sms')}
                                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
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
                                                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
                                            <Dropdown.Content width="48">
                                                <button
                                                    className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onClick={() => setShowExportModal(true)}
                                                >
                                                    {t('clients.exportSelected')}
                                                </button>
                                                <button
                                                    className="block w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    onClick={() => handleBulkAction('delete')}
                                                >
                                                    {t('clients.deleteSelected')}
                                                </button>
                                            </Dropdown.Content>
                                        </Dropdown>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedClients([])}
                                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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

                    {/* Vue en tableau améliorée */}
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
                                        {clients.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('clients.noClients')}</h3>
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clients.noClientsDescription')}</p>
                                                        <div className="mt-6">
                                                            <Link
                                                                href={route('clients.create')}
                                                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                            >
                                                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                                </svg>
                                                                {t('common.addClient')}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            clients.data.map((client) => (
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
                                                            className="flex items-center"
                                                        >
                                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${getAvatarColor(client.name)}`}>
                                                                {getInitials(client.name)}
                                                            </div>
                                                            <span className="ml-3 font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                {client.name}
                                                            </span>
                                                        </Link>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        <a href={`tel:${client.phone}`} className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            {formatPhoneNumber(client.phone)}
                                                        </a>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.email && (
                                                            <a href={`mailto:${client.email}`} className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="truncate max-w-[150px]">{client.email}</span>
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.tags && client.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {client.tags.map(tag => (
                                                                    <span key={tag.id} className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                                        {tag.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.birthday && (
                                                            <div className="flex items-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                                                </svg>
                                                                {formatDate(client.birthday)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.lastContact && (
                                                            <div className="flex items-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                </svg>
                                                                {formatDate(client.lastContact)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                        <div className="flex space-x-3">
                                                            <Link
                                                                href={route('clients.show', client.id)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                            >
                                                                {t('common.show')}
                                                            </Link>
                                                            <Link
                                                                href={route('clients.edit', client.id)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                            >
                                                                {t('common.edit')}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {clients.links.length > 3 && (
                                <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
                                    <nav className="flex items-center justify-between">
                                        <div className="hidden sm:block">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                                            </p>
                                        </div>
                                        <div className="flex flex-1 justify-between sm:justify-end">
                                            {clients.links.map((link, i) => {
                                                // Skip the "current" link
                                                if (i === 0 || i === clients.links.length - 1 || !link.url) {
                                                    return null;
                                                }

                                                return (
                                                    <Link
                                                        key={i}
                                                        href={link.url}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                            ? 'z-10 bg-indigo-600 text-white focus:z-20'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                            } border border-gray-300 dark:border-gray-600`}
                                                    >
                                                        {link.label.replace('&laquo;', '←').replace('&raquo;', '→')}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </nav>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vue en grille améliorée */}
                    {viewMode === 'grid' && (
                        <div className="space-y-6">
                            {clients.data.length === 0 ? (
                                <div className="mt-6 rounded-lg bg-white px-6 py-12 text-center shadow dark:bg-gray-800">
                                    <div className="flex flex-col items-center">
                                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('clients.noClients')}</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clients.noClientsDescription')}</p>
                                        <div className="mt-6">
                                            <Link
                                                href={route('clients.create')}
                                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            >
                                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                {t('common.addClient')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {clients.data.map((client) => (
                                            <div key={client.id} className="relative overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
                                                {/* En-tête avec checkbox */}
                                                <div className="relative">
                                                    <div className="absolute left-3 top-3 z-10">
                                                        <Checkbox
                                                            checked={selectedClients.includes(client.id)}
                                                            onChange={() => toggleClient(client.id)}
                                                        />
                                                    </div>
                                                    <div className="absolute right-3 top-3 z-10">
                                                        <Dropdown>
                                                            <Dropdown.Trigger>
                                                                <button className="rounded-full bg-white p-1 text-gray-400 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                    </svg>
                                                                </button>
                                                            </Dropdown.Trigger>
                                                            <Dropdown.Content>
                                                                <Link
                                                                    href={route('clients.edit', client.id)}
                                                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    {t('common.edit')}
                                                                </Link>
                                                                <button
                                                                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                                    onClick={() => handleBulkAction('delete')}
                                                                >
                                                                    {t('common.delete')}
                                                                </button>
                                                            </Dropdown.Content>
                                                        </Dropdown>
                                                    </div>

                                                    {/* Avatar et nom du client */}
                                                    <div className="flex flex-col items-center p-6">
                                                        <div className={`mb-3 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ${getAvatarColor(client.name)}`}>
                                                            {getInitials(client.name)}
                                                        </div>
                                                        <Link
                                                            href={route('clients.show', client.id)}
                                                            className="mt-1 truncate text-center text-lg font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                        >
                                                            {client.name}
                                                        </Link>

                                                        {/* Tags */}
                                                        {client.tags && client.tags.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap justify-center gap-1">
                                                                {client.tags.slice(0, 2).map(tag => (
                                                                    <span key={tag.id} className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                                        {tag.name}
                                                                    </span>
                                                                ))}
                                                                {client.tags.length > 2 && (
                                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                        +{client.tags.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Informations de contact */}
                                                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <a href={`tel:${client.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                {formatPhoneNumber(client.phone)}
                                                            </a>
                                                        </div>

                                                        {client.email && (
                                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                <a href={`mailto:${client.email}`} className="truncate hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                    {client.email}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {client.birthday && (
                                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                                                </svg>
                                                                {formatDate(client.birthday)}
                                                            </div>
                                                        )}

                                                        {client.lastContact && (
                                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                </svg>
                                                                {formatDate(client.lastContact)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions rapides */}
                                                <div className="flex divide-x divide-gray-200 border-t border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                                                    <Link
                                                        href={route('clients.show', client.id)}
                                                        className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        {t('common.show')}
                                                    </Link>
                                                    <Link
                                                        href={route('clients.edit', client.id)}
                                                        className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        {t('common.edit')}
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination pour la vue grille */}
                                    {clients.links.length > 3 && (
                                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
                                            <div className="hidden sm:block">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                                                </p>
                                            </div>
                                            <div className="flex flex-1 justify-between sm:justify-end">
                                                {clients.links.map((link, i) => {
                                                    // Skip the "current" link
                                                    if (i === 0 || i === clients.links.length - 1 || !link.url) {
                                                        return null;
                                                    }

                                                    return (
                                                        <Link
                                                            key={i}
                                                            href={link.url}
                                                            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${link.active
                                                                ? 'z-10 bg-indigo-600 text-white focus:z-20'
                                                                : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                                } border border-gray-300 dark:border-gray-600`}
                                                        >
                                                            {link.label.replace('&laquo;', '←').replace('&raquo;', '→')}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Modal d'importation simplifiée */}
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

            {/* Modal d'exportation avec design amélioré */}
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
                                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-700"
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
                                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-700"
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

            {/* Modal d'envoi de SMS en masse avec design amélioré */}
            <Modal show={showBulkSmsModal} onClose={() => setShowBulkSmsModal(false)} maxWidth="xl">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t('bulk.sendSms')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t('bulk.sendSmsDescription', { count: selectedClients.length })}
                    </p>

                    <div className="mt-6">
                        <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/30">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                                        {t('bulk.recipientInfo')}
                                    </h3>
                                    <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                                        <p>{t('bulk.selectedClients', { count: selectedClients.length })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="message_template" value={t('bulk.messageTemplate')} />
                        <select
                            id="message_template"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            rows={5}
                            placeholder={t('bulk.messagePlaceholder')}
                            value={bulkSmsContent}
                            onChange={(e) => setBulkSmsContent(e.target.value)}
                        ></textarea>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('bulk.availableTags')}: <code className="text-xs">{'{{name}}, {{category}}, {{birthday}}, {{phone}}'}</code>
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
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="schedule_time" value={t('bulk.scheduleTime')} />
                                <input
                                    type="time"
                                    id="schedule_time"
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('bulk.summary')}
                        </div>
                        <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
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
                        <PrimaryButton onClick={handleBulkSms} disabled={!bulkSmsContent.trim()}>
                            {t('bulk.send')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}