import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Subscription {
    id: number;
    plan: 'starter' | 'business' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    sms_usage: {
        used: number;
        total: number;
    };
    limits: {
        clients: number;
        campaigns: number;
    };
}

interface SubscriptionIndexProps {
    subscription: Subscription;
}

export default function SubscriptionIndex({
    auth,
    subscription,
}: PageProps<SubscriptionIndexProps>) {
    const { t } = useTranslation();

    const getPlanName = (plan: Subscription['plan']) => {
        switch (plan) {
            case 'starter':
                return t('subscription.plans.starter.name');
            case 'business':
                return t('subscription.plans.business.name');
            case 'enterprise':
                return t('subscription.plans.enterprise.name');
        }
    };

    const getStatusBadgeClass = (status: Subscription['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'cancelled':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'expired':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const smsUsagePercentage = subscription?.sms_usage
        ? Math.round((subscription.sms_usage.used / subscription.sms_usage.total) * 100)
        : 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('subscription.title')}</h2>}
        >
            <Head title={t('subscription.title')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {!subscription ? (
                        <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <div className="p-6 text-center">
                                <p className="text-gray-500 dark:text-gray-400">{t('subscription.noSubscription')}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Plan actuel */}
                            <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                                <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('subscription.currentPlan')}</h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {getPlanName(subscription.plan)}
                                            </h4>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {t('subscription.period')}: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(subscription.status)}`}>
                                            {t(`subscription.status.${subscription.status}`)}
                                        </span>
                                    </div>

                                    {subscription.cancel_at_period_end && (
                                        <div className="mt-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/50">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                                        {t('subscription.cancellationNotice')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Utilisation des SMS */}
                            <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                                <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('subscription.smsUsage')}</h3>
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('subscription.smsUsed')}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {subscription.sms_usage.used} / {subscription.sms_usage.total}
                                            </div>
                                        </div>
                                        <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                                                style={{ width: `${smsUsagePercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Link
                                            href={route('subscription.top-up')}
                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            {t('subscription.topUp')}
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Limites */}
                            <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                                <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('subscription.limits')}</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.clientLimit')}</h4>
                                            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                                                {subscription.limits.clients.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.campaignLimit')}</h4>
                                            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                                                {subscription.limits.campaigns.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end">
                                <Link
                                    href={route('subscription.plans')}
                                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                >
                                    {t('subscription.changePlan')}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 