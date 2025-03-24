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

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    birthday: string | null;
    address: string | null;
    notes: string | null;
    category: Category | null;
    lastContact: string | null;
    tags: Tag[];
    totalSmsCount: number;
    lastSmsDate: string | null;
}

interface Category {
    id: number;
    name: string;
    color: string;
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
    categories: Category[];
    tags: Tag[];
    filters: {
        search: string;
        category_id: number | null;
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
        clientsByCategory: { category: string; count: number }[];
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
    categories,
    tags,
    filters,
    stats,
    subscription,
}: PageProps<ClientsIndexProps>) {
    const { t } = useTranslation();
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
    const [showClientDetail, setShowClientDetail] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards'>('table');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

    // État pour la recherche et les filtres
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        category_id: filters.category_id || '',
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    // Assuming CSV for simplicity
                    const text = event.target?.result as string;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',');

                    // Create initial field mapping
                    const initialMapping: Record<string, string> = {};
                    headers.forEach(header => {
                        // Try to match headers with our fields
                        const normalizedHeader = header.trim().toLowerCase();
                        if (normalizedHeader.includes('name')) initialMapping[header] = 'name';
                        else if (normalizedHeader.includes('phone') || normalizedHeader.includes('tel')) initialMapping[header] = 'phone';
                        else if (normalizedHeader.includes('email')) initialMapping[header] = 'email';
                        else if (normalizedHeader.includes('birth')) initialMapping[header] = 'birthday';
                        else if (normalizedHeader.includes('address')) initialMapping[header] = 'address';
                        else if (normalizedHeader.includes('note')) initialMapping[header] = 'notes';
                        else if (normalizedHeader.includes('cat')) initialMapping[header] = 'category';
                        else initialMapping[header] = '';
                    });
                    setFieldMapping(initialMapping);

                    // Preview first 5 rows
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
                }
            };
            reader.readAsText(file);
        }
    };

    const handleImport = () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mapping', JSON.stringify(fieldMapping));

        fetch(route('clients.import'), {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setShowImportModal(false);
                    // Reload page or update clients list
                    window.location.reload();
                } else {
                    alert(data.message || t('common.importError'));
                }
            })
            .catch(error => {
                console.error('Import error:', error);
                alert(t('common.importError'));
            });
    };

    const handleExport = (format: 'csv' | 'excel') => {
        const params = new URLSearchParams();
        params.append('format', format);
        Object.entries(data).forEach(([key, value]) => {
            if (value) params.append(key, value.toString());
        });

        if (selectedClients.length > 0) {
            selectedClients.forEach(id => params.append('selected[]', id.toString()));
        }

        window.location.href = `${route('clients.export')}?${params.toString()}`;
        setShowExportModal(false);
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
        if (selectedClients.length === 0) return;

        if (action === 'delete') {
            if (confirm(t('clients.confirmBulkDelete'))) {
                fetch(route('clients.bulkDestroy'), {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ ids: selectedClients }),
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.location.reload();
                        } else {
                            alert(data.message || t('common.error'));
                        }
                    });
            }
        } else if (action === 'category') {
            // Implement bulk category update
        } else if (action === 'sms') {
            setShowBulkSmsModal(true);
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
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => {
                                            setData('category_id', e.target.value);
                                            get(route('clients.index'), {
                                                data: { ...data, category_id: e.target.value },
                                                preserveState: true,
                                                replace: true,
                                            });
                                        }}
                                        className="rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    >
                                        <option value="">{t('common.allCategories')}</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
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
                                                category_id: '',
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
                                                    onClick={() => handleBulkAction('category')}
                                                >
                                                    {t('clients.updateCategory')}
                                                </button>
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
                                                {t('common.category')}
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
                                                    <button
                                                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                                                        onClick={() => setShowClientDetail(client.id)}
                                                    >
                                                        {client.name}
                                                    </button>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <a href={`tel:${client.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                                        {client.phone}
                                                    </a>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {client.email ? (
                                                        <a href={`mailto:${client.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            {client.email}
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {client.category ? (
                                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                            {client.category.name}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(client.birthday)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(client.lastContact)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={route('messages.create', { client_id: client.id })}
                                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                            </svg>
                                                        </Link>
                                                        <Link
                                                            href={route('clients.edit', client.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                        <Link
                                                            href={route('clients.destroy', client.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            onClick={(e) => {
                                                                if (!confirm(t('clients.confirmDelete'))) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {clients.data.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                    {t('common.noResults')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {clients.links && clients.links.length > 3 && (
                                <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
                                    <div className="flex flex-1 justify-between sm:hidden">
                                        <a
                                            href={clients.links[0].url}
                                            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${!clients.links[0].url ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            {t('pagination.previous')}
                                        </a>

                                        <a
                                            href={clients.links[clients.links.length - 1].url}
                                            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${!clients.links[clients.links.length - 1].url ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            {t('pagination.next')}
                                        </a>
                                    </div>
                                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                {clients.links.map((link, index) => (
                                                    <a
                                                        key={index}
                                                        href={link.url}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                            ? 'z-10 bg-indigo-600 text-white dark:bg-indigo-800'
                                                            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                                            } ${index === 0
                                                                ? 'rounded-l-md'
                                                                : index === clients.links.length - 1
                                                                    ? 'rounded-r-md'
                                                                    : ''
                                                            } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vue en grille */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {clients.data.map((client) => (
                                <div key={client.id} className="flex flex-col overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="flex items-start justify-between p-4">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={selectedClients.includes(client.id)}
                                                onChange={() => toggleClient(client.id)}
                                            />
                                            <button
                                                onClick={() => setShowClientDetail(client.id)}
                                                className="text-lg font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                                            >
                                                {client.name}
                                            </button>
                                        </div>
                                        {client.category && (
                                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                {client.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2 p-4 pt-0">
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <a href={`tel:${client.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                                {client.phone}
                                            </a>
                                        </div>
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
                                        {client.birthday && (
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                                </svg>
                                                {formatDate(client.birthday)}
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {client.lastContact ? formatDate(client.lastContact) : t('common.never')}
                                        </div>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700">
                                        <Link
                                            href={route('messages.create', { client_id: client.id })}
                                            className="rounded-md px-2 py-1 text-green-600 hover:bg-green-100 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                        </Link>
                                        <Link
                                            href={route('clients.edit', client.id)}
                                            className="rounded-md px-2 py-1 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>
                                        <Link
                                            href={route('clients.destroy', client.id)}
                                            method="delete"
                                            as="button"
                                            className="rounded-md px-2 py-1 text-red-600 hover:bg-red-100 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                            onClick={(e) => {
                                                if (!confirm(t('clients.confirmDelete'))) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {clients.data.length === 0 && (
                                <div className="col-span-full rounded-lg border border-gray-200 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                    {t('common.noResults')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vue en cartes */}
                    {viewMode === 'cards' && (
                        <div className="space-y-6">
                            {clients.data.map((client) => (
                                <div key={client.id} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    checked={selectedClients.includes(client.id)}
                                                    onChange={() => toggleClient(client.id)}
                                                />
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                    {client.name}
                                                </h3>
                                                {client.category && (
                                                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                        {client.category.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={route('messages.create', { client_id: client.id })}
                                                    className="rounded-md px-2 py-1 text-green-600 hover:bg-green-100 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={route('clients.edit', client.id)}
                                                    className="rounded-md px-2 py-1 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={route('clients.destroy', client.id)}
                                                    method="delete"
                                                    as="button"
                                                    className="rounded-md px-2 py-1 text-red-600 hover:bg-red-100 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                                    onClick={(e) => {
                                                        if (!confirm(t('clients.confirmDelete'))) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700 md:grid-cols-2 md:divide-x md:divide-y-0">
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.contact')}</h4>
                                                    <div className="mt-2 space-y-2">
                                                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <a href={`tel:${client.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                {client.phone}
                                                            </a>
                                                        </div>
                                                        {client.email && (
                                                            <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                <a href={`mailto:${client.email}`} className="truncate hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                    {client.email}
                                                                </a>
                                                            </div>
                                                        )}
                                                        {client.birthday && (
                                                            <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                                                </svg>
                                                                {formatDate(client.birthday)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.activity')}</h4>
                                                    <div className="mt-2 space-y-2">
                                                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-gray-700 dark:text-gray-300">{t('common.lastContact')}:</span>
                                                            <span className="ml-1">{client.lastContact ? formatDate(client.lastContact) : t('common.never')}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                            </svg>
                                                            <span className="text-gray-700 dark:text-gray-300">{t('common.totalSms')}:</span>
                                                            <span className="ml-1">{client.totalSmsCount || 0}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-gray-700 dark:text-gray-300">{t('common.lastSms')}:</span>
                                                            <span className="ml-1">{client.lastSmsDate ? formatDate(client.lastSmsDate) : t('common.never')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.notes')}</h4>
                                            <div className="mt-2 text-sm text-gray-900 dark:text-gray-200">
                                                {client.notes || t('common.noNotes')}
                                            </div>
                                            {client.tags && client.tags.length > 0 && (
                                                <>
                                                    <h4 className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.tags')}</h4>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {client.tags.map(tag => (
                                                            <span key={tag.id} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {clients.data.length === 0 && (
                                <div className="rounded-lg border border-gray-200 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                    {t('common.noResults')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination pour les vues grille et cartes */}
                    {(viewMode === 'grid' || viewMode === 'cards') && clients.links && clients.links.length > 3 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    {clients.links.map((link, index) => (
                                        <a
                                            key={index}
                                            href={link.url}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                ? 'z-10 bg-indigo-600 text-white dark:bg-indigo-800'
                                                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                                } ${index === 0
                                                    ? 'rounded-l-md'
                                                    : index === clients.links.length - 1
                                                        ? 'rounded-r-md'
                                                        : ''
                                                } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal d'importation */}
            <Modal show={showImportModal} onClose={() => setShowImportModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t('import.title')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t('import.description')}
                    </p>

                    <div className="mt-6">
                        <InputLabel htmlFor="import_file" value={t('import.selectFile')} />
                        <input
                            id="import_file"
                            type="file"
                            className="mt-1 block w-full"
                            onChange={handleFileChange}
                            accept=".csv,.xls,.xlsx"
                        />
                    </div>

                    {previewData.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('import.preview')}
                            </h3>
                            <div className="mt-2 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            {Object.keys(previewData[0]).map((header) => (
                                                <th key={header} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {previewData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Object.entries(row).map(([key, value], colIndex) => (
                                                    <td key={`${rowIndex}-${colIndex}`} className="whitespace-nowrap px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
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
                                            <option value="category">{t('common.category')}</option>
                                            <option value="tags">{t('common.tags')}</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-2">
                        <SecondaryButton onClick={() => setShowImportModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton onClick={handleImport} disabled={!selectedFile || Object.values(fieldMapping).filter(Boolean).length === 0}>
                            {t('import.import')}
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

                    <div className="mt-6 space-y-2">
                        <label className="flex items-center space-x-3">
                            <input
                                type="radio"
                                name="export_format"
                                value="csv"
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                defaultChecked
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('export.csv')}</span>
                        </label>
                        <label className="flex items-center space-x-3">
                            <input
                                type="radio"
                                name="export_format"
                                value="excel"
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('export.excel')}</span>
                        </label>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t('export.includeFields')}
                        </h3>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.name')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.phone')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.email')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.category')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.birthday')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.address')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.notes')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.tags')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.lastContact')}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.totalSms')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-2">
                        <SecondaryButton onClick={() => setShowExportModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton onClick={() => handleExport('csv')}>
                            {t('export.export')}
                        </PrimaryButton>
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
                        <PrimaryButton>
                            {t('bulk.send')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Modal de détail client */}
            <Modal show={showClientDetail !== null} onClose={() => setShowClientDetail(null)} maxWidth="3xl">
                {showClientDetail !== null && (
                    <div className="p-6">
                        {/* Trouver le client sélectionné */}
                        {(() => {
                            const client = clients.data.find(c => c.id === showClientDetail);
                            if (!client) return null;

                            return (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            {client.name}
                                        </h2>
                                        <div className="flex space-x-3">
                                            <Link
                                                href={route('messages.create', { client_id: client.id })}
                                                className="inline-flex items-center rounded-md border border-transparent bg-green-100 px-3 py-2 text-sm font-medium leading-4 text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-900/20 dark:text-green-400"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                                {t('common.sendMessage')}
                                            </Link>
                                            <Link
                                                href={route('clients.edit', client.id)}
                                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium leading-4 text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-900/20 dark:text-indigo-400"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                {t('common.edit')}
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {/* Informations de contact */}
                                        <div className="col-span-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('client.contactInformation')}
                                            </h3>
                                            <div className="mt-3 space-y-3">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('common.phone')}</div>
                                                        <a href={`tel:${client.phone}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
                                                            {client.phone}
                                                        </a>
                                                    </div>
                                                </div>
                                                {client.email && (
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{t('common.email')}</div>
                                                            <a href={`mailto:${client.email}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
                                                                {client.email}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                                {client.address && (
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{t('common.address')}</div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {client.address}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {client.birthday && (
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                                        </svg>
                                                        <div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{t('common.birthday')}</div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatDate(client.birthday)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {client.category && (
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                        <div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{t('common.category')}</div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {client.category.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activités SMS */}
                                        <div className="col-span-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('client.smsActivity')}
                                            </h3>
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('client.totalSms')}</div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{client.totalSmsCount || 0}</div>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-gray-200 py-3 dark:border-gray-700">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('client.lastSms')}</div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {client.lastSmsDate ? formatDate(client.lastSmsDate) : t('common.never')}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-3">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('client.lastContact')}</div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {client.lastContact ? formatDate(client.lastContact) : t('common.never')}
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('client.recentMessages')}
                                            </h3>
                                            <div className="mt-3 space-y-3">
                                                {/* Liste des messages récents - simulée car nous n'avons pas les vraies données */}
                                                <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                                                    <div className="flex justify-between">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">25/03/2025</div>
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                                            {t('client.sent')}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        Bonjour {client.name}, nous vous informons de notre nouvelle offre...
                                                    </div>
                                                </div>
                                                <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                                                    <div className="flex justify-between">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">15/03/2025</div>
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                                            {t('client.sent')}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-sm text-gray-900 dark:text-white">
                                                        Cher client, n'oubliez pas votre rendez-vous du 16/03 à 14h...
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes & tags */}
                                        <div className="col-span-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('client.notes')}
                                                </h3>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    {t('common.edit')}
                                                </button>
                                            </div>
                                            <div className="mt-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {client.notes || t('client.noNotes')}
                                                </div>
                                            </div>

                                            <h3 className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('client.tags')}
                                            </h3>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {client.tags && client.tags.length > 0 ? (
                                                    client.tags.map(tag => (
                                                        <span key={tag.id} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                            {tag.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">{t('client.noTags')}</span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <h3 className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('client.plannedCampaigns')}
                                            </h3>
                                            <div className="mt-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{t('campaigns.birthday')}</div>
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                        {t('campaigns.active')}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {t('campaigns.nextSend')}: {formatDate(client.birthday)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {t('client.messageHistory')}
                                        </h3>
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                            {t('messages.date')}
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                            {t('messages.message')}
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                            {t('messages.status')}
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                            {t('messages.campaign')}
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                            {t('messages.actions')}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                    {/* Messages récents - données simulées */}
                                                    <tr>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            25/03/2025 09:45
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            <div className="max-w-xs truncate">
                                                                Bonjour {client.name}, nous vous informons de notre nouvelle offre...
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                                                {t('messages.delivered')}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            Promotion Mars
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            <div className="flex space-x-2">
                                                                <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>
                                                                <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            15/03/2025 14:22
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            <div className="max-w-xs truncate">
                                                                Cher client, n'oubliez pas votre rendez-vous du 16/03 à 14h...
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                                                {t('messages.delivered')}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            Rappel RDV
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            <div className="flex space-x-2">
                                                                <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>
                                                                <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}