import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/Components/ui/card';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/Components/ui/table";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/Components/ui/alert";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Progress } from "@/Components/ui/progress";
import {
  ArrowUpCircle, ArrowDownCircle, Users, MessageSquare, SendIcon, TrendingUp,
  Calendar, Clock, BarChart2, AlertTriangle, XCircle, ArrowUpRight, Activity,
  Download, RefreshCw, Filter, Plus, ChevronRight, MoreHorizontal, Settings,
  Zap, Target, Globe, Heart, Layout
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import StatisticsSection from '@/Components/Dashboard/StatisticsSection';

interface DashboardProps {
  auth: any;
  stats: {
    subscription?: {
      isFreePlan: boolean;
      sms_quota_low?: boolean;
      sms_quota_exhausted?: boolean;
      plan?: string;
      sms_used?: number;
      personal_sms_quota?: number;
      sms_usage_percent?: number;
      clientsCount?: number;
      clients_limit?: number;
    };
    message_stats?: {
      status_counts: {
        sent: number;
        failed: number;
        pending: number;
      };
      delivery_rate_formatted?: string;
      by_day?: Array<{
        date: string;
        count: number;
      }>;
    };
    visit_stats?: {
      by_day?: Array<{
        date: string;
        count: number;
      }>;
    };
    total_clients?: number;
    total_messages?: number;
    total_campaigns?: number;
    trends?: {
      active_clients: {
        rate_formatted: string;
      };
      engagement: {
        rate_formatted: string;
        engaged_clients: number;
      };
    };
    client_stats?: {
      growth_is_positive: boolean;
      growth_rate_formatted: string;
    };
    campaign_stats?: {
      success_rate_formatted: string;
      status_counts: {
        draft: number;
        sent: number;
      };
    };
    recent_messages?: Array<{
      id: string | number;
      client: {
        name: string;
      };
      content: string;
      sent_at: string;
      created_at: string;
      status: 'sent' | 'delivered' | 'failed';
    }>;
  };
  recentMessages: Array<{
    id: string | number;
    client_name: string;
    content: string;
    sent_at: string;
    created_at: string;
    status: 'sent' | 'delivered' | 'failed';
  }>;
}

export default function Dashboard({ auth, stats, recentMessages }: DashboardProps) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [visibleKPIs, setVisibleKPIs] = useState({
    clients: true,
    messages: true,
    campaigns: true,
    engagement: true
  });

  // HelloBoost theme colors
  const helloBoostColors = {
    primary: '#6366F1',    // Indigo HelloBoost
    secondary: '#D946EF',  // Fuchsia HelloBoost
    tertiary: '#EC4899',   // Pink HelloBoost
    success: '#10B981',    // Emerald
    warning: '#F59E0B',    // Amber
    danger: '#EF4444',     // Red
    neutral: '#6B7280',    // Gray
    light: '#F8FAFC',      // Slate 50
    dark: '#1E293B',       // Slate 800
  };

  // Données réelles de la BD
  const kpis = [
    {
      key: 'clients',
      title: 'Clients',
      value: stats.total_clients || 0,
      change: stats.client_stats?.growth_rate_formatted || '0%',
      icon: Users,
      color: helloBoostColors.primary
    },
    {
      key: 'messages',
      title: 'Messages',
      value: stats.total_messages || 0,
      change: stats.message_stats?.delivery_rate_formatted || '0%',
      icon: MessageSquare,
      color: helloBoostColors.success
    },
    {
      key: 'campaigns',
      title: 'Campagnes',
      value: stats.total_campaigns || 0,
      change: stats.campaign_stats?.success_rate_formatted || '0%',
      icon: SendIcon,
      color: helloBoostColors.secondary
    },
    {
      key: 'engagement',
      title: 'Engagement',
      value: stats.trends?.engagement.rate_formatted || '0%',
      change: `${stats.trends?.engagement.engaged_clients || 0}`,
      icon: Heart,
      color: helloBoostColors.tertiary
    }
  ];

  const toggleKPI = (key: string) => {
    setVisibleKPIs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  // Date formatting utility
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time for recent activities
  const getTimeAgo = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Simulated refresh function
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Prepare chart data
  const pieData = [
    { name: 'Envoyés', value: stats.message_stats?.status_counts?.sent || 0, color: helloBoostColors.success },
    { name: 'Échoués', value: stats.message_stats?.status_counts?.failed || 0, color: helloBoostColors.danger },
    { name: 'En attente', value: stats.message_stats?.status_counts?.pending || 0, color: helloBoostColors.warning },
  ];

  // Format data for charts
  const visitData = stats.visit_stats?.by_day?.map((item: { date: string; count: number }) => ({
    date: item.date.split(' ')[0],
    visits: item.count,
  })) || [];

  const messageData = stats.message_stats?.by_day?.map((item: { date: string; count: number }) => ({
    date: item.date.split(' ')[0],
    messages: item.count,
  })) || [];

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Bienvenue sur HelloBoost, {auth.user.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
                <SelectItem value="year">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomizer(!showCustomizer)}
              className="border-gray-200 bg-white shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Layout className="w-4 h-4 mr-2" />
              {showCustomizer ? 'Masquer' : 'Personnaliser'}
            </Button>
            <Button variant="outline" onClick={refreshData} disabled={isRefreshing} className="border-gray-200 bg-white shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      }
    >
      <Head title="Tableau de bord" />

      <div className="space-y-8">
        {/* Alertes de quota */}
        {(stats.subscription?.sms_quota_low || stats.subscription?.sms_quota_exhausted) && (
          <div className="space-y-4">
            {stats.subscription?.sms_quota_low && !stats.subscription?.sms_quota_exhausted && (
              <Alert className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900/5 hover:shadow-md transition-all duration-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                  Quota SMS faible
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  Votre quota SMS est presque épuisé.
                  <Link href={route('subscription.addons.index')} className="ml-2 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Acheter des SMS supplémentaires
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {stats.subscription?.sms_quota_exhausted && (
              <Alert variant="destructive" className="border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-900/20 bg-gradient-to-r from-rose-50 to-white dark:from-rose-900/20 dark:to-gray-900/5 hover:shadow-md transition-all duration-200">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Quota SMS épuisé</AlertTitle>
                <AlertDescription>
                  Votre quota SMS est épuisé. Vous ne pouvez plus envoyer de messages.
                  <Link href={route('subscription.addons.index')} className="ml-2 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Acheter maintenant
                  </Link>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Simple Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-3 hover:bg-white/20 transition-all"
            title="Customize Dashboard"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Simple KPI Customizer */}
        <AnimatePresence>
          {showCustomizer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all">
                <div className="absolute inset-0 bg-gradient-to-r opacity-5 rounded-2xl"></div>
                <div className="grid grid-cols-4 gap-4 relative z-10">
                  {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                      <motion.button
                        key={kpi.key}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => toggleKPI(kpi.key)}
                        className={`p-3 rounded-xl transition-all ${visibleKPIs[kpi.key as keyof typeof visibleKPIs]
                          ? 'backdrop-blur-xl bg-white/20 border border-white/30'
                          : 'bg-white/5 border border-white/10'
                          }`}
                        title={kpi.title}
                      >
                        <Icon className="h-6 w-6 mx-auto" style={{ color: kpi.color }} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liquid Glass KPI Cards - Icon Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {kpis
              .filter(kpi => visibleKPIs[kpi.key as keyof typeof visibleKPIs])
              .map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={kpi.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    className="backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 rounded-2xl p-8 group cursor-pointer hover:shadow-lg transition-all duration-300"
                    style={{ animationDelay: `${index * 0.5}s` }}
                    title={`${kpi.title}: ${kpi.value} (${kpi.change})`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-10 rounded-2xl group-hover:opacity-20 transition-opacity"></div>

                    <div className="relative z-10 text-center">
                      <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
                        style={{ backgroundColor: `${kpi.color}20` }}
                      >
                        <Icon className="w-8 h-8" style={{ color: kpi.color }} />
                      </div>

                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:scale-110 transition-transform">
                        {kpi.value}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            }
          </AnimatePresence>
        </div>

        {/* Section Statistiques */}
        <StatisticsSection timeRange={timeRange} />

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphique d'activité */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Activité récente</CardTitle>
              <CardDescription>Messages et visites au fil du temps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={messageData}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={helloBoostColors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={helloBoostColors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke={helloBoostColors.primary}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMessages)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Statut des messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Statut des messages</CardTitle>
              <CardDescription>Répartition par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} messages`, '']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quota et actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quota SMS */}
          {stats.subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Quota SMS</span>
                </CardTitle>
                <CardDescription>
                  Plan: {stats.subscription.plan || 'Gratuit'}
                  {stats.subscription.isFreePlan && (
                    <Badge variant="outline" className="ml-2">Gratuit</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>SMS utilisés</span>
                    <span className="font-medium">
                      {stats.subscription.sms_used || 0} / {stats.subscription.personal_sms_quota || 0}
                    </span>
                  </div>
                  <Progress
                    value={stats.subscription.sms_usage_percent}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-600">
                    {stats.subscription.personal_sms_quota - stats.subscription.sms_used} SMS restants
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Clients</span>
                    <span className="font-medium">
                      {stats.subscription.clientsCount || 0} / {stats.subscription.clients_limit || 0}
                    </span>
                  </div>
                  <Progress
                    value={(stats.subscription.clientsCount && stats.subscription.clients_limit) ?
                      (stats.subscription.clientsCount / stats.subscription.clients_limit) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-sm hover:shadow-lg transition-all duration-200"
                  >
                    <Link href={stats.subscription.isFreePlan ? route('subscription.plans') : route('subscription.index')}>
                      {stats.subscription.isFreePlan ? 'Passer au premium' : 'Gérer l\'abonnement'}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Actions rapides</span>
              </CardTitle>
              <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-md transition-all">
                <Link href={route('campaigns.create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une nouvelle campagne
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start h-12 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-pink-500/5 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                <Link href={route('clients.index')}>
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les clients
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start h-12 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/10 hover:via-purple-500/10 hover:to-pink-500/10 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                <Link href={route('messages.index')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Voir tous les messages
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start h-12 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/10 hover:via-purple-500/10 hover:to-pink-500/10 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                <Link href={route('templates.index')}>
                  <Globe className="h-4 w-4 mr-2" />
                  Modèles de messages
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Messages récents */}
        {stats.recent_messages && stats.recent_messages.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Messages récents</CardTitle>
                  <CardDescription>Derniers messages envoyés</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href={route('messages.index')}>
                    Voir tout
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recent_messages.slice(0, 5).map((message) => (
                  <div key={message.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-pink-500/5 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {message.client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{message.client.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-xs">
                          {message.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={message.status === 'sent' ? 'default' : message.status === 'delivered' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {message.status === 'sent' ? 'Envoyé' :
                          message.status === 'delivered' ? 'Livré' : 'Échoué'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}