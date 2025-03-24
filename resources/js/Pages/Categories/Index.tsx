// resources/js/Pages/Categories/Index.tsx
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Category {
    id: number;
    name: string;
    description: string | null;
    clients_count: number;
}

interface CategoriesIndexProps {
    categories: Category[];
}

export default function CategoriesIndex({
    auth,
    categories,
}: PageProps<CategoriesIndexProps>) {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form pour créer une nouvelle catégorie
    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        name: '',
        description: '',
    });

    // Form pour éditer une catégorie existante
    const { data: editData, setData: setEditData, patch, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        description: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('categories.store'), {
            onSuccess: () => resetCreate(),
        });
    };

    const handleEditSubmit = (e: React.FormEvent, id: number) => {
        e.preventDefault();
        patch(route('categories.update', id), {
            onSuccess: () => {
                setEditingId(null);
                resetEdit();
            },
        });
    };

    const startEditing = (category: Category) => {
        setEditData({
            name: category.name,
            description: category.description || '',
        });
        setEditingId(category.id);
    };

    const cancelEditing = () => {
        setEditingId(null);
        resetEdit();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.categories')}</h2>}
        >
            <Head title={t('common.categories')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Formulaire de création de catégorie */}
                    <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('categories.create')}</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <form onSubmit={handleCreateSubmit}>
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-3">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.name')} *
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={createData.name}
                                                onChange={(e) => setCreateData('name', e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                required// Suite de Categories/Index.tsx
                                            />
                                        </div>
                                        {createErrors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createErrors.name}</p>}
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.description')}
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="description"
                                                id="description"
                                                value={createData.description}
                                                onChange={(e) => setCreateData('description', e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            />
                                        </div>
                                        {createErrors.description && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createErrors.description}</p>}
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6">
                                    <button
                                        type="submit"
                                        disabled={createProcessing}
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 sm:text-sm"
                                    >
                                        {t('common.create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Liste des catégories */}
                    <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.length === 0 ? (
                                <li className="px-4 py-5 sm:px-6">
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        {t('categories.noCategories')}
                                    </div>
                                </li>
                            ) : (
                                categories.map((category) => (
                                    <li key={category.id}>
                                        {editingId === category.id ? (
                                            <div className="px-4 py-5 sm:px-6">
                                                <form onSubmit={(e) => handleEditSubmit(e, category.id)}>
                                                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                                        <div className="sm:col-span-3">
                                                            <label htmlFor={`edit-name-${category.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {t('common.name')} *
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    name="name"
                                                                    id={`edit-name-${category.id}`}
                                                                    value={editData.name}
                                                                    onChange={(e) => setEditData('name', e.target.value)}
                                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                                    required
                                                                />
                                                            </div>
                                                            {editErrors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{editErrors.name}</p>}
                                                        </div>

                                                        <div className="sm:col-span-3">
                                                            <label htmlFor={`edit-description-${category.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {t('common.description')}
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    name="description"
                                                                    id={`edit-description-${category.id}`}
                                                                    value={editData.description}
                                                                    onChange={(e) => setEditData('description', e.target.value)}
                                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                                />
                                                            </div>
                                                            {editErrors.description && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{editErrors.description}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 flex justify-end space-x-3">
                                                        <button
                                                            type="button"
                                                            onClick={cancelEditing}
                                                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            {t('common.cancel')}
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={editProcessing}
                                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                                        >
                                                            {t('common.save')}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-5 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{category.name}</h3>
                                                        {category.description && (
                                                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                                                        )}
                                                        <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                                                            {t('categories.clientsCount', { count: category.clients_count })}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditing(category)}
                                                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            {t('common.edit')}
                                                        </button>

                                                        <a
                                                            href={route('categories.destroy', category.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
                                                            onClick={(e: React.MouseEvent) => {
                                                                if (!confirm(t('categories.confirmDelete'))) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            {t('common.delete')}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}