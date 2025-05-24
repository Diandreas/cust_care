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
  Zap, Target, Globe
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

interface DashboardProps {
  auth: any;
  stats: {
    subscription?: {
      isFreePlan: boolean;
    };
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

  // HelloBoost theme colors
  const helloBoostColors = {
    primary: '#3B82F6',    // Bleu HelloBoost
    secondary: '#F97316',   // Orange HelloBoost
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    neutral: '#6B7280',
    light: '#F8FAFC',
    dark: '#1E293B',
  };

  // Prepare chart data
  const pieData = [
    { name: 'Envoyés', value: stats.message_stats?.status_counts.sent || 0, color: helloBoostColors.success },
    { name: 'Échoués', value: stats.message_stats?.status_counts.failed || 0, color: helloBoostColors.danger },
    { name: 'En attente', value: stats.message_stats?.status_counts.pending || 0, color: helloBoostColors.warning },
  ];

  // Format data for charts
  const visitData = stats.visit_stats?.by_day?.map((item) => ({
    date: item.date.split(' ')[0],
    visits: item.count,
  })) || [];

  const messageData = stats.message_stats?.by_day?.map((item) => ({
    date: item.date.split(' ')[0],
    messages: item.count,
  })) || [];

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Bienvenue sur HelloBoost, {auth.user.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
                <SelectItem value="year">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshData} disabled={isRefreshing}>
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
              <Alert className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-200">
                  Quota SMS faible
                </AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-300">
                  Votre quota SMS est presque épuisé.
                  <Link href={route('subscription.addons.index')} className="ml-2 font-medium underline hover:no-underline">
                    Acheter des SMS supplémentaires
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {stats.subscription?.sms_quota_exhausted && (
              <Alert variant="destructive" className="border-l-4 border-l-red-500">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Quota SMS épuisé</AlertTitle>
                <AlertDescription>
                  Votre quota SMS est épuisé. Vous ne pouvez plus envoyer de messages.
                  <Link href={route('subscription.addons.index')} className="ml-2 font-medium underline hover:no-underline">
                    Acheter maintenant
                  </Link>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Clients */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-bl-full"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.trends?.active_clients.rate_formatted || "0%"} actifs
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_clients || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Clients totaux</p>
                {stats.client_stats && (
                  <div className="flex items-center text-sm">
                    {stats.client_stats.growth_is_positive ? (
                      <ArrowUpCircle className="mr-1 h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="mr-1 h-4 w-4 text-red-500" />
                    )}
                    <span className={stats.client_stats.growth_is_positive ? 'text-green-600' : 'text-red-600'}>
                      {stats.client_stats.growth_rate_formatted}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-bl-full"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.message_stats?.delivery_rate_formatted || "0%"} livrés
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_messages || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Messages envoyés</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    {stats.message_stats?.status_counts.sent || 0} envoyés
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    {stats.message_stats?.status_counts.pending || 0} en attente
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campagnes */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-bl-full"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <SendIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.campaign_stats?.success_rate_formatted || "0%"} succès
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_campaigns || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Campagnes créées</p>
                <div className="flex items-center gap-1 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {stats.campaign_stats?.status_counts.draft || 0} brouillons
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    {stats.campaign_stats?.status_counts.sent || 0} envoyées
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-bl-full"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Ce mois
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.trends?.engagement.rate_formatted || "0%"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux d'engagement</p>
                <div className="flex items-center text-sm">
                  <span className="text-green-600">
                    {stats.trends?.engagement.engaged_clients || 0} clients engagés
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphique d'activité */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Activité récente</CardTitle>
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
              <CardTitle className="text-lg font-semibold">Statut des messages</CardTitle>
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
                  Quota SMS
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
                      {stats.subscription.sms_used} / {stats.subscription.personal_sms_quota}
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
                      {stats.subscription.clientsCount} / {stats.subscription.clients_limit}
                    </span>
                  </div>
                  <Progress
                    value={(stats.subscription.clientsCount / stats.subscription.clients_limit) * 100}
                    className="h-2"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
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
                Actions rapides
              </CardTitle>
              <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start h-12 bg-blue-500 hover:bg-blue-600">
                <Link href={route('campaigns.create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une nouvelle campagne
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start h-12">
                <Link href={route('clients.index')}>
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les clients
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start h-12">
                <Link href={route('messages.index')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Voir tous les messages
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start h-12">
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
                  <CardTitle className="text-lg font-semibold">Messages récents</CardTitle>
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
                  <div key={message.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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