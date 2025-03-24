// resources/js/Pages/Campaigns/Show.tsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Client {
    id: number;
    name: string;
    phone: string;
}

interface Campaign {
    id: number;
    name: string;
    message_content: string;
    status: 'draft' | 'scheduled' | 'sent' | 'paused';
    scheduled_at: string | null;
    recipients_count: number;
    delivered_count: number;
    failed_count: number;
    created_at: string;
    recipients: Client[];
}

interface CampaignShowProps {
    campaign: Campaign;
}

export default function CampaignShow({
    auth,
    campaign,
}: PageProps<CampaignShowProps>) {
    const { t } = useTranslation();

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'sent':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'paused':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
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
            case 'sent':
                return t('campaigns.status.sent');
            case 'paused':
                return t('campaigns.status.paused');
            default:
                return status;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('campaigns.details')}</h2>}
        >
            <Head title={t('campaigns.details')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <div className="flex flex-col justify-between md:flex-row md:items-center">
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{campaign.name}</h3>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                        {t('campaigns.createdOn')}: {formatDate(campaign.created_at)}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                                        {getStatusName(campaign.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            {/* Statistiques de la campagne */}
                            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-700">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('campaigns.recipients')}</div>
                                    <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{campaign.recipients_count}</div>
                                </div>
                                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-700">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('campaigns.delivered')}</div>
                                    <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                                        {campaign.status === 'sent' ? campaign.delivered_count : '-'}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-700">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('campaigns.sendingTime')}</div>
                                    <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                        {campaign.scheduled_at ? formatDate(campaign.scheduled_at) : t('campaigns.immediately')}
                                    </div>
                                </div>
                            </div>

                            {/* Message de la campagne */}
                            <div className="mb-8">
                                <h4 className="mb-2 text-base font-medium text-gray-900 dark:text-white">{t('campaigns.messageContent')}</h4>
                                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                                    <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-200">{campaign.message_content}</p>
                                </div>
                                <div className="mt-2 text-right text-sm text-gray-500 dark:text-gray-400">
                                    {campaign.message_content.length} {t('campaigns.characters')} ({Math.ceil(campaign.message_content.length / 160)} SMS)
                                </div>
                            </div>

                            {/* Taux de livraison (si envoyé) */}
                            {campaign.status === 'sent' && (
                                <div className="mb-8">
                                    <h4 className="mb-2 text-base font-medium text-gray-900 dark:text-white">{t('campaigns.deliveryRate')}</h4>
                                    <div className="mb-1 flex items-center">
                                        <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {Math.round((campaign.delivered_count / campaign.recipients_count) * 100)}%
                                        </span>
                                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                                            <div
                                                className="h-2 rounded-full bg-green-500"
                                                style={{ width: `${(campaign.delivered_count / campaign.recipients_count) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        {campaign.delivered_count} {t('campaigns.delivered')}, {campaign.failed_count} {t('campaigns.failed')}
                                    </div>
                                </div>
                            )}

                            {/* Liste des destinataires */}
                            <div>
                                <h4 className="mb-2 text-base font-medium text-gray-900 dark:text-white">{t('campaigns.recipientsList')}</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('common.name')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('common.phone')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {campaign.recipients.map((client) => (
                                                <tr key={client.id}>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                        {client.name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.phone}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                            <div className="flex justify-between">
                                <Link
                                    href={route('campaigns.index')}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    {t('common.back')}
                                </Link>
                                <div className="flex space-x-2">
                                    {campaign.status === 'draft' && (
                                        <Link
                                            href={route('campaigns.edit', campaign.id)}
                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
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
                                            className="inline-flex items-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:bg-yellow-700 dark:hover:bg-yellow-600"

                                            href={route('campaigns.destroy', campaign.id)}
                                            method="delete"
                                            as="button"
                                            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}