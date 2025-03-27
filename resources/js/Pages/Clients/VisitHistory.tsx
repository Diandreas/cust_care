import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Visit {
    id: number;
    client_id: number;
    user_id: number;
    visit_date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
}

interface VisitHistoryProps {
    client: Client;
    visits: {
        data: Visit[];
        links: any[];
        total: number;
    };
}

export default function VisitHistory({
    auth,
    client,
    visits
}: PageProps<VisitHistoryProps>) {
    const { t } = useTranslation();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                {t('visits.historyTitle', { client: client.name })}
            </h2>}
        >
            <Head title={t('visits.historyTitle', { client: client.name })} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <Link
                            href={route('clients.show', client.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('common.backToClient')}
                        </Link>

                        <Link
                            href={route('clients.recordVisit', client.id)}
                            method="post"
                            as="button"
                            data={{ notes: '' }}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('visits.recordNewVisit')}
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                {t('visits.clientInfo')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                                <p>{t('common.name')}: {client.name}</p>
                                <p>{t('common.phone')}: {client.phone}</p>
                                {client.email && <p>{t('common.email')}: {client.email}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                {t('visits.history')} ({visits.total})
                            </h3>

                            {visits.data.length > 0 ? (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('visits.date')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('visits.recordedBy')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('visits.notes')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {visits.data.map((visit) => (
                                                <tr key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDate(visit.visit_date)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {visit.user.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {visit.notes || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="mt-4 text-gray-500 dark:text-gray-400">
                                    {t('visits.noHistory')}
                                </p>
                            )}

                            {/* Pagination */}
                            {visits.links && visits.links.length > 3 && (
                                <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
                                    <div className="flex flex-1 justify-between sm:hidden">
                                        <Link
                                            href={visits.links[0].url || '#'}
                                            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${!visits.links[0].url ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            {t('pagination.previous')}
                                        </Link>
                                        <Link
                                            href={visits.links[visits.links.length - 1].url || '#'}
                                            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${!visits.links[visits.links.length - 1].url ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            {t('pagination.next')}
                                        </Link>
                                    </div>
                                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {t('pagination.showing')} <span className="font-medium">{visits.data.length}</span> {t('pagination.of')} <span className="font-medium">{visits.total}</span> {t('pagination.results')}
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                {visits.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                            ? 'z-10 bg-indigo-600 text-white dark:bg-indigo-800'
                                                            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                                            } ${index === 0
                                                                ? 'rounded-l-md'
                                                                : index === visits.links.length - 1
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
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 