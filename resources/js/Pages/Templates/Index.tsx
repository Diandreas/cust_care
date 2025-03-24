import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Template {
    id: number;
    name: string;
    content: string;
    is_global: boolean;
}

interface TemplatesIndexProps {
    templates: Template[];
}

export default function TemplatesIndex({
    auth,
    templates,
}: PageProps<TemplatesIndexProps>) {
    const { t } = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form pour créer un nouveau modèle
    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        name: '',
        content: '',
        is_global: false,
    });

    // Form pour éditer un modèle existant
    const { data: editData, setData: setEditData, patch, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        content: '',
        is_global: false,
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('templates.store'), {
            onSuccess: () => {
                resetCreate();
                setIsCreating(false);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent, id: number) => {
        e.preventDefault();
        patch(route('templates.update', id), {
            onSuccess: () => {
                setEditingId(null);
                resetEdit();
            },
        });
    };

    const startEditing = (template: Template) => {
        setEditData({
            name: template.name,
            content: template.content,
            is_global: template.is_global,
        });
        setEditingId(template.id);
    };

    const cancelEditing = () => {
        setEditingId(null);
        resetEdit();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.templates')}</h2>}
        >
            <Head title={t('common.templates')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsCreating(!isCreating)}
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
                            {isCreating ? t('templates.cancel') : t('templates.create')}
                        </button>
                    </div>

                    {/* Formulaire de création de modèle */}
                    {isCreating && (
                        <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('templates.create')}</h3>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleCreateSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('templates.name')} *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={createData.name}
                                            onChange={(e) => setCreateData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            required
                                        />
                                        {createErrors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createErrors.name}</p>}
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('templates.content')} *
                                        </label>
                                        <textarea
                                            id="content"
                                            name="content"
                                            rows={5}
                                            value={createData.content}
                                            onChange={(e) => setCreateData('content', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            required
                                        ></textarea>
                                        {createErrors.content && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createErrors.content}</p>}
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center">
                                            <input
                                                id="is_global"
                                                name="is_global"
                                                type="checkbox"
                                                checked={createData.is_global}
                                                onChange={(e) => setCreateData('is_global', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                            <label htmlFor="is_global" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                {t('templates.isGlobal')}
                                            </label>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('templates.globalDescription')}</p>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={createProcessing}
                                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            {t('common.save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Liste des modèles */}
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('templates.yourTemplates')}</h3>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {templates.length === 0 ? (
                                <li className="px-4 py-5 sm:px-6">
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        {t('templates.noTemplates')}
                                    </div>
                                </li>
                            ) : (
                                templates.map((template) => (
                                    <li key={template.id} className="px-4 py-5 sm:px-6">
                                        {editingId === template.id ? (
                                            <form onSubmit={(e) => handleEditSubmit(e, template.id)}>
                                                <div className="mb-4">
                                                    <label htmlFor={`edit-name-${template.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {t('templates.name')} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`edit-name-${template.id}`}
                                                        name="name"
                                                        value={editData.name}
                                                        onChange={(e) => setEditData('name', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                        required
                                                    />
                                                    {editErrors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{editErrors.name}</p>}
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor={`edit-content-${template.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {t('templates.content')} *
                                                    </label>
                                                    <textarea
                                                        id={`edit-content-${template.id}`}
                                                        name="content"
                                                        rows={5}
                                                        value={editData.content}
                                                        onChange={(e) => setEditData('content', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                        required
                                                    ></textarea>
                                                    {editErrors.content && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{editErrors.content}</p>}
                                                </div>

                                                <div className="mb-6">
                                                    <div className="flex items-center">
                                                        <input
                                                            id={`edit-is_global-${template.id}`}
                                                            name="is_global"
                                                            type="checkbox"
                                                            checked={editData.is_global}
                                                            onChange={(e) => setEditData('is_global', e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                        />
                                                        <label htmlFor={`edit-is_global-${template.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                            {t('templates.isGlobal')}
                                                        </label>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('templates.globalDescription')}</p>
                                                </div>

                                                <div className="flex justify-end space-x-3">
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
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                                            {template.name}
                                                            {template.is_global && (
                                                                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                                    {t('templates.global')}
                                                                </span>
                                                            )}
                                                        </h4>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditing(template)}
                                                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            {t('common.edit')}
                                                        </button>
                                                        <Link
                                                            href={route('templates.destroy', template.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
                                                            onClick={(e: React.MouseEvent) => {
                                                                if (!confirm(t('templates.confirmDelete'))) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            {t('common.delete')}
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="mt-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                                                    <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{template.content}</p>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}