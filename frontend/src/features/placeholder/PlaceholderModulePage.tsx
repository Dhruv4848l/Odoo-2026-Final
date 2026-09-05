import React from 'react';
import { Card } from '../../components/ui/Card';
import { Clock, DollarSign, LayoutDashboard, Calendar } from 'lucide-react';

interface Props {
  title: string;
  squad: string;
  description: string;
  icon: 'attendance' | 'timeoff' | 'payroll' | 'dashboard';
}

export const PlaceholderModulePage: React.FC<Props> = ({ title, squad, description, icon }) => {
  const icons = {
    attendance: Clock,
    timeoff: Calendar,
    payroll: DollarSign,
    dashboard: LayoutDashboard,
  };

  const IconComponent = icons[icon];

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary-light text-primary rounded-xl">
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="text-sm text-slate">{description}</p>
        </div>
      </div>

      <Card className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-canvas flex items-center justify-center text-primary font-bold text-2xl border border-border">
          {squad[4] || 'S'}
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-bold text-ink">{squad} Owned Module Route</h3>
          <p className="text-xs text-slate mt-1">
            This module route is ready and isolated. When {squad} merges their feature branch, this placeholder will be populated seamlessly without affecting Dev A core HR features.
          </p>
        </div>
      </Card>
    </div>
  );
};
