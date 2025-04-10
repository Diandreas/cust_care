import React from 'react';
import { Card, CardContent } from '@/Components/ui/card';
import { uiConfig } from '@/lib/ui-components';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'blue' | 'green' | 'orange' | 'purple' | 'gold';
}

export function StatCard({ icon, value, label, trend, color = 'primary' }: StatCardProps) {
  // Utilisation des variables de couleur du thème centralisé
  const getColorClass = (colorName: string) => {
    switch(colorName) {
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'green': return 'text-green-600 dark:text-green-400';
      case 'orange': return 'text-orange-600 dark:text-orange-400';
      case 'purple': return 'text-purple-600 dark:text-purple-400';
      case 'gold': return 'text-gold-600 dark:text-gold-400';
      default: return 'text-primary';
    }
  };

  const iconColorClass = getColorClass(color);
  const valueColorClass = getColorClass(color);
  const trendIconClass = trend?.isPositive 
    ? 'text-green-500' 
    : 'text-kente-red';

  return (
    <Card className={uiConfig.stats.cardBase}>
      <CardContent className="p-2 flex flex-col items-center text-center">
        <div className={`${uiConfig.stats.icon} ${iconColorClass}`}>
          {icon}
        </div>
        <div className={`${uiConfig.stats.value} ${valueColorClass}`}>
          {value}
        </div>
        <div className={uiConfig.stats.label}>
          {label}
        </div>
        
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <span className={trendIconClass}>
              {trend.isPositive ? '↑' : '↓'}
            </span>
            <span className="ml-1">{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
