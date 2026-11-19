import React, { useState } from 'react';
import { HealthAlert, AlertSeverity } from '../types/telemetry';
import { ShieldAlert, AlertTriangle, Info, Check, CheckCircle2, Trash2, Filter } from 'lucide-react';

interface HealthAlertPanelProps {
  alerts: HealthAlert[];
  onAcknowledge: (alertId: string) => Promise<void>;
  onClearAll?: () => Promise<void>;
}

export const HealthAlertPanel: React.FC<HealthAlertPanelProps> = ({
  alerts,
  onAcknowledge,
  onClearAll
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredAlerts = alerts.filter(alert => {
    if (selectedSeverity === 'ALL') return true;
    return alert.severity === selectedSeverity;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            WARNING
          </span>
        );
      case 'ATTENTION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-600" />
            ATTENTION
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            NORMAL
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Health Risk Alert Engine</h3>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono font-semibold rounded-full">
            {alerts.length} Total
          </span>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-200/60 rounded-xl text-xs font-medium text-slate-600">
            {['ALL', 'CRITICAL', 'WARNING', 'ATTENTION'].map(sev => (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedSeverity === sev
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Clear Active Alerts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 px-6 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="font-medium text-sm text-slate-600">No active alerts triggered</p>
            <p className="text-xs text-slate-400 mt-1">
              All monitored physiological parameters are within configured thresholds.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.alert_id}
              className={`p-4 transition-colors ${
                alert.acknowledged ? 'bg-slate-50/60 opacity-75' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(alert.severity)}
                    <span className="font-bold text-slate-900 text-sm">{alert.parameter}</span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {alert.value} {alert.unit}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-700 mt-1">
                    {alert.rule_triggered}
                  </p>

                  <div className="p-2.5 mt-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Verification Advisory:</strong> {alert.verification_instruction}
                  </div>
                </div>

                {/* Acknowledge Action */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {alert.acknowledged ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(alert.alert_id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {alert.source}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Advisory Banner */}
      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span>Rule-based threshold evaluation</span>
        <span className="text-teal-700 font-medium">Continuous monitoring · Non-clinical evaluation</span>
      </div>
    </div>
  );
};
