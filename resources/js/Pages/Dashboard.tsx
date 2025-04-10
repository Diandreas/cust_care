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
  Download, RefreshCw, Filter, Plus, ChevronRight, MoreHorizontal, Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

export default function Dashboard({ auth, stats }) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date formatting utility
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time for recent activities
  const formatTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return formatDate(dateString);
  };

  // Simulated refresh function
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: '#6b7280',
    accent: '#8b5cf6',
  };

  // Prepare chart data
  const pieData = [
    { name: 'Sent', value: stats.message_stats?.status_counts.sent || 0, color: chartColors.success },
    { name: 'Failed', value: stats.message_stats?.status_counts.failed || 0, color: chartColors.danger },
    { name: 'Pending', value: stats.message_stats?.status_counts.pending || 0, color: chartColors.warning },
  ];

  const campaignStatusData = [
    { name: 'Draft', value: stats.campaign_stats?.status_counts.draft || 0, color: chartColors.neutral },
    { name: 'Scheduled', value: stats.campaign_stats?.status_counts.scheduled || 0, color: chartColors.primary },
    { name: 'Sent', value: stats.campaign_stats?.status_counts.sent || 0, color: chartColors.success },
    { name: 'Failed', value: stats.campaign_stats?.status_counts.failed || 0, color: chartColors.danger },
    { name: 'Cancelled', value: stats.campaign_stats?.status_counts.cancelled || 0, color: chartColors.neutral },
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

  const campaignData = stats.campaign_stats?.by_month?.map((item) => ({
    month: item.month,
    campaigns: item.count,
  })) || [];

  // Client tags data
  const clientTagData = stats.client_stats?.by_tag?.map((tag, index) => ({
    name: tag.name,
    count: tag.count,
    color: `hsl(${(210 + index * 30) % 360}, 70%, 50%)`,
  })) || [];

  // Recent activity
  const recentActivity = stats.recent_messages?.map(msg => ({
    type: 'message',
    date: new Date(msg.created_at),
    id: msg.id,
    client: msg.client,
    content: msg.content
  })).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5) || [];

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            {t('dashboard.title')}
          </h2>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t('dashboard.timeRange.last7Days')}</SelectItem>
                <SelectItem value="month">{t('dashboard.timeRange.last30Days')}</SelectItem>
                <SelectItem value="year">{t('dashboard.timeRange.last12Months')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8" onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? t('dashboard.timeRange.refreshing') : t('dashboard.timeRange.refresh')}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { }}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>{t('dashboard.actions.exportData')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { }}>
                  <Filter className="mr-2 h-4 w-4" />
                  <span>{t('dashboard.actions.filterData')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { }}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('dashboard.actions.dashboardSettings')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      }
    >
      <Head title={t('dashboard.title')} />

      <div className="py-4">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Quota Alerts */}
          {(stats.subscription?.sms_quota_low || stats.subscription?.sms_quota_exhausted) && (
            <div className="mb-4">
              {stats.subscription?.sms_quota_low && !stats.subscription?.sms_quota_exhausted && (
                <Alert variant="warning" className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <div>
                      <AlertTitle className="font-medium text-sm">{t('dashboard.alerts.smsQuotaLow')}</AlertTitle>
                      <AlertDescription className="text-xs">
                        <Link href={route('subscription.addons.index')} className="ml-2 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          {t('dashboard.alerts.purchaseAdditional')}
                        </Link>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              {stats.subscription?.sms_quota_exhausted && (
                <Alert variant="destructive" className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    <div>
                      <AlertTitle className="font-medium text-sm">{t('dashboard.alerts.smsQuotaDepleted')}</AlertTitle>
                      <AlertDescription className="text-xs">
                        <Link href={route('subscription.addons.index')} className="ml-2 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          {t('dashboard.alerts.purchaseNow')}
                        </Link>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )}

          {/* KPI Section - Top Stats */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            {/* Subscription Stats */}
            {stats.subscription && (
              <Card className="col-span-4 lg:col-span-2 p-0 h-28">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-semibold">
                      {stats.subscription.plan || 'Free Plan'}
                      {stats.subscription.isFreePlan && (
                        <Badge variant="outline" className="ml-1 text-xs h-4">Free</Badge>
                      )}
                    </CardTitle>
                    <Link
                      href={stats.subscription.isFreePlan ? route('subscription.plans') : route('subscription.index')}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      {stats.subscription.isFreePlan ? 'Upgrade' : 'Manage'}
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>SMS</span>
                        <span>{stats.subscription.sms_used}/{stats.subscription.personal_sms_quota}</span>
                      </div>
                      <Progress value={stats.subscription.sms_usage_percent} className="h-1" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Clients</span>
                        <span>{stats.subscription.clientsCount}/{stats.subscription.clients_limit}</span>
                      </div>
                      <Progress value={(stats.subscription.clientsCount / stats.subscription.clients_limit) * 100} className="h-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KPI Cards */}
            <Card className="col-span-4 lg:col-span-2 p-0 h-28">
              <CardHeader className="pb-0 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium">{t('dashboard.stats.clients')}</CardTitle>
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                <div className="text-lg font-bold">{stats.total_clients}</div>
                {stats.client_stats && (
                  <div className="flex items-center text-xs text-gray-500">
                    {stats.client_stats.growth_is_positive ? (
                      <ArrowUpCircle className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span>{stats.client_stats.growth_rate_formatted}</span>
                  </div>
                )}
                <div className="text-xs mt-1">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                    {stats.trends?.active_clients.rate_formatted || "0%"} active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-4 lg:col-span-2 p-0 h-28">
              <CardHeader className="pb-0 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium">{t('dashboard.stats.messages')}</CardTitle>
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                <div className="text-lg font-bold">{stats.total_messages}</div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{stats.message_stats?.delivery_rate_formatted || "0%"}</span>
                  <span className="ml-1">delivery rate</span>
                </div>
                <div className="grid grid-cols-3 gap-1 w-full mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                    {stats.message_stats?.status_counts.sent || 0} sent
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                    {stats.message_stats?.status_counts.pending || 0} pending
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-6 lg:col-span-3 p-0 h-28">
              <CardHeader className="pb-0 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium">{t('dashboard.stats.campaigns')}</CardTitle>
                  <SendIcon className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                <div className="text-lg font-bold">{stats.total_campaigns}</div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{stats.campaign_stats?.success_rate_formatted || "0%"}</span>
                  <span className="ml-1">success rate</span>
                </div>
                <div className="grid grid-cols-3 gap-1 w-full mt-1">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                    {stats.campaign_stats?.status_counts.draft || 0} draft
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                    {stats.campaign_stats?.status_counts.scheduled || 0} scheduled
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                    {stats.campaign_stats?.status_counts.sent || 0} sent
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-6 lg:col-span-3 p-0 h-28">
              <CardHeader className="pb-0 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium">Engagement</CardTitle>
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 flex">
                <div className="mr-4">
                  <div className="text-lg font-bold">{stats.trends?.engagement.rate_formatted || "0%"}</div>
                  <div className="text-xs text-gray-500">engagement rate</div>
                  <div className="text-xs mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                      {stats.trends?.engagement.engaged_clients || 0} engaged
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">{stats.visit_stats?.total || 0}</div>
                  <div className="flex items-center text-xs text-gray-500">
                    {stats.visit_stats?.growth_is_positive ? (
                      <ArrowUpCircle className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span>{stats.visit_stats?.growth_rate_formatted || "0%"}</span>
                  </div>
                  <div className="text-xs mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                      {stats.visit_stats?.this_month || 0} this month
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content - Without Tabs */}
          <div className="grid grid-cols-12 gap-3">
            {/* Main Activity Chart */}
            <Card className="col-span-12 xl:col-span-8 p-0">
              <CardHeader className="pb-0 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Activity Overview</CardTitle>
                    <CardDescription className="text-xs">Messages and visits over time</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    <span>Export</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[...messageData, ...visitData]}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.accent} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chartColors.accent} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.getDate() + '/' + (date.getMonth() + 1);
                        }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        name="Messages"
                        stroke={chartColors.primary}
                        fillOpacity={1}
                        fill="url(#colorMessages)"
                      />
                      <Area
                        type="monotone"
                        dataKey="visits"
                        name="Visits"
                        stroke={chartColors.accent}
                        fillOpacity={1}
                        fill="url(#colorVisits)"
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Client Tags / Distribution */}
            <Card className="col-span-12 xl:col-span-4 p-0">
              <CardHeader className="pb-0 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-medium">{t('dashboard.charts.clientDistribution')}</CardTitle>
                    <CardDescription className="text-xs">{t('dashboard.charts.segmentationByTags')}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    <span>{t('dashboard.charts.filter')}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientTagData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="count"
                        stroke="#fff"
                        strokeWidth={1}
                      >
                        {clientTagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} clients`, '']}
                        contentStyle={{ fontSize: '10px' }}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        iconSize={6}
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Message & Campaign Stats */}
            <div className="col-span-12 xl:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Message Status Distribution */}
              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{t('dashboard.charts.messageStatus')}</CardTitle>
                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={1}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} messages`, '']}
                          contentStyle={{ fontSize: '10px' }}
                        />
                        <Legend
                          layout="vertical"
                          verticalAlign="bottom"
                          align="center"
                          iconType="circle"
                          iconSize={6}
                          wrapperStyle={{ fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Status Distribution */}
              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{t('dashboard.charts.campaignStatus')}</CardTitle>
                    <SendIcon className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={campaignStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={1}
                        >
                          {campaignStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} campaigns`, '']}
                          contentStyle={{ fontSize: '10px' }}
                        />
                        <Legend
                          layout="vertical"
                          verticalAlign="bottom"
                          align="center"
                          iconType="circle"
                          iconSize={6}
                          wrapperStyle={{ fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Trends */}
              <Card className="md:col-span-2 p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{t('dashboard.charts.campaignTrends')}</CardTitle>
                    <BarChart2 className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={campaignData}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: '10px' }} />
                        <Bar
                          dataKey="campaigns"
                          name="Campaigns"
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        >
                          {campaignData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors.primary} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Upcoming Campaigns */}
            <div className="col-span-12 xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Recent Activity */}
              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{t('dashboard.activity.recentActivity')}</CardTitle>
                    <Link href={route('messages.index')} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center">
                      <span>{t('dashboard.activity.viewAll')}</span>
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-2 pb-2 border-b last:border-0 last:pb-0">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {activity.client.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium">{activity.client.name}</p>
                              <p className="text-xs text-gray-500">{formatTimeSince(activity.date.toString())}</p>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{activity.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-gray-500">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Campaigns */}
              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Upcoming Campaigns</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs flex items-center gap-1 px-2"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {stats.upcoming_campaigns && stats.upcoming_campaigns.length > 0 ? (
                      stats.upcoming_campaigns.map((campaign) => (
                        <div key={campaign.id} className="flex items-start gap-2 pb-2 border-b last:border-0 last:pb-0">
                          <div className="rounded-md h-6 w-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                            <Calendar className="h-3 w-3 text-blue-700 dark:text-blue-400" />
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium">{campaign.name}</p>
                              <p className="text-xs text-gray-500">{formatDate(campaign.scheduled_at)}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {campaign.recipients_count} recipients
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-gray-500">No upcoming campaigns</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Table */}
              <Card className="md:col-span-2 p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Recent Messages</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs flex items-center gap-1 px-2"
                      asChild
                    >
                      <Link href={route('messages.index')}>
                        <span>View All</span>
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-medium h-8 pl-3">Client</TableHead>
                        <TableHead className="text-xs font-medium h-8">Message</TableHead>
                        <TableHead className="text-xs font-medium h-8 pr-3">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recent_messages && stats.recent_messages.length > 0 ? (
                        stats.recent_messages.slice(0, 3).map((message) => (
                          <TableRow key={message.id} className="h-8">
                            <TableCell className="text-xs py-1 pl-3">{message.client.name}</TableCell>
                            <TableCell className="text-xs py-1 max-w-xs truncate">{message.content}</TableCell>
                            <TableCell className="text-xs py-1 pr-3">{formatDate(message.created_at)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-xs text-gray-500">No recent messages</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics Row */}
            <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* SMS Remaining */}
              {stats.subscription && (
                <>
                  <Card className="p-0">
                    <CardHeader className="pb-0 px-3 pt-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xs font-medium">SMS Remaining</CardTitle>
                        <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-1">
                      <div className="text-lg font-bold text-blue-700">
                        {stats.subscription.personal_sms_quota - stats.subscription.sms_used}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((1 - stats.subscription.sms_used / stats.subscription.personal_sms_quota) * 100)}% remaining
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="p-0">
                    <CardHeader className="pb-0 px-3 pt-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xs font-medium">Campaigns Left</CardTitle>
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-1">
                      <div className="text-lg font-bold text-blue-700">
                        {stats.subscription.campaigns_limit - stats.subscription.campaigns_used}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((1 - stats.subscription.campaigns_used / stats.subscription.campaigns_limit) * 100)}% remaining
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-medium">Active Clients</CardTitle>
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1">
                  <div className="text-lg font-bold text-blue-700">
                    {stats.trends?.active_clients.count || 0}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    {stats.trends?.active_clients.trend_is_positive ? (
                      <ArrowUpCircle className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span>{stats.trends?.active_clients.trend_formatted}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-medium">New Clients</CardTitle>
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1">
                  <div className="text-lg font-bold text-blue-700">
                    {stats.client_stats?.new_this_month || 0}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    {stats.client_stats?.growth_is_positive ? (
                      <ArrowUpCircle className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span>{stats.client_stats?.growth_rate_formatted}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-medium">Delivery Rate</CardTitle>
                    <Activity className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1">
                  <div className="text-lg font-bold text-blue-700">
                    {stats.message_stats?.delivery_rate_formatted || "0%"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.message_stats?.status_counts.sent || 0} of {(stats.message_stats?.status_counts.sent || 0) + (stats.message_stats?.status_counts.failed || 0)} messages
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader className="pb-0 px-3 pt-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1">
                  <div className="text-lg font-bold text-blue-700">
                    {stats.campaign_stats?.success_rate_formatted || "0%"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.campaign_stats?.status_counts.sent || 0} successful campaigns
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="col-span-12 flex flex-wrap gap-2 mt-2 justify-center">
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span>New Campaign</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>Manage Clients</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Send Message</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                <span>Export Reports</span>
              </Button>
              {stats.subscription?.isFreePlan && (
                <Button variant="secondary" size="sm" className="flex items-center gap-1">
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  <span>Upgrade Plan</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}