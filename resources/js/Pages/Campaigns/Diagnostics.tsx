import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps, Campaign } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { ScrollArea } from '@/Components/ui/scroll-area';
import {
    ArrowLeft,
    AlertTriangle,
    RefreshCw,
    RotateCcw,
    Info,
    TrendingDown,
    Users,
    MessageSquare,
    Phone,
    Calendar,
    Search,
    Filter,
    Download,
    Eye,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface Message {
    id: number;
    client_id: number;
    status: string;
    error_message: string | null;
    created_at: string;
    client: {
        id: number;
        name: string;
        phone: string;
    };
}

interface CommonError {
    error_message: string;
    count: number;
    percentage?: number;
}

interface DiagnosticsProps {
    campaign: Campaign;
    failedMessages: Message[];
    commonErrors: CommonError[];
    totalMessages?: number;
    deliveredCount?: number;
    [key: string]: unknown;
}

export default function CampaignDiagnostics({
                                                auth,
                                                campaign,
                                                failedMessages,
                                                commonErrors,
                                                totalMessages = 0,
                                                deliveredCount = 0
                                            }: PageProps<DiagnosticsProps>) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedError, setSelectedError] = useState<string | null>(null);
    const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

    // Filtrer les messages échoués selon le terme de recherche
    const filteredFailedMessages = searchTerm
        ? failedMessages.filter(message =>
            message.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.client.phone.includes(searchTerm.toLowerCase()) ||
            (message.error_message && message.error_message.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : failedMessages;

    // Calculer les statistiques
    const deliveryRate = totalMessages > 0 ? ((deliveredCount / totalMessages) * 100).toFixed(1) : '0';
    const failureRate = totalMessages > 0 ? ((failedMessages.length / totalMessages) * 100).toFixed(1) : '0';

    // Ajouter les pourcentages aux erreurs communes
    const enhancedCommonErrors = commonErrors.map(error => ({
        ...error,
        percentage: failedMessages.length > 0 ? ((error.count / failedMessages.length) * 100).toFixed(1) : '0'
    }));

    // Grouper les messages par type d'erreur
    const messagesByError = selectedError
        ? failedMessages.filter(message => message.error_message === selectedError)
        : filteredFailedMessages;

    const toggleErrorExpansion = (index: number) => {
        const newExpanded = new Set(expandedErrors);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedErrors(newExpanded);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getErrorSeverity = (count: number): 'low' | 'medium' | 'high' => {
        const percentage = (count / failedMessages.length) * 100;
        if (percentage >= 50) return 'high';
        if (percentage >= 20) return 'medium';
        return 'low';
    };

    const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
            case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <Link href={route('campaigns.show', campaign.id)}>
                            <Button variant="ghost" size="sm" className="hidden sm:flex">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('common.back')}
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                {t('campaigns.diagnostics')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.name}</p>
                        </div>
                    </div>
                    <Badge variant="destructive" className="w-fit">
                        {failedMessages.length} {t('campaigns.failedMessages')}
                    </Badge>
                </div>
            }
        >
            <Head title={t('campaigns.diagnostics')} />

            <div className="py-4 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Mobile back button */}
                    <div className="block sm:hidden mb-4">
                        <Link href={route('campaigns.show', campaign.id)}>
                            <Button variant="ghost" size="sm" className="w-full justify-start">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('common.back')}
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {/* Statistiques de livraison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {t('campaigns.totalMessages')}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {totalMessages}
                                            </p>
                                        </div>
                                        <MessageSquare className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {t('campaigns.delivered')}
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {deliveredCount}
                                            </p>
                                        </div>
                                        <Users className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {t('campaigns.failed')}
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {failedMessages.length}
                                            </p>
                                        </div>
                                        <AlertTriangle className="h-8 w-8 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {t('campaigns.deliveryRate')}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {deliveryRate}%
                                            </p>
                                        </div>
                                        <TrendingDown className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Progress de livraison */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{t('campaigns.deliveryProgress')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('campaigns.delivered')}: {deliveredCount}</span>
                                        <span>{t('campaigns.failed')}: {failedMessages.length}</span>
                                    </div>
                                    <Progress value={Number(deliveryRate)} className="h-3" />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>{deliveryRate}% {t('campaigns.delivered')}</span>
                                        <span>{failureRate}% {t('campaigns.failed')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions de correction */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <RefreshCw className="h-5 w-5" />
                                    <span>{t('campaigns.correctiveActions')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h5 className="font-medium text-gray-900 dark:text-white">
                                            {t('campaigns.retryFailedOnly')}
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('campaigns.retryFailedDescription')}
                                        </p>
                                        <Link
                                            href={route('campaigns.retry.failed', campaign.id)}
                                            method="post"
                                            as="button"
                                        >
                                            <Button className="w-full sm:w-auto">
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                {t('campaigns.retryFailedMessages')}
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="font-medium text-gray-900 dark:text-white">
                                            {t('campaigns.retryEntireCampaign')}
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('campaigns.retryEntireDescription')}
                                        </p>
                                        <Link
                                            href={route('campaigns.retry.all', campaign.id)}
                                            method="post"
                                            as="button"
                                        >
                                            <Button variant="secondary" className="w-full sm:w-auto">
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                {t('campaigns.retryEntireCampaign')}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Analyse des erreurs */}
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
                                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                                    {t('campaigns.overview')}
                                </TabsTrigger>
                                <TabsTrigger value="errors" className="text-xs sm:text-sm">
                                    {t('campaigns.commonErrors')}
                                </TabsTrigger>
                                <TabsTrigger value="messages" className="text-xs sm:text-sm">
                                    {t('campaigns.failedMessagesList')}
                                </TabsTrigger>
                            </TabsList>

                            {/* Vue d'ensemble */}
                            <TabsContent value="overview" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('campaigns.errorSummary')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {enhancedCommonErrors.length > 0 ? (
                                            <div className="space-y-3">
                                                {enhancedCommonErrors.slice(0, 3).map((error, index) => {
                                                    const severity = getErrorSeverity(error.count);
                                                    return (
                                                        <Alert key={index} className={getSeverityColor(severity)}>
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <AlertDescription>
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-medium truncate">
                                                                            {error.error_message || t('campaigns.unknownError')}
                                                                        </p>
                                                                        <p className="text-xs mt-1">
                                                                            {error.count} {t('common.occurrences')} ({error.percentage}%)
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant="outline" className="w-fit">
                                                                        {severity.toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                            </AlertDescription>
                                                        </Alert>
                                                    );
                                                })}
                                                {enhancedCommonErrors.length > 3 && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                        {t('common.andMoreResults', { count: enhancedCommonErrors.length - 3 })}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <Info className="h-4 w-4" />
                                                <AlertDescription>
                                                    {t('campaigns.noCommonErrorsFound')}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Erreurs communes détaillées */}
                            <TabsContent value="errors" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('campaigns.commonErrors')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {enhancedCommonErrors.length > 0 ? (
                                            <div className="space-y-3">
                                                {enhancedCommonErrors.map((error, index) => {
                                                    const isExpanded = expandedErrors.has(index);
                                                    const severity = getErrorSeverity(error.count);

                                                    return (
                                                        <Card key={index} className={`border ${getSeverityColor(severity)}`}>
                                                            <CardContent className="p-4">
                                                                <div
                                                                    className="flex items-center justify-between cursor-pointer"
                                                                    onClick={() => toggleErrorExpansion(index)}
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center space-x-2 mb-1">
                                                                            <h4 className="font-medium text-sm truncate">
                                                                                {error.error_message || t('campaigns.unknownError')}
                                                                            </h4>
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {severity}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                                                                            <span>{error.count} {t('common.occurrences')}</span>
                                                                            <span>{error.percentage}% des échecs</span>
                                                                        </div>
                                                                        <Progress
                                                                            value={Number(error.percentage)}
                                                                            className="h-1 mt-2"
                                                                        />
                                                                    </div>
                                                                    <Button variant="ghost" size="sm" className="ml-2">
                                                                        {isExpanded ? (
                                                                            <ChevronUp className="h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </div>

                                                                {isExpanded && (
                                                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                                        <div className="space-y-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => setSelectedError(error.error_message)}
                                                                                className="mr-2"
                                                                            >
                                                                                <Eye className="h-3 w-3 mr-1" />
                                                                                {t('campaigns.viewAffectedMessages')}
                                                                            </Button>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                                                {t('campaigns.errorAnalysis')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <Info className="h-4 w-4" />
                                                <AlertDescription>
                                                    {t('campaigns.noCommonErrorsFound')}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Liste des messages échoués */}
                            <TabsContent value="messages" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <CardTitle>{t('campaigns.failedMessagesList')}</CardTitle>
                                            <div className="flex items-center space-x-2">
                                                {selectedError && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedError(null)}
                                                    >
                                                        {t('campaigns.showAllErrors')}
                                                    </Button>
                                                )}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder={t('campaigns.searchFailedMessages')}
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {selectedError && (
                                            <Alert className="mt-4">
                                                <Filter className="h-4 w-4" />
                                                <AlertDescription>
                                                    {t('campaigns.filteredByError')}: "{selectedError}"
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {messagesByError.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Vue mobile: Cards */}
                                                <div className="block sm:hidden space-y-3">
                                                    {messagesByError.map((message) => (
                                                        <Card key={message.id} className="border-l-4 border-l-red-500">
                                                            <CardContent className="p-4">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="font-medium text-sm">{message.client.name}</h4>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {formatDate(message.created_at)}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                                        <Phone className="h-3 w-3 mr-1" />
                                                                        {message.client.phone}
                                                                    </div>
                                                                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                                        {message.error_message || t('campaigns.unknownError')}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>

                                                {/* Vue desktop: Table */}
                                                <div className="hidden sm:block overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                {t('common.recipient')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                {t('common.phone')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                {t('common.errorMessage')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                {t('common.date')}
                                                            </th>
                                                        </tr>
                                                        </thead>
                                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                        {messagesByError.map((message) => (
                                                            <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                    {message.client.name}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    {message.client.phone}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    <div className="max-w-xs">
                                                                        <p className="truncate">
                                                                            {message.error_message || t('campaigns.unknownError')}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    {formatDate(message.created_at)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Pagination info */}
                                                <div className="flex items-center justify-between pt-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>
                                                        {t('campaigns.showingFailedMessages', {
                                                            count: messagesByError.length,
                                                            total: failedMessages.length
                                                        })}
                                                    </span>
                                                    <Button variant="outline" size="sm">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        {t('campaigns.exportFailedMessages')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Alert>
                                                <Info className="h-4 w-4" />
                                                <AlertDescription>
                                                    {searchTerm || selectedError
                                                        ? t('campaigns.noMatchingFailedMessages')
                                                        : t('campaigns.noFailedMessages')
                                                    }
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
