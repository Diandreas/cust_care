// resources/js/Pages/Clients/Index.tsx
import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    birthday: string | null;
    category: Category | null;
}

interface Category {
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
    filters: {
        search: string;
        category_id: number | null;
    };
}

export default function ClientsIndex({
    auth,
    clients,
    categories,
    filters,
}: PageProps<ClientsIndexProps>) {
    const { t } = useTranslation();

    // État pour la recherche et le filtre de catégorie
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        category_id: filters.category_id || '',
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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.clients')}</h2>}
        >
            <Head title={t('common.clients')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
                        {/* Barre de recherche */}
                        <form onSubmit={handleSearch} className="flex w-full gap-2 md:w-1/2">
                            <input
                                type="text"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                placeholder={t('common.search')}
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
                        </form>
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
                            {t('common.add')} {t('common.clients')}
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
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
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.email')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.category')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {t('common.birthday')}
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
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {client.name}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {client.phone}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {client.email || '-'}
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
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <Link
                                                        href={route('clients.edit', client.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        {t('common.edit')}
                                                    </Link>
                                                    <Link
                                                        href={route('messages.create', { client_id: client.id })}
                                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                    >
                                                        {t('common.send')}
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
                                                        {t('common.delete')}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {clients.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}