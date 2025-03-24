import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Settings {
    date_format: string;
    time_format: string;
    language: string;
    theme: 'light' | 'dark' | 'system';
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    data_export: {
        format: 'csv' | 'excel';
        include_archived: boolean;
    };
}

interface SettingsIndexProps {
    settings: Settings;
    available_languages: { code: string; name: string }[];
    available_date_formats: { value: string; label: string }[];
    available_time_formats: { value: string; label: string }[];
}

export default function SettingsIndex({
    auth,
    settings,
    available_languages,
    available_date_formats,
    available_time_formats,
}: PageProps<SettingsIndexProps>) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data'>('general');

    const { data, setData, post, processing, errors, reset } = useForm({
        date_format: settings.date_format,
        time_format: settings.time_format,
        language: settings.language,
        theme: settings.theme,
        notifications: settings.notifications,
        data_export: settings.data_export,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.update'), {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('settings.title')}</h2>}
        >
            <Head title={t('settings.title')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Navigation des onglets */}
                    <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'general', label: t('settings.tabs.general') },
                                { id: 'notifications', label: t('settings.tabs.notifications') },
                                { id: 'data', label: t('settings.tabs.data') },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Contenu des onglets */}
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {activeTab === 'general' && (
                                    <>
                                        <div>
                                            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.language')}
                                            </label>
                                            <select
                                                id="language"
                                                value={data.language}
                                                onChange={(e) => setData('language', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            >
                                                {available_languages.map((lang) => (
                                                    <option key={lang.code} value={lang.code}>
                                                        {lang.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.language && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.language}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.theme')}
                                            </label>
                                            <select
                                                id="theme"
                                                value={data.theme}
                                                onChange={(e) => setData('theme', e.target.value as Settings['theme'])}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            >
                                                <option value="light">{t('settings.themes.light')}</option>
                                                <option value="dark">{t('settings.themes.dark')}</option>
                                                <option value="system">{t('settings.themes.system')}</option>
                                            </select>
                                            {errors.theme && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.theme}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.dateFormat')}
                                            </label>
                                            <select
                                                id="date_format"
                                                value={data.date_format}
                                                onChange={(e) => setData('date_format', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            >
                                                {available_date_formats.map((format) => (
                                                    <option key={format.value} value={format.value}>
                                                        {format.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.date_format && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.date_format}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="time_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.timeFormat')}
                                            </label>
                                            <select
                                                id="time_format"
                                                value={data.time_format}
                                                onChange={(e) => setData('time_format', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            >
                                                {available_time_formats.map((format) => (
                                                    <option key={format.value} value={format.value}>
                                                        {format.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.time_format && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.time_format}</p>}
                                        </div>
                                    </>
                                )}

                                {activeTab === 'notifications' && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.notifications.email')}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notifications.emailDescription')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setData('notifications', { ...data.notifications, email: !data.notifications.email })}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.notifications.email ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.notifications.email ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.notifications.sms')}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notifications.smsDescription')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setData('notifications', { ...data.notifications, sms: !data.notifications.sms })}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.notifications.sms ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.notifications.sms ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.notifications.push')}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notifications.pushDescription')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setData('notifications', { ...data.notifications, push: !data.notifications.push })}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.notifications.push ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.notifications.push ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'data' && (
                                    <>
                                        <div>
                                            <label htmlFor="export_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.exportFormat')}
                                            </label>
                                            <select
                                                id="export_format"
                                                value={data.data_export.format}
                                                onChange={(e) => setData('data_export', { ...data.data_export, format: e.target.value as Settings['data_export']['format'] })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            >
                                                <option value="csv">CSV</option>
                                                <option value="excel">Excel</option>
                                            </select>
                                            {errors['data_export.format'] && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors['data_export.format']}</p>}
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                id="include_archived"
                                                type="checkbox"
                                                checked={data.data_export.include_archived}
                                                onChange={(e) => setData('data_export', { ...data.data_export, include_archived: e.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                            <label htmlFor="include_archived" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                {t('settings.includeArchived')}
                                            </label>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                            >
                                                {t('settings.exportData')}
                                            </button>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
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