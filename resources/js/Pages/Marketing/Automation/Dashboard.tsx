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
import { Progress } from '@/Components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/Components/ui/table";
import { Switch } from "@/Components/ui/switch";
import {
  Zap, Calendar, MessageCircle, Users, TrendingUp, Clock,
  Play, Pause, Settings, Plus, Edit, Trash2, BarChart3,
  Gift, Heart, ShoppingBag, AlertTriangle, CheckCircle2,
  Timer, Send, Target, Sparkles, Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: 'birthday' | 'anniversary' | 'seasonal' | 'inactivity' | 'purchase';
  status: 'active' | 'paused' | 'draft';
  executions: number;
  success_rate: number;
  last_executed: string;
  next_execution: string;
  description: string;
}

interface AutomationStats {
  total_rules: number;
  active_rules: number;
  total_executions: number;
  success_rate: number;
  messages_sent: number;
  clients_reached: number;
  revenue_generated: number;
}

interface AutomationDashboardProps extends PageProps {
  automation_rules: AutomationRule[];
  stats: AutomationStats;
  performance_data: any[];
  upcoming_executions: any[];
}

export default function AutomationDashboard({ 
  auth, 
  automation_rules = [],
  stats,
  performance_data = [],
  upcoming_executions = []
}: AutomationDashboardProps) {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const automationTypes = [
    {
      type: 'birthday',
      name: 'Anniversaires',
      icon: Gift,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      description: 'Messages automatiques d\'anniversaire'
    },
    {
      type: 'seasonal',
      name: 'Saisonniers',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Campagnes pour événements spéciaux'
    },
    {
      type: 'inactivity',
      name: 'Réactivation',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Récupération clients inactifs'
    },
    {
      type: 'purchase',
      name: 'Achat',
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Suivi post-achat'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'paused': return 'En pause';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const response = await fetch(`/marketing/automation/rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Recharger la page ou mettre à jour l'état local
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur toggle règle:', error);
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('marketing.automation.dashboard.title', 'Automatisation Marketing')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automatisation Marketing</h1>
              <p className="text-gray-600">Gérez vos campagnes automatiques et analysez les performances</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
              </SelectContent>
            </Select>
            
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Règle
            </Button>
          </div>
        </div>

        {/* Stats principales */}
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
                    <p className="text-sm font-medium text-gray-600">Règles Actives</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.active_rules}</p>
                    <p className="text-sm text-gray-500">sur {stats.total_rules} règles</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Zap className="w-6 h-6 text-green-600" />
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
                    <p className="text-3xl font-bold text-gray-900">{stats.messages_sent.toLocaleString()}</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% vs période précédente
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600">Taux de Succès</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.success_rate}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                        style={{ width: `${stats.success_rate}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-600">Clients Touchés</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.clients_reached.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">clients uniques</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Liste des règles d'automatisation */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Règles d'Automatisation
                </CardTitle>
                <CardDescription>
                  Gérez vos campagnes automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automation_rules.map((rule, index) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          automationTypes.find(t => t.type === rule.trigger_type)?.bgColor || 'bg-gray-100'
                        )}>
                          {React.createElement(
                            automationTypes.find(t => t.type === rule.trigger_type)?.icon || Calendar,
                            { 
                              className: cn(
                                "w-5 h-5",
                                automationTypes.find(t => t.type === rule.trigger_type)?.color || 'text-gray-600'
                              )
                            }
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                rule.status === 'active' ? 'border-green-200 text-green-700' :
                                rule.status === 'paused' ? 'border-yellow-200 text-yellow-700' :
                                'border-gray-200 text-gray-700'
                              )}
                            >
                              <div className={cn("w-1.5 h-1.5 rounded-full mr-1", getStatusColor(rule.status))} />
                              {getStatusText(rule.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Send className="w-3 h-3" />
                              {rule.executions} exécutions
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {rule.success_rate}% succès
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {rule.next_execution ? `Prochaine: ${new Date(rule.next_execution).toLocaleDateString('fr-FR')}` : 'Pas programmée'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.status === 'active'}
                          onCheckedChange={() => toggleRuleStatus(rule.id, rule.status)}
                        />
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {automation_rules.length === 0 && (
                    <div className="text-center py-8">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Aucune règle d'automatisation
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Créez votre première règle pour automatiser vos campagnes marketing
                      </p>
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Créer une Règle
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Prochaines exécutions et stats */}
          <div className="space-y-6">
            
            {/* Prochaines exécutions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-600" />
                  Prochaines Exécutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcoming_executions.slice(0, 5).map((execution, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 rounded">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{execution.rule_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(execution.scheduled_at).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(execution.scheduled_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {execution.client_count} clients
                      </Badge>
                    </div>
                  ))}
                  
                  {upcoming_executions.length === 0 && (
                    <div className="text-center py-4">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucune exécution programmée</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Types d'automatisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Types d'Automatisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {automationTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", type.bgColor)}>
                          <type.icon className={cn("w-4 h-4", type.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{type.name}</p>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performance_data.length > 0 ? (
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performance_data}>
                        <Line 
                          type="monotone" 
                          dataKey="success_rate" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Tooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Pas encore de données</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}