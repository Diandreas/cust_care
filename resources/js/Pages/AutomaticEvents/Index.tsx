import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface AutomaticEvent {
    id: number;
    name: string;
    type: 'birthday' | 'holiday' | 'custom';
    is_active: boolean;
    message_template: string;
    days_before?: number;
    days_after?: number;
    date?: string;
    created_at: string;
}

interface AutomaticEventsIndexProps {
    events: AutomaticEvent[];
}

export default function AutomaticEventsIndex({
    auth,
    events,
}: PageProps<AutomaticEventsIndexProps>) {
    const { t } = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        name: '',
        type: 'birthday',
        is_active: true,
        message_template: '',
        days_before: 1,
        days_after: 0,
        date: '',
    });

    const { data: editData, setData: setEditData, patch, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        type: 'birthday',
        is_active: true,
        message_template: '',
        days_before: 1,
        days_after: 0,
        date: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('automatic-events.store'), {
            onSuccess: () => {
                resetCreate();
                setIsCreating(false);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent, id: number) => {
        e.preventDefault();
        patch(route('automatic-events.update', id), {
            onSuccess: () => {
                setEditingId(null);
                resetEdit();
            },
        });
    };

    const startEditing = (event: AutomaticEvent) => {
        setEditData({
            name: event.name,
            type: event.type,
            is_active: event.is_active,
            message_template: event.message_template,
            days_before: event.days_before,
            days_after: event.days_after,
            date: event.date,
        });
        setEditingId(event.id);
    };

    const cancelEditing = () => {
        setEditingId(null);
        resetEdit();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('automatic-events.title')}</h2>}
        >
            <Head title={t('automatic-events.title')} />

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
                            {isCreating ? t('common.cancel') : t('automatic-events.create')}
                        </button>
                    </div>

                    {/* Formulaire de création */}
                    {isCreating && (
                        <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('automatic-events.create')}</h3>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleCreateSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('automatic-events.name')} *
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
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('automatic-events.type')} *
                                        </label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={createData.type}
                                            onChange={(e) => setCreateData('type', e.target.value as AutomaticEvent['type'])}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            required
                                        >
                                            <option value="birthday">{t('automatic-events.types.birthday')}</option>
                                            <option value="holiday">{t('automatic-events.types.holiday')}</option>
                                            <option value="custom">{t('automatic-events.types.custom')}</option>
                                        </select>
                                        {createErrors.type && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createErrors.type}</p>}
                                    </div>

                                    {createData.type === 'birthday' && (
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="days_before" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('automatic-events.daysBefore')}
                                                </label>
                                                <input
                                                    type="number"
                                                    id="days_before"
                                                    name="days_before"
                                                    min="0"
                                                    value={createData.days_before}
                                                    onChange={(e) => setCreateData('days_before', parseInt(e.target.value))}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="days_after" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('automatic-events.daysAfter')}
                                                </label>
                                                <input
                                                    type="number"
                                                    id="days_after"
                                                    name="days_after"
                                                    min="0"
                                                    value={createData.days_after}
                                                    onChange={(e) => setCreateData('days_after', parseInt(e.target.value))}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(createData.type === 'holiday' || createData.type === 'custom') && (
                                        <div className="mb-4">
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('automatic-events.date')} *
                                            </label>
                                            <input
                                                type="date"
                                                id="date"
                                                name="date"
                                                value={createData.date}
                                                onChange={(e) => setCreateData('date', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                required
                                            />
                                            {createErrors.date && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createErrors.date}</p>}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label htmlFor="message_template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('automatic-events.messageTemplate')} *
                                        </label>
                                        <textarea
                                            id="message_template"
                                            name="message_template"
                                            rows={5}
                                            value={createData.message_template}
                                            onChange={(e) => setCreateData('message_template', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            required
                                        ></textarea>
                                        {createErrors.message_template && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createErrors.message_template}</p>}
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center">
                                            <input
                                                id="is_active"
                                                name="is_active"
                                                type="checkbox"
                                                checked={createData.is_active}
                                                onChange={(e) => setCreateData('is_active', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                {t('automatic-events.isActive')}
                                            </label>
                                        </div>
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

                    {/* Liste des événements */}
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('automatic-events.yourEvents')}</h3>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {events.length === 0 ? (
                                <li className="px-4 py-5 sm:px-6">
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        {t('automatic-events.noEvents')}
                                    </div>
                                </li>
                            ) : (
                                events.map((event) => (
                                    <li key={event.id} className="px-4 py-5 sm:px-6">
                                        {editingId === event.id ? (
                                            <form onSubmit={(e) => handleEditSubmit(e, event.id)}>
                                                {/* Formulaire d'édition - même structure que le formulaire de création */}
                                                {/* ... */}
                                            </form>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                                            {event.name}
                                                            <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${event.is_active
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                                }`}>
                                                                {event.is_active ? t('common.active') : t('common.inactive')}
                                                            </span>
                                                        </h4>
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            {t(`automatic-events.types.${event.type}`)}
                                                            {event.type === 'birthday' && (
                                                                <span className="ml-2">
                                                                    {event.days_before} {t('automatic-events.daysBefore')} / {event.days_after} {t('automatic-events.daysAfter')}
                                                                </span>
                                                            )}
                                                            {(event.type === 'holiday' || event.type === 'custom') && event.date && (
                                                                <span className="ml-2">
                                                                    {new Date(event.date).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditing(event)}
                                                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            {t('common.edit')}
                                                        </button>
                                                        <Link
                                                            href={route('automatic-events.destroy', event.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
                                                            onClick={(e: React.MouseEvent) => {
                                                                if (!confirm(t('automatic-events.confirmDelete'))) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            {t('common.delete')}
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="mt-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                                                    <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{event.message_template}</p>
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