// resources/js/Pages/Messages/Index.tsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Message {
    id: number;
    content: string;
    type: 'promotional' | 'personal' | 'automatic';
    status: 'sent' | 'delivered' | 'failed';
    sent_at: string;
    delivered_at: string | null;
    client: {
        id: number;
        name: string;
        phone: string;
    };
}

interface MessagesIndexProps {
    messages: {
        data: Message[];
        links: any[];
        total: number;
    };
}

export default function MessagesIndex({
    auth,
    messages,
}: PageProps<MessagesIndexProps>) {
    const { t } = useTranslation();

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'sent':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'delivered':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'promotional':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'personal':
                return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
            case 'automatic':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusName = (status: string) => {
        switch (status) {
            case 'sent':
                return t('messages.status.sent');
            case 'delivered':
                return t('messages.status.delivered');
            case 'failed':
                return t('messages.status.failed');
            default:
                return status;
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'promotional':
                return t('messages.type.promotional');
            case 'personal':
                return t('messages.type.personal');
            case 'automatic':
                return t('messages.type.automatic');
            default:
                return type;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.messages')}</h2>}
        >
            <Head title={t('common.messages')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route('messages.create')}
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
                            {t('messages.send')}
                        </Link>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('messages.recipient')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('messages.content')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.type')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.status')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('messages.sentAt')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {messages.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                {t('messages.noMessages')}
                                            </td>
                                        </tr>
                                    ) : (
                                        messages.data.map((message) => (
                                            <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900">
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <span className="text-xs font-medium text-indigo-800 dark:text-indigo-200">
                                                                    {message.client.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{message.client.name}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{message.client.phone}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="line-clamp-2 max-w-xs text-sm text-gray-900 dark:text-white">{message.content}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeClass(message.type)}`}>
                                                        {getTypeName(message.type)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(message.status)}`}>
                                                        {getStatusName(message.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(message.sent_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {messages.links && messages.links.length > 3 && (
                            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {t('pagination.showing')} <span className="font-medium">{messages.data.length}</span> {t('pagination.of')} <span className="font-medium">{messages.total}</span> {t('pagination.results')}
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            {messages.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                        ? 'z-10 bg-indigo-600 text-white dark:bg-indigo-800'
                                                        : 'text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                                        } ${index === 0
                                                            ? 'rounded-l-md'
                                                            : index === messages.links.length - 1
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