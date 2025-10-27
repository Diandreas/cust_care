import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import DashboardCustomizer, { KPIWidget } from '@/Components/Dashboard/DashboardCustomizer';
import KPIWidget, { KPIData } from '@/Components/Dashboard/KPIWidget';
import AdvancedMetrics from '@/Components/Dashboard/AdvancedMetrics';
import {
    Users,
    MessageCircle,
    Sparkles,
    TrendingUp,
    Calendar,
    BarChart3,
    Zap,
    Bot,
    Phone,
    Image,
    Settings,
    Activity,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Target,
    Heart,
    Eye,
    MousePointer,
    Mail,
    Percent,
    Globe,
    Star,
    Gift,
    Briefcase
} from 'lucide-react';

interface DashboardStats {
    total_clients: number;
    active_campaigns: number;
    messages_sent: number;
    engagement_rate: number;
    automation_rules: number;
    whatsapp_connected: boolean;
    ai_status: 'online' | 'offline';
    // Additional KPIs
    revenue: number;
    conversion_rate: number;
    whatsapp_messages: number;
    email_campaigns: number;
    sms_sent: number;
    click_rate: number;
    open_rate: number;
    likes_shares: number;
    comments: number;
    social_reach: number;
    follower_growth: number;
    cost_per_lead: number;
    roi: number;
    scheduled_messages: number;
    automation_success: number;
    instagram_posts: number;
    facebook_engagement: number;
    linkedin_connections: number;
}

interface RecentActivity {
    id: number;
    type: 'message' | 'campaign' | 'automation' | 'client';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'pending' | 'error';
}

interface DashboardProps {
    user: any;
    stats: DashboardStats;
    recent_activities: RecentActivity[];
    quick_stats: {
        today_messages: number;
        active_automations: number;
        pending_campaigns: number;
        new_clients: number;
    };
}

export default function Dashboard({ user, stats, recent_activities = [], quick_stats }: DashboardProps) {
    const [widgetConfig, setWidgetConfig] = useState<KPIWidget[]>([]);
    const [kpiData, setKpiData] = useState<KPIData[]>([]);

    // Initialize KPI data from stats
    useEffect(() => {
        if (stats) {
            const kpis: KPIData[] = [
                {
                    id: 'total_clients',
                    name: 'Total Clients',
                    value: stats.total_clients || 0,
                    previousValue: Math.max(0, (stats.total_clients || 0) - (quick_stats?.new_clients || 0)),
                    change: quick_stats?.new_clients ? ((quick_stats.new_clients / Math.max(1, stats.total_clients - quick_stats.new_clients)) * 100) : 0,
                    changeType: (quick_stats?.new_clients || 0) > 0 ? 'increase' : 'neutral',
                    format: 'number',
                    target: 1000,
                    color: 'blue',
                    icon: Users,
                    size: 'medium',
                    description: 'Nombre total de clients dans votre base'
                },
                {
                    id: 'messages_sent',
                    name: 'Messages Envoyés',
                    value: stats.messages_sent || 0,
                    change: 8,
                    changeType: 'increase',
                    format: 'number',
                    target: 10000,
                    color: 'green',
                    icon: MessageCircle,
                    size: 'medium',
                    description: 'Total des messages envoyés aujourd\'hui'
                },
                {
                    id: 'engagement_rate',
                    name: 'Taux d\'Engagement',
                    value: stats.engagement_rate || 0,
                    change: 5.2,
                    changeType: 'increase',
                    format: 'percentage',
                    target: 50,
                    color: 'purple',
                    icon: Heart,
                    size: 'medium',
                    description: 'Pourcentage d\'engagement sur vos contenus'
                },
                {
                    id: 'revenue',
                    name: 'Revenus Générés',
                    value: stats.revenue || 12500,
                    change: 15.3,
                    changeType: 'increase',
                    format: 'currency',
                    target: 15000,
                    color: 'green',
                    icon: DollarSign,
                    size: 'large',
                    description: 'Revenus générés par vos campagnes marketing'
                },
                {
                    id: 'conversion_rate',
                    name: 'Taux de Conversion',
                    value: stats.conversion_rate || 3.2,
                    change: 2.1,
                    changeType: 'increase',
                    format: 'percentage',
                    target: 5,
                    color: 'pink',
                    icon: Target,
                    size: 'small',
                    description: 'Pourcentage de conversions'
                },
                {
                    id: 'active_automations',
                    name: 'Automatisations Actives',
                    value: stats.automation_rules || 0,
                    change: 0,
                    changeType: 'neutral',
                    format: 'number',
                    color: 'yellow',
                    icon: Zap,
                    size: 'small',
                    description: 'Nombre d\'automatisations en cours'
                },
                {
                    id: 'whatsapp_messages',
                    name: 'Messages WhatsApp',
                    value: stats.whatsapp_messages || Math.floor((stats.messages_sent || 0) * 0.6),
                    change: 12.4,
                    changeType: 'increase',
                    format: 'number',
                    color: 'emerald',
                    icon: Phone,
                    size: 'small',
                    description: 'Messages envoyés via WhatsApp Business'
                },
                {
                    id: 'email_campaigns',
                    name: 'Campagnes Email',
                    value: stats.email_campaigns || 5,
                    change: -2.3,
                    changeType: 'decrease',
                    format: 'number',
                    color: 'blue',
                    icon: Mail,
                    size: 'small',
                    description: 'Campagnes email actives'
                },
                {
                    id: 'click_rate',
                    name: 'Taux de Clic',
                    value: stats.click_rate || 4.8,
                    change: 1.2,
                    changeType: 'increase',
                    format: 'percentage',
                    target: 6,
                    color: 'yellow',
                    icon: MousePointer,
                    size: 'small',
                    description: 'Pourcentage de clics sur vos liens'
                },
                {
                    id: 'social_reach',
                    name: 'Portée Sociale',
                    value: stats.social_reach || 25000,
                    change: 18.7,
                    changeType: 'increase',
                    format: 'number',
                    target: 50000,
                    color: 'teal',
                    icon: Globe,
                    size: 'medium',
                    description: 'Portée totale sur les réseaux sociaux'
                },
                {
                    id: 'roi',
                    name: 'ROI Marketing',
                    value: stats.roi || 245,
                    change: 23.1,
                    changeType: 'increase',
                    format: 'percentage',
                    target: 300,
                    color: 'emerald',
                    icon: TrendingUp,
                    size: 'medium',
                    description: 'Retour sur investissement des campagnes'
                },
                {
                    id: 'automation_success',
                    name: 'Succès Automations',
                    value: stats.automation_success || 87,
                    change: 4.2,
                    changeType: 'increase',
                    format: 'percentage',
                    target: 95,
                    color: 'green',
                    icon: Target,
                    size: 'medium',
                    description: 'Taux de succès des automatisations'
                }
            ];
            setKpiData(kpis);
        }
    }, [stats, quick_stats]);
    const menuItems = [
        {
            title: 'Assistant IA',
            description: 'Chat avec l\'intelligence artificielle',
            icon: Bot,
            href: '/marketing/ai/assistant',
            color: 'from-purple-500 to-indigo-600',
            status: stats?.ai_status || 'offline'
        },
        {
            title: 'Clients Marketing',
            description: 'Gérer vos contacts marketing',
            icon: Users,
            href: '/marketing/clients',
            color: 'from-blue-500 to-cyan-600',
            count: stats?.total_clients || 0
        },
        {
            title: 'Automatisations',
            description: 'Configurer les automatisations',
            icon: Zap,
            href: '/marketing/automation/dashboard',
            color: 'from-yellow-500 to-orange-600',
            count: stats?.automation_rules || 0
        },
        {
            title: 'WhatsApp Business',
            description: 'Gérer WhatsApp Business',
            icon: Phone,
            href: '/marketing/whatsapp/dashboard',
            color: 'from-green-500 to-emerald-600',
            status: stats?.whatsapp_connected ? 'online' : 'offline'
        },
        {
            title: 'Générateur Flyers',
            description: 'Créer des flyers avec l\'IA',
            icon: Image,
            href: '/marketing/flyers/create',
            color: 'from-pink-500 to-rose-600'
        },
        {
            title: 'Analytics',
            description: 'Analyser les performances',
            icon: BarChart3,
            href: '/marketing/analytics',
            color: 'from-indigo-500 to-purple-600',
            rate: stats?.engagement_rate || 0
        },
        {
            title: 'Configuration',
            description: 'Paramètres des automatisations',
            icon: Settings,
            href: '/marketing/config/automation',
            color: 'from-gray-500 to-slate-600'
        },
        {
            title: 'Monitoring',
            description: 'Surveiller les commandes',
            icon: Activity,
            href: '/marketing/monitoring/commands',
            color: 'from-red-500 to-pink-600'
        }
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'message':
                return MessageCircle;
            case 'campaign':
                return Sparkles;
            case 'automation':
                return Zap;
            case 'client':
                return Users;
            default:
                return Activity;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
        return `${Math.floor(diffInMinutes / 1440)}j`;
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Dashboard Marketing" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Marketing Digital
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Tableau de bord de votre assistant marketing intelligent
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={stats?.ai_status === 'online' ? 'default' : 'secondary'}>
                                <Bot className="h-3 w-3 mr-1" />
                                IA {stats?.ai_status === 'online' ? 'En ligne' : 'Hors ligne'}
                            </Badge>
                            <Badge variant={stats?.whatsapp_connected ? 'default' : 'secondary'}>
                                <Phone className="h-3 w-3 mr-1" />
                                WhatsApp {stats?.whatsapp_connected ? 'Connecté' : 'Déconnecté'}
                            </Badge>
                        </div>
                    </div>

                    {/* Dashboard Customization */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Métriques Clés
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Suivez les KPIs importants pour votre activité
                            </p>
                        </div>
                        <DashboardCustomizer
                            widgets={widgetConfig}
                            onUpdate={setWidgetConfig}
                        />
                    </div>

                    {/* Customizable KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8 auto-rows-fr">
                        {kpiData
                            .filter(kpi => {
                                const widget = widgetConfig.find(w => w.id === kpi.id);
                                return widget?.visible !== false; // Show by default if not configured
                            })
                            .sort((a, b) => {
                                const widgetA = widgetConfig.find(w => w.id === a.id);
                                const widgetB = widgetConfig.find(w => w.id === b.id);
                                return (widgetA?.position || 0) - (widgetB?.position || 0);
                            })
                            .map((kpi, index) => {
                                const widget = widgetConfig.find(w => w.id === kpi.id);
                                return (
                                    <KPIWidget
                                        key={kpi.id}
                                        data={{
                                            ...kpi,
                                            size: widget?.size || kpi.size
                                        }}
                                        animationDelay={index * 0.1}
                                    />
                                );
                            })
                        }
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Quick Actions Grid */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions Rapides</CardTitle>
                                    <CardDescription>
                                        Accédez rapidement à vos outils marketing
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {menuItems.map((item, index) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={index}
                                                    href={item.href}
                                                    className="block group"
                                                >
                                                    <Card className="h-full border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-lg">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} text-white group-hover:scale-110 transition-transform`}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                                        {item.title}
                                                                    </h3>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                                        {item.description}
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        {item.count !== undefined && (
                                                                            <Badge variant="secondary">
                                                                                {item.count}
                                                                            </Badge>
                                                                        )}
                                                                        {item.status && (
                                                                            <Badge variant={item.status === 'online' ? 'default' : 'secondary'}>
                                                                                {item.status === 'online' ? 'En ligne' : 'Hors ligne'}
                                                                            </Badge>
                                                                        )}
                                                                        {item.rate !== undefined && (
                                                                            <Badge variant="secondary">
                                                                                {item.rate}%
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activities */}
                        <div>
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Activité Récente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recent_activities.length > 0 ? (
                                        <div className="space-y-4">
                                            {recent_activities.slice(0, 8).map((activity) => {
                                                const Icon = getActivityIcon(activity.type);
                                                return (
                                                    <div key={activity.id} className="flex items-start gap-3">
                                                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {activity.title}
                                                            </p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                                                {activity.description}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(activity.status)}
                                                                <span className="text-xs text-slate-500 dark:text-slate-500">
                                                                    {formatTimeAgo(activity.timestamp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Activity className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Aucune activité récente
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                                Les activités apparaîtront ici
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Quick Stats Card */}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="text-sm">Aujourd'hui</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Automatisations actives</span>
                                        <Badge variant="secondary">{quick_stats?.active_automations || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Messages envoyés</span>
                                        <Badge variant="secondary">{quick_stats?.today_messages || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Nouveaux clients</span>
                                        <Badge variant="secondary">{quick_stats?.new_clients || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Campagnes en attente</span>
                                        <Badge variant="secondary">{quick_stats?.pending_campaigns || 0}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Advanced Metrics Section */}
                    <div className="mt-12">
                        <AdvancedMetrics />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}