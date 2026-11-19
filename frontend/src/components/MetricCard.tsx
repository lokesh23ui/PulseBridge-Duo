import React from 'react';
import { AlertSeverity } from '../types/telemetry';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value?: number | string | null;
  unit: string;
  status?: AlertSeverity;
  statusLabel?: string;
  sourceBadge?: string;
  isSimulated?: boolean;
  isEstimate?: boolean;
  signalQuality?: number | null;
  history?: (number | null)[];
  icon?: any;
  trendText?: string;
  timestamp?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  status = 'NORMAL',
  statusLabel,
  sourceBadge = 'PREVIEW',
  isSimulated = true,
  isEstimate = false,
  signalQuality,
  history = [],
  icon: Icon,
  trendText,
  timestamp,
  className = ''
}) => {
  // Determine status color styles
  const getStatusStyles = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          border: 'border-red-500/60',
          bg: 'bg-red-500/5',
          text: 'text-red-500',
          badge: 'bg-red-500/10 text-red-600 border-red-500/20',
          icon: ShieldAlert
        };
      case 'WARNING':
        return {
          border: 'border-orange-500/50',
          bg: 'bg-orange-500/5',
          text: 'text-orange-500',
          badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
          icon: AlertTriangle
        };
      case 'ATTENTION':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/5',
          text: 'text-amber-500',
          badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          icon: Info
        };
      case 'NORMAL':
      default:
        return {
          border: 'border-slate-200',
          bg: 'bg-white',
          text: 'text-emerald-500',
          badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
          icon: CheckCircle
        };
    }
  };

  const style = getStatusStyles();
  const StatusIcon = style.icon;

  // Filter valid numbers for sparkline SVG path
  const validHistory = history.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  
  // Generate SVG Sparkline Path
  const renderSparkline = () => {
    if (validHistory.length < 2) return null;
    const width = 120;
    const height = 36;
    const min = Math.min(...validHistory);
    const max = Math.max(...validHistory);
    const range = max - min || 1;

    const points = validHistory.map((val, idx) => {
      const x = (idx / (validHistory.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={status === 'CRITICAL' ? '#dc2626' : status === 'WARNING' ? '#ea580c' : '#0284c7'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div className={`p-5 rounded-2xl border ${style.border} ${style.bg} shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${className}`}>
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h3 className="font-semibold text-slate-800 text-sm tracking-tight">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {isEstimate && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">
                ESTIMATE
              </span>
            )}
            {isSimulated && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-50 text-sky-700 border border-sky-200">
                {sourceBadge}
              </span>
            )}
          </div>
        </div>

        {/* Value Display */}
        <div className="mt-3 flex items-baseline justify-between">
          {hasValue ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {value}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase">{unit}</span>
            </div>
          ) : (
            <div className="py-1">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-mono font-medium">
                No data
              </span>
            </div>
          )}

          {/* Sparkline Graph */}
          {hasValue && (
            <div className="opacity-90 pl-2">
              {renderSparkline()}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`w-3.5 h-3.5 ${style.text}`} />
          <span className="font-medium text-slate-700">
            {statusLabel || (hasValue ? 'Within configured range' : 'Sensor offline')}
          </span>
        </div>

        {signalQuality !== undefined && signalQuality !== null && (
          <span className="font-mono text-[10px]">
            Signal: <strong className={signalQuality >= 0.7 ? 'text-teal-600' : 'text-amber-600'}>{Math.round(signalQuality * 100)}%</strong>
          </span>
        )}
      </div>
    </div>
  );
};
