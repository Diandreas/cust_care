// resources/js/Pages/Clients/Edit.tsx
import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/utils/toast';

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    category_id: number | null;
    birthday: string | null;
    address: string | null;
    notes: string | null;
    tags: Tag[];
}

interface Category {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    name: string;
}

interface EditClientProps {
    client: Client;
    categories: Category[];
    tags: Tag[];
    selectedTags: number[];
}

export default function EditClient({
    auth,
    client,
    categories,
    tags,
    selectedTags,
}: PageProps<EditClientProps>) {
    const { t } = useTranslation();
    const { success, error } = useToast();

    const { data, setData, patch, processing, errors } = useForm({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        category_id: client.category_id || '',
        birthday: client.birthday || '',
        address: client.address || '',
        notes: client.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        patch(route('clients.update', client.id), {
            onSuccess: () => {
                success('clients.updateSuccess');
            },
            onError: () => {
                error('common.error');
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('clients.edit')}</h2>}
        >
            <Head title={t('clients.edit')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6 grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.name')} *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.phone')} *
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.phone && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.email')}
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.category')}
                                        </label>
                                        <select
                                            id="category_id"
                                            name="category_id"
                                            value={data.category_id}
                                            onChange={(e) => setData('category_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">{t('clients.selectCategory')}</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category_id && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.category_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.birthday')}
                                        </label>
                                        <input
                                            type="date"
                                            id="birthday"
                                            name="birthday"
                                            value={data.birthday}
                                            onChange={(e) => setData('birthday', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.birthday && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.birthday}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.address')}
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.address && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('common.notes')}
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={4}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    ></textarea>
                                    {errors.notes && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.notes}</p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <a
                                        href={route('clients.index')}
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {t('common.cancel')}
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}