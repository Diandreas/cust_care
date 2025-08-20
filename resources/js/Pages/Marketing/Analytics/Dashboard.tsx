import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import {
  BarChart3, TrendingUp, Users, MessageCircle, Eye, 
  Click, Heart, Share, Download, Filter, Calendar,
  Target, Zap, Phone, Mail, Instagram, Facebook
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';

interface AnalyticsData {
  overview: {
    total_campaigns: number;
    total_messages: number;
    total_clients: number;
    engagement_rate: number;
    conversion_rate: number;
    revenue_generated: number;
  };
  performance_data: any[];
  platform_stats: any[];
  campaign_performance: any[];
  client_engagement: any[];
  revenue_trends: any[];
}

interface AnalyticsDashboardProps extends PageProps {
  analytics: AnalyticsData;
  date_range: string;
}

export default function AnalyticsDashboard({ 
  auth, 
  analytics,
  date_range = 'month'
}: AnalyticsDashboardProps) {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState(date_range);
  const [selectedMetric, setSelectedMetric] = useState('engagement');

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const metricOptions = [
    { id: 'engagement', name: 'Engagement', icon: Heart },
    { id: 'reach', name: 'Portée', icon: Eye },
    { id: 'conversions', name: 'Conversions', icon: Target },
    { id: 'revenue', name: 'Revenus', icon: TrendingUp }
  ];

  const platformIcons = {
    whatsapp: Phone,
    email: Mail,
    instagram: Instagram,
    facebook: Facebook,
    sms: MessageCircle
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('marketing.analytics.dashboard.title', 'Analytics Marketing')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Marketing</h1>
              <p className="text-gray-600">Analysez les performances de vos campagnes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
            
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Campagnes Actives</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview.total_campaigns}</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% vs période précédente
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Messages Envoyés</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.overview.total_messages)}</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8% vs période précédente
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taux d'Engagement</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview.engagement_rate}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                        style={{ width: `${analytics.overview.engagement_rate}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenus Générés</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.overview.revenue_generated)}</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +15% vs période précédente
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Graphiques principaux */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Performance dans le temps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Performance des Campagnes
                    </CardTitle>
                    <CardDescription>
                      Évolution des métriques clés sur la période sélectionnée
                    </CardDescription>
                  </div>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metricOptions.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          <div className="flex items-center gap-2">
                            <metric.icon className="w-4 h-4" />
                            {metric.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.performance_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? formatNumber(value) : value,
                          name
                        ]}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="engagement" 
                        stackId="1"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="reach" 
                        stackId="1"
                        stroke="#06b6d4" 
                        fill="#06b6d4"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="conversions" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance par plateforme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Performance par Plateforme
                </CardTitle>
                <CardDescription>
                  Comparaison des résultats par canal de communication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.platform_stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="messages" fill="#8b5cf6" />
                      <Bar dataKey="engagement" fill="#06b6d4" />
                      <Bar dataKey="conversions" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar - Stats détaillées */}
          <div className="space-y-6">
            
            {/* Répartition par plateforme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Répartition Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.platform_stats}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="messages"
                      >
                        {analytics.platform_stats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  {analytics.platform_stats.map((platform, index) => {
                    const Icon = platformIcons[platform.platform as keyof typeof platformIcons] || MessageCircle;
                    return (
                      <div key={platform.platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium capitalize">{platform.platform}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatNumber(platform.messages)}</p>
                          <p className="text-xs text-gray-500">{platform.percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top campagnes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top Campagnes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.campaign_performance.slice(0, 5).map((campaign, index) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{campaign.name}</p>
                          <p className="text-xs text-gray-500">{campaign.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{campaign.engagement_rate}%</p>
                        <p className="text-xs text-gray-500">{formatNumber(campaign.reach)} portée</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métriques temps réel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Temps Réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm">Messages envoyés</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      +23 dernière heure
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm">Interactions IA</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600">
                      +8 dernière heure
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-sm">Nouveaux clients</span>
                    </div>
                    <Badge variant="outline" className="text-purple-600">
                      +5 dernière heure
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      <span className="text-sm">Conversions</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      +2 dernière heure
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Objectifs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Objectifs du Mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Messages</span>
                      <span className="text-sm text-gray-500">8,500 / 10,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Engagement</span>
                      <span className="text-sm text-gray-500">42% / 50%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Revenus</span>
                      <span className="text-sm text-gray-500">€12,500 / €15,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" style={{ width: '83%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}