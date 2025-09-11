import React from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface SimpleCampaignStatsProps {
  campaigns?: any[];
  className?: string;
}

export default function SimpleCampaignStats({ campaigns = [], className = '' }: SimpleCampaignStatsProps) {
  const sentCount = campaigns.filter(c => c.status === 'sent').length;
  const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length;
  
  const stats = [
    {
      icon: Calendar,
      value: campaigns.length,
      color: '#6366f1'
    },
    {
      icon: CheckCircle,
      value: sentCount,
      color: '#10b981'
    },
    {
      icon: Clock,
      value: scheduledCount,
      color: '#f59e0b'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Liquid Glass Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 rounded-2xl p-6 group cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r opacity-10 rounded-2xl"></div>
              
              <div className="relative z-10 text-center">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon 
                    className="w-8 h-8 transition-all duration-300 group-hover:rotate-12" 
                    style={{ color: stat.color }} 
                  />
                </div>
                
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Simple Overview */}
      {campaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/20 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r opacity-5 rounded-2xl"></div>
          
          <div className="relative z-10">
            <div className="text-lg font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Campaign Overview
            </div>
            <div className="mt-4 flex justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-semibold text-green-600">{sentCount}</span> sent
              </div>
              <div>
                <span className="font-semibold text-blue-600">{scheduledCount}</span> scheduled
              </div>
              <div>
                <span className="font-semibold text-gray-600">{campaigns.length - sentCount - scheduledCount}</span> draft
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}