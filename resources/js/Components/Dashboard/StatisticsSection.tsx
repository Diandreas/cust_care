import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import {
    Users,
    MessageSquare,
    Send,
    TrendingUp,
    BarChart3,
    Settings,
    Eye,
    Calendar,
    Tag,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { router } from '@inertiajs/react';

interface StatisticsData {
    // Statistiques de base
    total_clients: number;
    active_clients: number;
    inactive_clients: number;
    opted_out_clients: number;

    // Messages
    total_messages: number;
    messages_this_period: number;
    messages_sent: number;
    messages_delivered: number;
    messages_failed: number;
    delivery_rate: number;

    // Campagnes
    total_campaigns: number;
    active_campaigns: number;
    completed_campaigns: number;
    campaign_success_rate: number;

    // Visites et interactions
    total_visits: number;
    visits_this_period: number;

    // Tags
    total_tags: number;
    tagged_clients: number;

    // Tendance
    client_growth_rate: number;
    engagement_rate: number;

    // Données temporelles
    messages_by_day: Array<{ date: string; count: number }>;
    clients_by_day: Array<{ date: string; count: number }>;
    visits_by_day: Array<{ date: string; count: number }>;

    // Répartition
    clients_by_tags: Array<{ tag_name: string; clients_count: number }>;
    interaction_types: Array<{ type: string; count: number }>;
}

interface StatisticsSectionProps {
    initialData?: Partial<StatisticsData>;
    timeRange?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export default function StatisticsSection({ initialData, timeRange = 'month' }: StatisticsSectionProps) {
    const [stats, setStats] = useState<StatisticsData | null>(initialData as StatisticsData || null);
    const [loading, setLoading] = useState(false);
    const [currentTimeRange, setCurrentTimeRange] = useState(timeRange);
    const [showAdvancedStats, setShowAdvancedStats] = useState(false);

    const fetchStats = async (range: string = currentTimeRange) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/statistics/dashboard?time_range=${range}`);
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleTimeRangeChange = (newRange: string) => {
        setCurrentTimeRange(newRange);
        fetchStats(newRange);
    };

    const openCustomStats = () => {
        router.get('/dashboard/custom-statistics');
    };

    if (!stats) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Statistiques
                    </h2>
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const kpiCards = [
        {
            title: 'Total Clients',
            value: stats.total_clients,
            change: stats.client_growth_rate,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            description: `${stats.active_clients} actifs`
        },
        {
            title: 'Messages Envoyés',
            value: stats.total_messages,
            change: stats.delivery_rate,
            icon: MessageSquare,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            description: `${stats.messages_delivered} livrés`
        },
        {
            title: 'Campagnes',
            value: stats.total_campaigns,
            change: stats.campaign_success_rate,
            icon: Send,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            description: `${stats.active_campaigns} actives`
        },
        {
            title: 'Taux d\'Engagement',
            value: `${stats.engagement_rate}%`,
            change: stats.visits_this_period,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            description: `${stats.visits_this_period} interactions`
        }
    ];

    return (
        <div className="space-y-6">
            {/* En-tête avec contrôles */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Statistiques
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Vue d'ensemble de vos performances
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Sélecteur de période */}
                    <select
                        value={currentTimeRange}
                        onChange={(e) => handleTimeRangeChange(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                        disabled={loading}
                    >
                        <option value="week">7 derniers jours</option>
                        <option value="month">30 derniers jours</option>
                        <option value="year">12 derniers mois</option>
                    </select>

                    {/* Bouton personnaliser */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={openCustomStats}
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Personnaliser
                    </Button>

                    {/* Bouton actualiser */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchStats()}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Cartes KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((kpi, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {kpi.title}
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {kpi.value}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {kpi.description}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center">
                                {typeof kpi.change === 'number' && kpi.change >= 0 ? (
                                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm font-medium ${typeof kpi.change === 'number' && kpi.change >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}>
                                    {typeof kpi.change === 'number'
                                        ? `${Math.abs(kpi.change)}%`
                                        : kpi.change
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Messages par jour */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Messages par jour
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.messages_by_day}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Répartition par tags */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Clients par Tags
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.clients_by_tags}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ tag_name, percent }) => `${tag_name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="clients_count"
                                >
                                    {stats.clients_by_tags.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Statistiques avancées (repliables) */}
            <Card>
                <CardHeader>
                    <CardTitle
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                    >
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Statistiques Avancées
                        </div>
                        <Button variant="ghost" size="sm">
                            {showAdvancedStats ? 'Masquer' : 'Voir plus'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                {showAdvancedStats && (
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Types d'interactions */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Types d'Interactions
                                </h4>
                                <div className="space-y-3">
                                    {stats.interaction_types.map((interaction, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {interaction.type}
                                            </span>
                                            <Badge variant="secondary">
                                                {interaction.count}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Statut des messages */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Statut des Messages
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Livrés
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={(stats.messages_delivered / stats.total_messages) * 100}
                                                className="w-16"
                                            />
                                            <span className="text-sm font-medium">
                                                {stats.messages_delivered}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Échoués
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={(stats.messages_failed / stats.total_messages) * 100}
                                                className="w-16"
                                            />
                                            <span className="text-sm font-medium">
                                                {stats.messages_failed}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Résumé des clients */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Résumé des Clients
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Actifs
                                        </span>
                                        <Badge variant="default">
                                            {stats.active_clients}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Inactifs
                                        </span>
                                        <Badge variant="secondary">
                                            {stats.inactive_clients}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Désinscrits
                                        </span>
                                        <Badge variant="destructive">
                                            {stats.opted_out_clients}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
