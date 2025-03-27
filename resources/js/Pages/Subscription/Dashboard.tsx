import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
    type: 'subscription' | 'addon' | 'refund';
    status: 'completed' | 'pending' | 'failed';
}

interface Subscription {
    id: number;
    plan: 'starter' | 'business' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    duration?: 'monthly' | 'annual';
    is_auto_renew?: boolean;
    next_renewal_date?: string;
    sms_usage?: {
        used: number;
        total: number;
    };
    limits?: {
        clients: number;
        campaigns: number;
    };
    campaigns_used?: number;
}

interface DashboardProps {
    subscription?: Subscription;
    transactions?: Transaction[];
    clients_count: number;
    [key: string]: unknown;
}

export default function SubscriptionDashboard({
    auth,
    subscription,
    transactions = [],
    clients_count = 0,
}: PageProps<DashboardProps>) {
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

    const getTransactionStatusBadgeClass = (status: Transaction['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        }
    };

    const getTransactionTypeIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'subscription':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'addon':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                );
            case 'refund':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm11 1H4a1 1 0 00-1 1v10.586l2.293-2.293a1 1 0 011.414 0l3 3a1 1 0 001.414-1.414L9.414 12H10a5 5 0 100-10H7a1 1 0 000 2h3a3 3 0 010 6H5a1 1 0 000 2h5a5.006 5.006 0 005-5V3z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const smsUsagePercentage = subscription?.sms_usage?.used != null && subscription?.sms_usage?.total != null && subscription.sms_usage.total > 0
        ? Math.round((subscription.sms_usage.used / subscription.sms_usage.total) * 100)
        : 0;

    const campaignsUsagePercentage = subscription?.campaigns_used != null && subscription?.limits?.campaigns != null && subscription.limits.campaigns > 0
        ? Math.round((subscription.campaigns_used / subscription.limits.campaigns) * 100)
        : 0;

    const clientsPercentage = subscription?.limits?.clients != null && subscription.limits.clients > 0
        ? Math.round((clients_count / subscription.limits.clients) * 100)
        : 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('subscription.dashboardTitle')}</h2>}
        >
            <Head title={t('subscription.dashboardTitle')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {!subscription ? (
                        <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <div className="p-6 text-center">
                                <p className="text-gray-500 dark:text-gray-400">{t('subscription.noSubscription')}</p>
                                <div className="mt-4">
                                    <Link
                                        href={route('subscription.plans')}
                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('subscription.browsePlans')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Plan Summary Cards */}
                            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* Current Plan Card */}
                                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 rounded-md bg-indigo-100 p-3 dark:bg-indigo-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{t('subscription.currentPlan')}</dt>
                                                    <dd>
                                                        <div className="text-lg font-medium text-gray-900 dark:text-white">{getPlanName(subscription.plan)}</div>
                                                    </dd>
                                                </dl>
                                            </div>
                                            <div>
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(subscription.status)}`}>
                                                    {t(`subscription.status.${subscription.status}`)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Duration Card */}
                                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 rounded-md bg-indigo-100 p-3 dark:bg-indigo-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{t('subscription.period')}</dt>
                                                    <dd>
                                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                                            {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                                                        </div>
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Renewal Card */}
                                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 rounded-md bg-indigo-100 p-3 dark:bg-indigo-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{t('subscription.renewalStatus')}</dt>
                                                    <dd>
                                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                                            {subscription.is_auto_renew
                                                                ? t('subscription.autoRenewOn')
                                                                : t('subscription.autoRenewOff')}
                                                        </div>
                                                        {subscription.next_renewal_date && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {t('subscription.nextRenewal')}: {formatDate(subscription.next_renewal_date)}
                                                            </div>
                                                        )}
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Usage Statistics */}
                            <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                                <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('subscription.usageStatistics')}</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                        {/* SMS Usage */}
                                        {subscription?.sms_usage?.used != null && subscription?.sms_usage?.total != null ? (
                                            <div className="flex flex-col">
                                                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.smsUsage')}</h4>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {subscription.sms_usage.used} / {subscription.sms_usage.total}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {smsUsagePercentage}%
                                                    </div>
                                                </div>
                                                <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                                                        style={{ width: `${smsUsagePercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Campaigns Usage */}
                                        {subscription?.campaigns_used != null && subscription?.limits?.campaigns != null ? (
                                            <div className="flex flex-col">
                                                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.campaignsUsage')}</h4>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {subscription.campaigns_used} / {subscription.limits.campaigns}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {campaignsUsagePercentage}%
                                                    </div>
                                                </div>
                                                <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                                                        style={{ width: `${campaignsUsagePercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Clients Limit */}
                                        {subscription?.limits?.clients != null ? (
                                            <div className="flex flex-col">
                                                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.clientLimit')}</h4>
                                                <div className="flex items-center">
                                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                        {subscription.limits.clients.toLocaleString()}
                                                    </p>
                                                    <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {t('subscription.maxClients')}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <Link
                                            href={route('subscription.top-up')}
                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            {t('subscription.buyMoreSMS')}
                                        </Link>
                                        <Link
                                            href={route('subscription.increase-limit')}
                                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        >
                                            {t('subscription.increaseClientLimit')}
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="mb-8 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                                <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('subscription.recentTransactions')}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('subscription.type')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('subscription.description')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('subscription.date')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('subscription.amount')}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    {t('subscription.status')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        {t('subscription.noTransactions')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map((transaction) => (
                                                    <tr key={transaction.id}>
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <div className="flex items-center">
                                                                {getTransactionTypeIcon(transaction.type)}
                                                                <span className="ml-2 text-sm text-gray-900 dark:text-gray-200">
                                                                    {t(`subscription.transactionType.${transaction.type}`)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {transaction.description}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDate(transaction.date)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                                            ${typeof transaction.amount === 'number'
                                                                ? transaction.amount.toFixed(2)
                                                                : parseFloat(String(transaction.amount)).toFixed(2)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTransactionStatusBadgeClass(transaction.status)}`}>
                                                                {t(`subscription.transactionStatus.${transaction.status}`)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {transactions.length > 0 && (
                                    <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                        <div className="flex justify-end">
                                            <Link
                                                href={route('subscription.transactions')}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                {t('subscription.viewAllTransactions')}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Manage Subscription */}
                            <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                                <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('subscription.manageSubscription')}</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.autoRenew')}</h4>
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    className={`inline-flex items-center rounded-md border ${subscription.is_auto_renew
                                                        ? 'border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600'
                                                        : 'border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-600'
                                                        } px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                                >
                                                    {subscription.is_auto_renew
                                                        ? t('subscription.turnOffAutoRenew')
                                                        : t('subscription.turnOnAutoRenew')
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.upgradePlan')}</h4>
                                            <div className="flex items-center">
                                                <Link
                                                    href={route('subscription.plans')}
                                                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                                >
                                                    {t('subscription.changePlan')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                                        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                                            <div>
                                                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('subscription.cancelSubscription')}</h4>
                                                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {t('subscription.cancelNotice')}
                                                </p>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
                                                >
                                                    {t('subscription.cancelAtPeriodEnd')}
                                                </button>
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