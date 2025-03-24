// resources/js/Pages/Dashboard.tsx
import React from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

// Types pour les statistiques
interface DashboardStats {
    total_clients: number;
    total_messages: number;
    total_campaigns: number;
    recent_messages: {
        id: number;
        content: string;
        created_at: string;
        client: {
            id: number;
            name: string;
        };
    }[];
    upcoming_campaigns: {
        id: number;
        name: string;
        scheduled_at: string;
        recipients_count: number;
    }[];
    subscription: {
        plan: string;
        sms_allowed: number;
        sms_used: number;
        expires_at: string;
    } | null;
}

export default function Dashboard({ auth, stats }: PageProps<{ stats: DashboardStats }>) {
    const { t } = useTranslation();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('dashboard.title')}</h2>}
        >
            <Head title={t('dashboard.title')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Cartes de statistiques */}
                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Nombre total de clients */}
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                                        <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.clients')}</dt>
                                            <dd>
                                                <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.total_clients}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nombre total de messages */}
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                        <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.messages')}</dt>
                                            <dd>
                                                <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.total_messages}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nombre total de campagnes */}
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                        <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.stats.campaigns')}</dt>
                                            <dd>
                                                <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.total_campaigns}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informations d'abonnement */}
                    {stats.subscription && (
                        <div className="mb-6 overflow-hidden rounded-lg bg-gradient-to-r from-purple-700 to-indigo-800 shadow-lg dark:from-purple-900 dark:to-indigo-950">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="mb-3 text-xl font-semibold text-white">{t('dashboard.subscription.yourSubscription')}</h3>
                                <div className="flex flex-col md:flex-row md:justify-between">
                                    <div className="mb-4 md:mb-0">
                                        <p className="text-sm text-white/80">{t('dashboard.subscription.plan')}</p>
                                        <p className="text-lg font-bold text-white capitalize">
                                            {stats.subscription.plan === 'starter' && 'Pack Starter'}
                                            {stats.subscription.plan === 'business' && 'Pack Business'}
                                            {stats.subscription.plan === 'enterprise' && 'Pack Enterprise'}
                                        </p>
                                    </div>
                                    <div className="mb-4 md:mb-0">
                                        <p className="text-sm text-white/80">{t('dashboard.subscription.smsUsage')}</p>
                                        <p className="text-lg font-bold text-white">{stats.subscription.sms_used} / {stats.subscription.sms_allowed}</p>
                                    </div>
                                    <div className="mb-4 md:mb-0">
                                        <p className="text-sm text-white/80">{t('dashboard.subscription.expiration')}</p>
                                        <p className="text-lg font-bold text-white">{formatDate(stats.subscription.expires_at)}</p>
                                    </div>
                                    <div>
                                        <a href={route('subscription.index')} className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-white/90">
                                            {t('dashboard.subscription.manage')}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Messages récents */}
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('dashboard.recentMessages.title')}</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.recentMessages.description')}</p>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                {stats.recent_messages.length > 0 ? (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {stats.recent_messages.map((message) => (
                                            <li key={message.id} className="py-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                                                            {message.client.name.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                            {message.client.name}
                                                        </p>
                                                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                                            {message.content}
                                                        </p>
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDate(message.created_at)}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                                        {t('dashboard.recentMessages.noMessages')}
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                                <a href={route('messages.index')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                                    {t('dashboard.recentMessages.viewAll')}
                                </a>
                            </div>
                        </div>

                        {/* Campagnes à venir */}
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('dashboard.upcomingCampaigns.title')}</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.upcomingCampaigns.description')}</p>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                {stats.upcoming_campaigns.length > 0 ? (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {stats.upcoming_campaigns.map((campaign) => (
                                            <li key={campaign.id} className="py-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="mb-2 sm:mb-0">
                                                        <a href={route('campaigns.show', campaign.id)} className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            {campaign.name}
                                                        </a>
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            {campaign.recipients_count} {t('dashboard.upcomingCampaigns.recipients')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                        <svg className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {formatDate(campaign.scheduled_at)}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                                        {t('dashboard.upcomingCampaigns.noCampaigns')}
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                                <a href={route('campaigns.index')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                                    {t('dashboard.upcomingCampaigns.viewAll')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}