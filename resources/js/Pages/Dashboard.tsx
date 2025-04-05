import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/Components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/Components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/Components/ui/alert";
import { Badge } from "@/Components/ui/badge";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Progress } from "@/Components/ui/progress";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Users, 
  MessageSquare, 
  SendIcon, 
  TrendingUp, 
  Calendar, 
  UserCheck, 
  Clock, 
  Archive, 
  BarChart2, 
  AlertTriangle, 
  XCircle
} from 'lucide-react';

// Types pour les statistiques
interface DashboardStats {
  total_clients: number;
  total_messages: number;
  total_campaigns: number;
  total_visits: number;
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
    id: number;
    plan: string;
    plan_id: number;
    clients_limit: number;
    campaigns_limit: number;
    campaign_sms_limit: number;
    personal_sms_quota: number;
    sms_used: number;
    campaigns_used: number;
    next_renewal_date: string;
    auto_renew: boolean;
    expires_at: string;
    sms_usage_percent: number;
    campaigns_usage_percent: number;
    sms_quota_low: boolean;
    sms_quota_exhausted: boolean;
    isFreePlan: boolean;
    clientsCount: number;
  } | null;
  campaign_stats: {
    status_counts: {
      draft: number;
      scheduled: number;
      sent: number;
      failed: number;
      cancelled: number;
    };
    success_rate: number;
    success_rate_formatted: string;
    by_month: {
      month: string;
      count: number;
    }[];
  };
  message_stats: {
    status_counts: {
      sent: number;
      failed: number;
      pending: number;
    };
    delivery_rate: number;
    delivery_rate_formatted: string;
    by_day: {
      date: string;
      count: number;
    }[];
  };
  client_stats: {
    new_this_month: number;
    growth_rate: number;
    growth_rate_formatted: string;
    growth_is_positive: boolean;
    by_tag: {
      name: string;
      count: number;
    }[];
  };
  visit_stats: {
    total: number;
    this_month: number;
    growth_rate: number;
    growth_rate_formatted: string;
    growth_is_positive: boolean;
    by_day: {
      date: string;
      count: number;
    }[];
  };
  trends: {
    active_clients: {
      count: number;
      rate: number;
      rate_formatted: string;
      trend: number;
      trend_formatted: string;
      trend_is_positive: boolean;
    };
    engagement: {
      rate: number;
      rate_formatted: string;
      engaged_clients: number;
      messaged_clients: number;
    };
  };
}

export default function Dashboard({ auth, stats }: PageProps<{ stats: DashboardStats }>) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('month');
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculer les couleurs dynamiquement en fonction des taux
  const getColorByRate = (rate: number) => {
    if (rate >= 80) return '#10b981'; // vert
    if (rate >= 50) return '#3b82f6'; // bleu
    if (rate >= 30) return '#f59e0b'; // jaune
    return '#ef4444'; // rouge
  };

  // Données pour les graphiques
  const pieData = [
    { name: t('dashboard.stats.sent'), value: stats.message_stats?.status_counts.sent || 0, color: '#10b981' },
    { name: t('dashboard.stats.failed'), value: stats.message_stats?.status_counts.failed || 0, color: '#ef4444' },
    { name: t('dashboard.stats.pending'), value: stats.message_stats?.status_counts.pending || 0, color: '#f59e0b' },
  ];

  const campaignStatusData = [
    { name: t('dashboard.stats.draft'), value: stats.campaign_stats?.status_counts.draft || 0, color: '#94a3b8' },
    { name: t('dashboard.stats.scheduled'), value: stats.campaign_stats?.status_counts.scheduled || 0, color: '#3b82f6' },
    { name: t('dashboard.stats.sent'), value: stats.campaign_stats?.status_counts.sent || 0, color: '#10b981' },
    { name: t('dashboard.stats.failed'), value: stats.campaign_stats?.status_counts.failed || 0, color: '#ef4444' },
    { name: t('dashboard.stats.cancelled'), value: stats.campaign_stats?.status_counts.cancelled || 0, color: '#6b7280' },
  ];

  // Préparer les données pour les graphiques de tendance
  const formatVisitData = () => {
    if (!stats.visit_stats?.by_day) return [];
    
    return stats.visit_stats.by_day.map((item) => ({
      date: item.date.split(' ')[0],
      visits: item.count,
    }));
  };

  const formatMessageData = () => {
    if (!stats.message_stats?.by_day) return [];
    
    return stats.message_stats.by_day.map((item) => ({
      date: item.date.split(' ')[0],
      messages: item.count,
    }));
  };

  const formatCampaignData = () => {
    if (!stats.campaign_stats?.by_month) return [];
    
    return stats.campaign_stats.by_month.map((item) => ({
      month: item.month,
      campaigns: item.count,
    }));
  };

  const visitData = formatVisitData();
  const messageData = formatMessageData();
  const campaignData = formatCampaignData();

  const clientTagData = stats.client_stats?.by_tag?.map((tag) => ({
    name: tag.name,
    count: tag.count,
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
  })) || [];

  // Activité récente combinée (visites et messages)
  const combineRecentActivity = () => {
    const recentMessages = stats.recent_messages?.map(msg => ({
      type: 'message',
      date: new Date(msg.created_at),
      id: msg.id,
      client: msg.client,
      content: msg.content
    })) || [];

    return recentMessages.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };

  const recentActivity = combineRecentActivity();

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('dashboard.title')}</h2>}
    >
      <Head title={t('dashboard.title')} />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Alertes */}
          {stats.subscription?.sms_quota_low && (
            <Alert variant="warning" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Attention : Quota de SMS faible</AlertTitle>
              <AlertDescription>
                Vous avez utilisé plus de 80% de votre quota de SMS mensuel.{" "}
                <Link href={route('subscription.addons.index')} className="font-medium underline">
                  Acheter des SMS supplémentaires
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {stats.subscription?.sms_quota_exhausted && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Alerte : Quota de SMS épuisé</AlertTitle>
              <AlertDescription>
                Votre quota de SMS est complètement épuisé. Vous ne pourrez plus envoyer de messages jusqu'à ce que vous achetiez des SMS supplémentaires.{" "}
                <Link href={route('subscription.addons.index')} className="font-medium underline">
                  Acheter des SMS maintenant
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.stats.clients')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_clients}</div>
                {stats.client_stats && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stats.client_stats.growth_is_positive ? (
                      <ArrowUpCircle className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span className={stats.client_stats.growth_is_positive ? "text-green-500" : "text-red-500"}>
                      {stats.client_stats.growth_rate_formatted}
                    </span>
                    <span className="ml-1">ce mois</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.stats.messages')}</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_messages}</div>
                {stats.message_stats && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="text-green-500 mr-1">{stats.message_stats.delivery_rate_formatted}</span>
                    <span>taux de livraison</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.stats.campaigns')}</CardTitle>
                <SendIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_campaigns}</div>
                {stats.campaign_stats && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="text-green-500 mr-1">{stats.campaign_stats.success_rate_formatted}</span>
                    <span>taux de réussite</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.stats.visits')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.visit_stats?.total || 0}</div>
                {stats.visit_stats && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stats.visit_stats.growth_is_positive ? (
                      <ArrowUpCircle className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span className={stats.visit_stats.growth_is_positive ? "text-green-500" : "text-red-500"}>
                      {stats.visit_stats.growth_rate_formatted}
                    </span>
                    <span className="ml-1">ce mois</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subscription Info */}
          {stats.subscription && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {t('subscription.yourSubscription')}
                  {stats.subscription.isFreePlan && (
                    <Badge variant="outline" className="ml-2">Plan Gratuit</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {stats.subscription.isFreePlan ? 
                    t('subscription.limit.freePlanLimit') : 
                    stats.subscription.plan}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Quota de SMS</h4>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {stats.subscription.sms_used} / {stats.subscription.personal_sms_quota} SMS
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {stats.subscription.sms_usage_percent}%
                      </span>
                    </div>
                    <Progress 
                      value={stats.subscription.sms_usage_percent} 
                      className={`h-2 ${stats.subscription.sms_usage_percent > 80 ? 'bg-red-200' : ''}`}
                      indicatorClassName={stats.subscription.sms_usage_percent > 80 ? 'bg-red-500' : undefined}
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Limite de clients</h4>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {stats.subscription.clientsCount} / {stats.subscription.clients_limit} clients
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {Math.round((stats.subscription.clientsCount / stats.subscription.clients_limit) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.round((stats.subscription.clientsCount / stats.subscription.clients_limit) * 100)} 
                      className={`h-2 ${(stats.subscription.clientsCount / stats.subscription.clients_limit) > 0.8 ? 'bg-yellow-200' : ''}`}
                      indicatorClassName={(stats.subscription.clientsCount / stats.subscription.clients_limit) > 0.8 ? 'bg-yellow-500' : undefined}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  {stats.subscription.isFreePlan ? 
                    "Passez à un plan payant pour plus de fonctionnalités" : 
                    `Renouvellement le ${formatDate(stats.subscription.next_renewal_date)}`}
                </p>
                {stats.subscription.isFreePlan ? (
                  <Link
                    href={route('subscription.plans')}
                    className="inline-flex items-center rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-purple-500 hover:to-indigo-500"
                  >
                    {t('subscription.upgrade')}
                  </Link>
                ) : (
                  <Link
                    href={route('subscription.index')}
                    className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold ring-offset-background hover:bg-accent hover:text-accent-foreground"
                  >
                    {t('subscription.manage')}
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Tabs de statistiques avancées */}
          <Tabs defaultValue="overview" className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="subscription">Abonnement</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Taux d'engagement</CardTitle>
                    <CardDescription>Engagement des clients avec vos messages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl font-bold">
                        {stats.trends?.engagement.rate_formatted || "0%"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stats.trends?.engagement.engaged_clients || 0} clients engagés sur {stats.trends?.engagement.messaged_clients || 0} contactés
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Clients actifs</CardTitle>
                    <CardDescription>Clients avec activité récente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl font-bold">
                        {stats.trends?.active_clients.rate_formatted || "0%"}
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2">
                          {stats.trends?.active_clients.count || 0} clients
                        </span>
                        {stats.trends?.active_clients.trend_is_positive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ↑ {stats.trends?.active_clients.trend_formatted}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            ↓ {stats.trends?.active_clients.trend_formatted}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Performance d'envoi</CardTitle>
                    <CardDescription>Taux de succès des messages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl font-bold">
                        {stats.message_stats?.delivery_rate_formatted || "0%"}
                      </div>
                      <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="flex flex-col items-center justify-center p-2 bg-green-50 rounded-md">
                          <span className="text-xl font-semibold text-green-700">{stats.message_stats?.status_counts.sent || 0}</span>
                          <span className="text-xs text-green-600">Envoyés</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-yellow-50 rounded-md">
                          <span className="text-xl font-semibold text-yellow-700">{stats.message_stats?.status_counts.pending || 0}</span>
                          <span className="text-xs text-yellow-600">En attente</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-red-50 rounded-md">
                          <span className="text-xl font-semibold text-red-700">{stats.message_stats?.status_counts.failed || 0}</span>
                          <span className="text-xs text-red-600">Échoués</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>Dernières interactions clients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-4">
                            <Avatar className="h-9 w-9 border">
                              <AvatarFallback className="bg-primary/10">
                                {activity.client.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{activity.client.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{activity.content}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(activity.date.toString())}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Aucune activité récente</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={route('messages.index')} className="text-xs font-medium text-primary hover:underline">
                      Voir tous les messages
                    </Link>
                  </CardFooter>
                </Card>
                
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Campagnes à venir</CardTitle>
                    <CardDescription>Prochains envois programmés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.upcoming_campaigns && stats.upcoming_campaigns.length > 0 ? (
                        stats.upcoming_campaigns.map((campaign) => (
                          <div key={campaign.id} className="flex items-start space-x-4">
                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                              <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{campaign.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {campaign.recipients_count} destinataires
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(campaign.scheduled_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Aucune campagne programmée</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={route('campaigns.index')} className="text-xs font-medium text-primary hover:underline">
                      Gérer les campagnes
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="messages" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                  <CardHeader className="flex flex-row items-center">
                    <div>
                      <CardTitle>Tendance des messages</CardTitle>
                      <CardDescription>Évolution des messages envoyés</CardDescription>
                    </div>
                    <div className="ml-auto">
                      <Select defaultValue="month" onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Semaine</SelectItem>
                          <SelectItem value="month">Mois</SelectItem>
                          <SelectItem value="year">Année</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={messageData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.getDate() + '/' + (date.getMonth() + 1);
                            }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value) => [`${value} messages`, 'Envoyés']}
                            labelFormatter={(label) => {
                              const date = new Date(label);
                              return date.toLocaleDateString();
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="messages" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            dot={{ stroke: '#2563eb', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Statut des messages</CardTitle>
                    <CardDescription>Répartition par état d'envoi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} messages`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Derniers messages</CardTitle>
                    <CardDescription>Messages récents envoyés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.recent_messages && stats.recent_messages.length > 0 ? (
                          stats.recent_messages.map((message) => (
                            <TableRow key={message.id}>
                              <TableCell className="font-medium">{message.client.name}</TableCell>
                              <TableCell className="max-w-xs truncate">{message.content}</TableCell>
                              <TableCell>{formatDate(message.created_at)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center">Aucun message récent</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="campaigns" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Évolution des campagnes</CardTitle>
                    <CardDescription>Nombre de campagnes par mois</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaignData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} campagnes`, '']} />
                          <Legend />
                          <Bar dataKey="campaigns" name="Campagnes" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Statut des campagnes</CardTitle>
                    <CardDescription>Répartition par état d'avancement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={campaignStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {campaignStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} campagnes`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Campagnes à venir</CardTitle>
                    <CardDescription>Prochains envois programmés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Destinataires</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.upcoming_campaigns && stats.upcoming_campaigns.length > 0 ? (
                          stats.upcoming_campaigns.map((campaign) => (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell>{campaign.recipients_count}</TableCell>
                              <TableCell>{formatDate(campaign.scheduled_at)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center">Aucune campagne programmée</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="clients" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par tags</CardTitle>
                    <CardDescription>Distribution des clients par catégorie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={clientTagData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {clientTagData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} clients`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des visites</CardTitle>
                    <CardDescription>Visites clients au fil du temps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={visitData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.getDate() + '/' + (date.getMonth() + 1);
                            }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value) => [`${value} visites`, 'Nombre']}
                            labelFormatter={(label) => {
                              const date = new Date(label);
                              return date.toLocaleDateString();
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="visits" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ stroke: '#10b981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Engagement client</CardTitle>
                    <CardDescription>Statistiques d'interaction avec les clients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                        <UserCheck className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-bold">{stats.trends?.active_clients.count || 0}</h3>
                        <p className="text-sm text-center text-muted-foreground">Clients actifs</p>
                        <Badge variant={stats.trends?.active_clients.trend_is_positive ? "success" : "destructive"} className="mt-2">
                          {stats.trends?.active_clients.trend_is_positive ? '↑' : '↓'} {stats.trends?.active_clients.trend_formatted}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                        <Clock className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-bold">{stats.client_stats?.new_this_month || 0}</h3>
                        <p className="text-sm text-center text-muted-foreground">Nouveaux clients ce mois</p>
                        <Badge variant={stats.client_stats?.growth_is_positive ? "success" : "destructive"} className="mt-2">
                          {stats.client_stats?.growth_is_positive ? '↑' : '↓'} {stats.client_stats?.growth_rate_formatted}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                        <MessageSquare className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-bold">{stats.trends?.engagement.rate_formatted || "0%"}</h3>
                        <p className="text-sm text-center text-muted-foreground">Taux d'engagement global</p>
                        <p className="text-xs text-center text-muted-foreground">
                          {stats.trends?.engagement.engaged_clients || 0} sur {stats.trends?.engagement.messaged_clients || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="subscription">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Votre abonnement</CardTitle>
                    <CardDescription>Détails de votre forfait actuel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.subscription ? (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold">
                              Forfait {stats.subscription.plan || 'Gratuit'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Renouvellement: {stats.subscription.next_renewal_date ? formatDate(stats.subscription.next_renewal_date) : 'N/A'}
                            </p>
                          </div>
                          <Badge variant={stats.subscription.isFreePlan ? "outline" : "default"}>
                            {stats.subscription.isFreePlan ? "Plan gratuit" : "Plan premium"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Quota SMS utilisé</span>
                              <span className="text-sm text-muted-foreground">
                                {stats.subscription.sms_used} / {stats.subscription.personal_sms_quota}
                              </span>
                            </div>
                            {stats.subscription.sms_usage_percent > 80 ? (
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-destructive" 
                                  style={{ width: `${stats.subscription.sms_usage_percent}%` }}
                                ></div>
                              </div>
                            ) : (
                              <Progress value={stats.subscription.sms_usage_percent} className="h-2" />
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Campagnes utilisées</span>
                              <span className="text-sm text-muted-foreground">
                                {stats.subscription.campaigns_used} / {stats.subscription.campaigns_limit}
                              </span>
                            </div>
                            {stats.subscription.campaigns_usage_percent > 80 ? (
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-destructive" 
                                  style={{ width: `${stats.subscription.campaigns_usage_percent}%` }}
                                ></div>
                              </div>
                            ) : (
                              <Progress value={stats.subscription.campaigns_usage_percent} className="h-2" />
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Clients</span>
                              <span className="text-sm text-muted-foreground">
                                {stats.subscription.clientsCount} / {stats.subscription.clients_limit}
                              </span>
                            </div>
                            {(stats.subscription.clientsCount / stats.subscription.clients_limit) > 0.8 ? (
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-destructive" 
                                  style={{ width: `${(stats.subscription.clientsCount / stats.subscription.clients_limit) * 100}%` }}
                                ></div>
                              </div>
                            ) : (
                              <Progress value={(stats.subscription.clientsCount / stats.subscription.clients_limit) * 100} className="h-2" />
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t grid gap-4 md:grid-cols-3">
                          <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                            <MessageSquare className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">{stats.subscription.personal_sms_quota - stats.subscription.sms_used}</h3>
                            <p className="text-sm text-center text-muted-foreground">SMS restants</p>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                            <Calendar className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">{stats.subscription.campaigns_limit - stats.subscription.campaigns_used}</h3>
                            <p className="text-sm text-center text-muted-foreground">Campagnes restantes</p>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                            <Users className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">{stats.subscription.clients_limit - stats.subscription.clientsCount}</h3>
                            <p className="text-sm text-center text-muted-foreground">Places clients disponibles</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Aucun abonnement actif</p>
                        <p className="mt-2">Contactez le support pour activer un abonnement.</p>
                      </div>
                    )}
                  </CardContent>
                  {stats.subscription && (
                    <CardFooter className="border-t pt-6">
                      <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Besoin de plus de SMS ou de fonctionnalités?</p>
                        </div>
                        <div>
                          <Link href="/subscription/upgrade" className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                            Gérer mon abonnement
                          </Link>
                        </div>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="subscription" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Votre abonnement</CardTitle>
                    <CardDescription>Détails de votre forfait actuel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.subscription ? (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold">
                              Forfait {stats.subscription.plan || 'Gratuit'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Renouvellement: {stats.subscription.next_renewal_date ? formatDate(stats.subscription.next_renewal_date) : 'N/A'}
                            </p>
                          </div>
                          <Badge variant={stats.subscription.isFreePlan ? "outline" : "default"}>
                            {stats.subscription.isFreePlan ? "Plan gratuit" : "Plan premium"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Quota SMS utilisé</span>
                              <span className="text-sm text-muted-foreground">
                                {stats.subscription.sms_used} / {stats.subscription.personal_sms_quota}
                              </span>
                            </div>
                            <Progress 
                              value={stats.subscription.sms_usage_percent} 
                              className={`h-2 ${stats.subscription.sms_usage_percent > 80 ? 'bg-destructive/20' : ''}`}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Campagnes utilisées</span>
                              <span className="text-sm text-muted-foreground">
                                {stats.subscription.campaigns_used} / {stats.subscription.campaigns_limit}
                              </span>
                            </div>
                            <Progress 
                              value={stats.subscription.campaigns_usage_percent} 
                              className={`h-2 ${stats.subscription.campaigns_usage_percent > 80 ? 'bg-destructive/20' : ''}`}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Clients</span>
                              <span className="text-sm text-muted-foreground">
                                {stats.subscription.clientsCount} / {stats.subscription.clients_limit}
                              </span>
                            </div>
                            <Progress 
                              value={(stats.subscription.clientsCount / stats.subscription.clients_limit) * 100} 
                              className={`h-2 ${(stats.subscription.clientsCount / stats.subscription.clients_limit) > 0.8 ? 'bg-destructive/20' : ''}`}
                            />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t grid gap-4 md:grid-cols-3">
                          <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                            <MessageSquare className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">{stats.subscription.personal_sms_quota - stats.subscription.sms_used}</h3>
                            <p className="text-sm text-center text-muted-foreground">SMS restants</p>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                            <Calendar className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">{stats.subscription.campaigns_limit - stats.subscription.campaigns_used}</h3>
                            <p className="text-sm text-center text-muted-foreground">Campagnes restantes</p>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                            <Users className="h-8 w-8 text-primary" />
                            <h3 className="text-xl font-bold">{stats.subscription.clients_limit - stats.subscription.clientsCount}</h3>
                            <p className="text-sm text-center text-muted-foreground">Places clients disponibles</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Aucun abonnement actif</p>
                        <p className="mt-2">Contactez le support pour activer un abonnement.</p>
                      </div>
                    )}
                  </CardContent>
                  {stats.subscription && (
                    <CardFooter className="border-t pt-6">
                      <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Besoin de plus de SMS ou de fonctionnalités?</p>
                        </div>
                        <div>
                          <Link href={route('subscription.index')} className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                            Gérer mon abonnement
                          </Link>
                        </div>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}