import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    notification_preferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
}

interface Payment {
    id: number;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'failed';
    method: string;
}

interface ApiKey {
    id: number;
    name: string;
    key: string;
    last_used: string;
}

interface ProfileEditProps {
    user: User;
    payments: Payment[];
    apiKeys: ApiKey[];
}

export default function ProfileEdit({
    auth,
    user,
    payments,
    apiKeys,
}: PageProps<ProfileEditProps>) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'payments' | 'api'>('profile');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        company: user.company || '',
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
        notification_preferences: user.notification_preferences,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('profile.update'), {
            onSuccess: () => {
                reset();
            },
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('profile.title')}</h2>}
        >
            <Head title={t('profile.title')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {!auth.user ? (
                        <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <div className="p-6 text-center">
                                <p className="text-gray-500 dark:text-gray-400">{t('profile.loading')}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Navigation des onglets */}
                            <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
                                <nav className="-mb-px flex space-x-8">
                                    {[
                                        { id: 'profile', label: t('profile.tabs.profile') },
                                        { id: 'security', label: t('profile.tabs.security') },
                                        { id: 'notifications', label: t('profile.tabs.notifications') },
                                        { id: 'payments', label: t('profile.tabs.payments') },
                                        { id: 'api', label: t('profile.tabs.api') },
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
                                    {activeTab === 'profile' && (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.name')}
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                                {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.email')}
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                                {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.phone')}
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                                {errors.phone && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.company')}
                                                </label>
                                                <input
                                                    type="text"
                                                    id="company"
                                                    value={data.company}
                                                    onChange={(e) => setData('company', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                                {errors.company && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.company}</p>}
                                            </div>

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
                                    )}

                                    {activeTab === 'security' && (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.currentPassword')}
                                                </label>
                                                <input
                                                    type="password"
                                                    id="current_password"
                                                    value={data.current_password}
                                                    onChange={(e) => setData('current_password', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                                {errors.current_password && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.current_password}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.newPassword')}
                                                </label>
                                                <input
                                                    type="password"
                                                    id="new_password"
                                                    value={data.new_password}
                                                    onChange={(e) => setData('new_password', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                                {errors.new_password && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.new_password}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.confirmPassword')}
                                                </label>
                                                <input
                                                    type="password"
                                                    id="new_password_confirmation"
                                                    value={data.new_password_confirmation}
                                                    onChange={(e) => setData('new_password_confirmation', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                />
                                                {errors.new_password_confirmation && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.new_password_confirmation}</p>}
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                                >
                                                    {t('profile.updatePassword')}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {activeTab === 'notifications' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.notifications.email')}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.notifications.emailDescription')}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('notification_preferences', { ...data.notification_preferences, email: !data.notification_preferences.email })}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.notification_preferences.email ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.notification_preferences.email ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.notifications.sms')}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.notifications.smsDescription')}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('notification_preferences', { ...data.notification_preferences, sms: !data.notification_preferences.sms })}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.notification_preferences.sms ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.notification_preferences.sms ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.notifications.push')}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.notifications.pushDescription')}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('notification_preferences', { ...data.notification_preferences, push: !data.notification_preferences.push })}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.notification_preferences.push ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.notification_preferences.push ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleSubmit}
                                                    disabled={processing}
                                                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                                >
                                                    {t('common.save')}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'payments' && (
                                        <div className="space-y-6">
                                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                                                                {t('profile.payments.date')}
                                                            </th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                                {t('profile.payments.amount')}
                                                            </th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                                {t('profile.payments.method')}
                                                            </th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                                {t('profile.payments.status')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                        {payments.map((payment) => (
                                                            <tr key={payment.id}>
                                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                                                    {formatDate(payment.date)}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    {formatAmount(payment.amount)}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    {payment.method}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                                    <span
                                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${payment.status === 'completed'
                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                            : payment.status === 'pending'
                                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                                            }`}
                                                                    >
                                                                        {t(`profile.payments.statuses.${payment.status}`)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'api' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-between">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.api.title')}</h3>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                                >
                                                    {t('profile.api.generateKey')}
                                                </button>
                                            </div>

                                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                                                                {t('profile.api.name')}
                                                            </th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                                {t('profile.api.key')}
                                                            </th>
                                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                                {t('profile.api.lastUsed')}
                                                            </th>
                                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                                <span className="sr-only">{t('common.actions')}</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                        {apiKeys.map((apiKey) => (
                                                            <tr key={apiKey.id}>
                                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                                                    {apiKey.name}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    {apiKey.key}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    {formatDate(apiKey.last_used)}
                                                                </td>
                                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                                    <button
                                                                        type="button"
                                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                    >
                                                                        {t('common.delete')}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
