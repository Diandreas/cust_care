import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/Components/ui/card';
import { Users2, Zap, MessageSquare, ShieldCheck } from 'lucide-react';

interface StatsCardsProps {
    stats: {
        totalClients: number;
        newClientsThisMonth: number;
        activeClientsLast30Days: number;
        totalSmsSent: number;
    };
    subscription: {
        plan: string;
        clientsLimit: number;
        clientsCount: number;
        smsBalance: number;
    };
}

export default function StatsCards({ stats, subscription }: StatsCardsProps) {
    const { t } = useTranslation();

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-pink-500/5 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                            <Users2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.totalClients')}</div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {stats.totalClients.toLocaleString()}
                                <span className="ml-2 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                    +{stats.newClientsThisMonth} {t('stats.thisMonth')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-pink-500/5 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.activeClients')}</div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {stats.activeClientsLast30Days.toLocaleString()}
                                <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {stats.totalClients > 0 ? Math.round((stats.activeClientsLast30Days / stats.totalClients) * 100) : 0}% {t('stats.ofTotal')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-pink-500/5 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.smsSent')}</div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {stats.totalSmsSent.toLocaleString()}
                                <span className="ml-2 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                    {subscription.smsBalance} {t('stats.smsRemaining')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-pink-500/5 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.subscription')}</div>
                            <div className="text-xl font-semibold text-gray-900 dark:text-white">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">{subscription.plan}</span>
                                <div className="mt-1 text-sm font-medium">
                                    <span className={`${subscription.clientsCount > subscription.clientsLimit * 0.9 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {subscription.clientsCount}/{subscription.clientsLimit} {t('stats.clientsUsed')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}