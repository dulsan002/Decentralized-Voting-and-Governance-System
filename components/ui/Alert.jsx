import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function Alert({ title, children, variant = 'info', className = '' }) {
  const configs = {
    info: {
      icon: Info,
      style: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300',
    },
    success: {
      icon: CheckCircle2,
      style: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300',
    },
    warning: {
      icon: AlertTriangle,
      style: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300',
    },
    danger: {
      icon: AlertCircle,
      style: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300',
    },
  };

  const config = configs[variant] || configs.info;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.style} text-xs flex items-start space-x-3 ${className}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        {title && <h5 className="font-bold font-display">{title}</h5>}
        <div>{children}</div>
      </div>
    </div>
  );
}
