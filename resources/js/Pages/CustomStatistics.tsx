import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/Components/ui/select';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
    BarChart3,
    Download,
    RefreshCw,
    Settings,
    Filter,
    Calendar,
    Users,
    MessageSquare,
    Send,
    Tag,
    Activity,
    ArrowLeft,
    Plus,
    Trash2
} from 'lucide-react';

interface AvailableData {
    entities: {
        [key: string]: {
            label: string;
            fields: string[];
        };
    };
    filters: {
        date_ranges: string[];
        statuses: {
            [key: string]: string[];
        };
        interaction_types: string[];
        tags: { [key: string]: string };
    };
    group_by_options: {
        [key: string]: string[];
    };
}

interface CustomStatsData {
    total_count: number;
    filters_applied: any;
    breakdown: Array<{ label: string; count: number }>;
    time_series: Array<{ period: string; count: number }>;
}

interface CustomStatisticsProps extends PageProps {
    availableData?: AvailableData;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export default function CustomStatistics({ availableData: initialData }: CustomStatisticsProps) {
    const [availableData, setAvailableData] = useState<AvailableData | null>(initialData || null);
    const [customStats, setCustomStats] = useState<CustomStatsData | null>(null);
    const [loading, setLoading] = useState(false);

    // Configuration de la requête personnalisée
    const [queryConfig, setQueryConfig] = useState({
        entity: 'clients',
        date_from: '',
        date_to: '',
        status: '',
        tags: [] as string[],
        interaction_type: '',
        group_by: 'status',
        period: 'day'
    });

    const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'area'>('line');
    const [showFilters, setShowFilters] = useState(true);

    // Charger les données disponibles
    useEffect(() => {
        fetchAvailableData();
    }, []);

    const fetchAvailableData = async () => {
        try {
            const response = await fetch('/api/statistics/available-data');
            const data = await response.json();
            setAvailableData(data);
        } catch (error) {
            console.error('Erreur lors du chargement des données disponibles:', error);
        }
    };

    const fetchCustomStats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(queryConfig).forEach(([key, value]) => {
                if (value && value !== '') {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(`${key}[]`, v));
                    } else {
                        params.append(key, value.toString());
                    }
                }
            });

            const response = await fetch(`/api/statistics/custom?${params}`);
            const data = await response.json();
            setCustomStats(data);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques personnalisées:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportStats = async (format: 'csv' | 'json' | 'pdf' = 'csv') => {
        try {
            const response = await fetch('/api/statistics/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...queryConfig,
                    format
                })
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `statistiques-personnalisees.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
        }
    };

    const addTagFilter = () => {
        // Logique pour ajouter un filtre de tag
    };

    const removeTagFilter = (tagId: string) => {
        setQueryConfig(prev => ({
            ...prev,
            tags: prev.tags.filter(id => id !== tagId)
        }));
    };

    const renderChart = () => {
        if (!customStats) return null;

        const data = chartType === 'pie' ? customStats.breakdown : customStats.time_series;
        const dataKey = chartType === 'pie' ? 'count' : 'count';
        const nameKey = chartType === 'pie' ? 'label' : 'period';

        const commonProps = {
            data,
            margin: { top: 5, right: 30, left: 20, bottom: 5 }
        };

        switch (chartType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={nameKey} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey={dataKey} stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={nameKey} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={dataKey} fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey={dataKey}
                            >
                                {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={nameKey} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey={dataKey} stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <AuthenticatedLayout
            user={usePage().props.auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                Statistiques Personnalisées
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Créez vos propres analyses et visualisations
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            {showFilters ? 'Masquer' : 'Afficher'} Filtres
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => exportStats('csv')}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Exporter
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Statistiques Personnalisées" />

            <div className="space-y-6">
                {/* Panneau de configuration */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Configuration des Statistiques
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Entité */}
                                <div className="space-y-2">
                                    <Label htmlFor="entity">Entité</Label>
                                    <Select
                                        value={queryConfig.entity}
                                        onValueChange={(value) => setQueryConfig(prev => ({ ...prev, entity: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une entité" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableData?.entities && Object.entries(availableData.entities).map(([key, entity]) => (
                                                <SelectItem key={key} value={key}>
                                                    {entity.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Période */}
                                <div className="space-y-2">
                                    <Label htmlFor="period">Période</Label>
                                    <Select
                                        value={queryConfig.period}
                                        onValueChange={(value) => setQueryConfig(prev => ({ ...prev, period: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une période" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="day">Jour</SelectItem>
                                            <SelectItem value="week">Semaine</SelectItem>
                                            <SelectItem value="month">Mois</SelectItem>
                                            <SelectItem value="year">Année</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Grouper par */}
                                <div className="space-y-2">
                                    <Label htmlFor="group_by">Grouper par</Label>
                                    <Select
                                        value={queryConfig.group_by}
                                        onValueChange={(value) => setQueryConfig(prev => ({ ...prev, group_by: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un groupement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="status">Statut</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="tags">Tags</SelectItem>
                                            <SelectItem value="type">Type</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date de début */}
                                <div className="space-y-2">
                                    <Label htmlFor="date_from">Date de début</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={queryConfig.date_from}
                                        onChange={(e) => setQueryConfig(prev => ({ ...prev, date_from: e.target.value }))}
                                    />
                                </div>

                                {/* Date de fin */}
                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Date de fin</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={queryConfig.date_to}
                                        onChange={(e) => setQueryConfig(prev => ({ ...prev, date_to: e.target.value }))}
                                    />
                                </div>

                                {/* Statut */}
                                {availableData?.filters?.statuses?.[queryConfig.entity] && (
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Statut</Label>
                                        <Select
                                            value={queryConfig.status}
                                            onValueChange={(value) => setQueryConfig(prev => ({ ...prev, status: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un statut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableData.filters.statuses[queryConfig.entity].map((status) => (
                                                    <SelectItem key={status} value={status}>
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            {queryConfig.entity === 'clients' && availableData?.filters?.tags && (
                                <div className="mt-6">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {queryConfig.tags.map((tagId) => {
                                            const tagName = availableData.filters.tags[tagId];
                                            return (
                                                <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                                                    {tagName}
                                                    <button
                                                        onClick={() => removeTagFilter(tagId)}
                                                        className="ml-1 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addTagFilter}
                                            className="flex items-center gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Ajouter un tag
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Bouton de génération */}
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={fetchCustomStats}
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Générer les Statistiques
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Résultats */}
                {customStats && (
                    <div className="space-y-6">
                        {/* Résumé */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Résultats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-blue-600">
                                            {customStats.total_count}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total d'éléments
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-green-600">
                                            {customStats.breakdown.length}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Catégories
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-purple-600">
                                            {customStats.time_series.length}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Périodes
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sélecteur de type de graphique */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Type de Visualisation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 mb-6">
                                    {[
                                        { key: 'line', label: 'Ligne', icon: Activity },
                                        { key: 'bar', label: 'Barres', icon: BarChart3 },
                                        { key: 'pie', label: 'Camembert', icon: MessageSquare },
                                        { key: 'area', label: 'Aire', icon: Users }
                                    ].map(({ key, label, icon: Icon }) => (
                                        <Button
                                            key={key}
                                            variant={chartType === key ? 'default' : 'outline'}
                                            onClick={() => setChartType(key as any)}
                                            className="flex items-center gap-2"
                                        >
                                            <Icon className="h-4 w-4" />
                                            {label}
                                        </Button>
                                    ))}
                                </div>

                                {/* Graphique */}
                                <div className="h-96">
                                    {renderChart()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tableau de répartition */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Répartition Détaillée</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {customStats.breakdown.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                            <span className="font-medium">{item.label}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="w-32">
                                                    <Progress
                                                        value={(item.count / Math.max(...customStats.breakdown.map(b => b.count))) * 100}
                                                        className="h-2"
                                                    />
                                                </div>
                                                <Badge variant="secondary">
                                                    {item.count}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* État vide */}
                {!customStats && !loading && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Aucune statistique générée
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                Configurez vos filtres et cliquez sur "Générer les Statistiques" pour voir vos données.
                            </p>
                            <Button onClick={fetchCustomStats} disabled={loading}>
                                Générer mes premières statistiques
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
