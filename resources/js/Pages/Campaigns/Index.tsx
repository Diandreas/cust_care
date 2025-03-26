// resources/js/Pages/Campaigns/Index.tsx
import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Campaign } from '@/types';

interface CampaignsIndexProps {
    campaigns: {
        data: Campaign[];
        links: any[];
        total: number;
    };
    [key: string]: unknown;
}

export default function CampaignsIndex({
    auth,
    campaigns,
}: PageProps<CampaignsIndexProps>) {
    const { t } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'sending':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'sent':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'partially_sent':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'paused':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusName = (status: string) => {
        switch (status) {
            case 'draft':
                return t('campaigns.status.draft');
            case 'scheduled':
                return t('campaigns.status.scheduled');
            case 'sending':
                return t('campaigns.status.sending');
            case 'sent':
                return t('campaigns.status.sent');
            case 'partially_sent':
                return t('campaigns.status.partiallySent');
            case 'paused':
                return t('campaigns.status.paused');
            case 'failed':
                return t('campaigns.status.failed');
            case 'cancelled':
                return t('campaigns.status.cancelled');
            default:
                return status;
        }
    };

    // Filtrer les campagnes par statut
    const filteredCampaigns = statusFilter === 'all'
        ? campaigns.data
        : campaigns.data.filter((campaign) => campaign.status === statusFilter);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.campaigns')}</h2>}
        >
            <Head title={t('common.campaigns')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.filterByStatus')}: </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === 'all'
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {t('campaigns.status.all')}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('draft')}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === 'draft'
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {t('campaigns.status.draft')}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('scheduled')}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === 'scheduled'
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {t('campaigns.status.scheduled')}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('sent')}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === 'sent'
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {t('campaigns.status.sent')}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('paused')}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === 'paused'
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {t('campaigns.status.paused')}
                                </button>
                            </div>
                        </div>
                        <Link
                            href={route('campaigns.create')}
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
                            {t('campaigns.create')}
                        </Link>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.name')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.status')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('campaigns.scheduledDate')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('campaigns.recipients')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('campaigns.delivery')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {filteredCampaigns.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                {t('campaigns.noCampaigns')}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCampaigns.map((campaign) => (
                                            <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        <Link href={route('campaigns.show', campaign.id)} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            {campaign.name}
                                                        </Link>
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDate(campaign.created_at)}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                                                        {getStatusName(campaign.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(campaign.scheduled_at)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {campaign.recipients_count}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {campaign.status === 'sent' ? (
                                                        <div>
                                                            <div className="flex items-center">
                                                                <span className="mr-2 text-xs">{Math.round((campaign.delivered_count / campaign.recipients_count) * 100)}%</span>
                                                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                                    <div
                                                                        className="h-2 rounded-full bg-green-500"
                                                                        style={{ width: `${(campaign.delivered_count / campaign.recipients_count) * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 text-xs">
                                                                {campaign.delivered_count} {t('campaigns.delivered')}, {campaign.failed_count} {t('campaigns.failed')}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={route('campaigns.show', campaign.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            {t('common.details')}
                                                        </Link>
                                                        {campaign.status !== 'sent' && (
                                                            <Link
                                                                href={route('campaigns.edit', campaign.id)}
                                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                            >
                                                                {t('common.edit')}
                                                            </Link>
                                                        )}
                                                        {campaign.status === 'scheduled' && (
                                                            <Link
                                                                href={route('campaigns.status', campaign.id)}
                                                                method="put"
                                                                data={{ status: 'paused' }}
                                                                as="button"
                                                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                                            >
                                                                {t('campaigns.pause')}
                                                            </Link>
                                                        )}
                                                        {campaign.status === 'paused' && (
                                                            <Link
                                                                href={route('campaigns.status', campaign.id)}
                                                                method="put"
                                                                data={{ status: 'scheduled' }}
                                                                as="button"
                                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                            >
                                                                {t('campaigns.resume')}
                                                            </Link>
                                                        )}
                                                        {campaign.status !== 'sent' && (
                                                            <Link
                                                                href={route('campaigns.destroy', campaign.id)}
                                                                method="delete"
                                                                as="button"
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                onClick={(e) => {
                                                                    if (!confirm(t('campaigns.confirmDelete'))) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                            >
                                                                {t('common.delete')}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {campaigns.links && campaigns.links.length > 3 && (
                            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {t('pagination.showing')} <span className="font-medium">{filteredCampaigns.length}</span> {t('pagination.of')} <span className="font-medium">{campaigns.total}</span> {t('pagination.results')}
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            {campaigns.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                        ? 'z-10 bg-indigo-600 text-white dark:bg-indigo-800'
                                                        : 'text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                                        } ${index === 0
                                                            ? 'rounded-l-md'
                                                            : index === campaigns.links.length - 1
                                                                ? 'rounded-r-md'
                                                                : ''
                                                        } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                                >
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Link>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}