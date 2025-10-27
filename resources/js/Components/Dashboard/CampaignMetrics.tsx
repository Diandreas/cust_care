import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Progress } from '@/Components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, MessageSquare, Target, Clock,
  Calendar, Eye, MousePointer, Heart, DollarSign, Zap, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CampaignMetricsProps {
  campaigns?: any[];
  className?: string;
}

export default function CampaignMetrics({ campaigns = [], className = '' }: CampaignMetricsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Données réelles basées sur les campagnes
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
  
  // Données réelles de statut
  const statusData = [
    { name: 'Sent', value: sentCampaigns, color: '#10b981' },
    { name: 'Scheduled', value: scheduledCampaigns, color: '#3b82f6' }
  ].filter(item => item.value > 0);
  
  const kpis = [
    {
      title: 'Total',
      value: campaigns.length,
      icon: Calendar,
      color: '#6366f1'
    },
    {
      title: 'Sent', 
      value: sentCampaigns,
      icon: CheckCircle,
      color: '#10b981'
    },
    {
      title: 'Scheduled',
      value: scheduledCampaigns,
      icon: Clock,
      color: '#f59e0b'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Glass KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:border-white/30 transition-all group"
            >
              <div className="flex items-center mb-4">
                <div 
                  className="p-3 rounded-xl backdrop-blur-sm"
                  style={{ backgroundColor: `${kpi.color}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: kpi.color }} />
                </div>
              </div>
              
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:scale-105 transition-transform">
                  {kpi.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {kpi.title}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Glass Charts */}
      <Tabs defaultValue="performance" className="space-y-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-1">
          <TabsList className="grid w-full grid-cols-2 bg-transparent border-0">
            <TabsTrigger value="performance" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-xl">Performance</TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-xl">Status</TabsTrigger>
          </TabsList>
        </div>

        {/* Glass Performance Overview */}
        <TabsContent value="performance">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              Vue d'ensemble
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Campagnes totales</p>
              </div>
              
              <div className="text-center p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{sentCampaigns}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Envoyées</p>
              </div>
              
              <div className="text-center p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{scheduledCampaigns}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Programmées</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Glass Status */}
        <TabsContent value="status">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              Status
            </h3>
            
            <div className="space-y-3">
              {statusData.map((status, index) => (
                <motion.div
                  key={status.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">{status.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{status.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}