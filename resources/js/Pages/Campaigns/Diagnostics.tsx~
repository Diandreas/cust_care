import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps, Campaign } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Message {
    id: number;
    client_id: number;
    status: string;
    error_message: string | null;
    created_at: string;
    client: {
        id: number;
        name: string;
        phone: string;
    };
}

interface CommonError {
    error_message: string;
    count: number;
}

interface DiagnosticsProps {
    campaign: Campaign;
    failedMessages: Message[];
    commonErrors: CommonError[];
    [key: string]: unknown;
}

export default function CampaignDiagnostics({
    auth,
    campaign,
    failedMessages,
    commonErrors,
}: PageProps<DiagnosticsProps>) {
    const { t } = useTranslation();

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('campaigns.diagnostics')}</h2>}
        >
            <Head title={t('campaigns.diagnostics')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <div className="flex flex-col justify-between md:flex-row md:items-center">
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                        {t('campaigns.diagnosticsFor')}: {campaign.name}
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                        {t('campaigns.failedMessages')}: {failedMessages.length}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <Link
                                        href={route('campaigns.show', campaign.id)}
                                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {t('common.back')}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            {/* Statistiques des erreurs communes */}
                            <div className="mb-8">
                                <h4 className="mb-4 text-base font-medium text-gray-900 dark:text-white">
                                    {t('campaigns.commonErrors')}
                                </h4>

                                {commonErrors.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {commonErrors.map((error, index) => (
                                            <div key={index} className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {error.error_message || t('campaigns.unknownError')}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                        {error.count} {t('common.occurrences')}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full"
                                                        style={{ width: `${(error.count / failedMessages.length) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                        {t('campaigns.noCommonErrorsFound')}
                                    </div>
                                )}
                            </div>

                            {/* Actions de correction */}
                            <div className="mb-8 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
                                <h4 className="mb-4 text-base font-medium text-gray-900 dark:text-white">
                                    {t('campaigns.correctiveActions')}
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('campaigns.retryFailedOnly')}
                                        </h5>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {t('campaigns.retryFailedDescription')}
                                        </p>
                                        <div className="mt-3">
                                            <Link
                                                href={route('campaigns.retry.failed', campaign.id)}
                                                method="post"
                                                as="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                            >
                                                {t('campaigns.retryFailedMessages')}
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('campaigns.retryEntireCampaign')}
                                        </h5>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {t('campaigns.retryEntireDescription')}
                                        </p>
                                        <div className="mt-3">
                                            <Link
                                                href={route('campaigns.retry.all', campaign.id)}
                                                method="post"
                                                as="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:bg-yellow-700 dark:hover:bg-yellow-600"
                                            >
                                                {t('campaigns.retryEntireCampaign')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Liste des messages échoués */}
                            <div>
                                <h4 className="mb-4 text-base font-medium text-gray-900 dark:text-white">
                                    {t('campaigns.failedMessagesList')}
                                </h4>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('common.recipient')}
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('common.phone')}
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('common.errorMessage')}
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('common.date')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {failedMessages.length > 0 ? (
                                                failedMessages.map((message) => (
                                                    <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                                                            {message.client.name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {message.client.phone}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            <div className="max-w-xs overflow-hidden text-ellipsis">
                                                                {message.error_message || t('campaigns.unknownError')}
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(message.created_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        {t('campaigns.noFailedMessages')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 