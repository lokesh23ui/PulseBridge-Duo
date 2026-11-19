import React, { useState } from 'react';
import { ThresholdConfig } from '../types/telemetry';
import { Sliders, X, RotateCcw, Save } from 'lucide-react';

interface ThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onSave: (thresholds: ThresholdConfig) => Promise<void>;
}

export const ThresholdsModal: React.FC<ThresholdsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<ThresholdConfig>({ ...thresholds });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof ThresholdConfig, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFormData({
      hr_low: 50.0,
      hr_high_warning: 105.0,
      hr_high_critical: 130.0,
      spo2_low_warning: 92.0,
      spo2_low_critical: 90.0,
      bp_systolic_attention: 140.0,
      bp_systolic_warning: 160.0,
      bp_diastolic_attention: 90.0,
      bp_diastolic_warning: 100.0,
      glucose_attention: 180.0,
      glucose_warning: 250.0,
      temp_skin_warning: 37.8,
      temp_ambient_attention: 38.0,
      min_signal_quality_threshold: 0.40
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Demonstration Threshold Settings</h3>
              <p className="text-xs text-slate-500">Configure physiological parameters and alert limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Heart Rate Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Heart Rate Limits (bpm)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bradycardia Low</label>
                <input
                  type="number"
                  value={formData.hr_low}
                  onChange={e => handleChange('hr_low', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">High Warning</label>
                <input
                  type="number"
                  value={formData.hr_high_warning}
                  onChange={e => handleChange('hr_high_warning', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">High Critical</label>
                <input
                  type="number"
                  value={formData.hr_high_critical}
                  onChange={e => handleChange('hr_high_critical', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SpO2 Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Oxygen Saturation SpO2 (%)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Low Warning Threshold</label>
                <input
                  type="number"
                  value={formData.spo2_low_warning}
                  onChange={e => handleChange('spo2_low_warning', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Critical Hypoxia Threshold</label>
                <input
                  type="number"
                  value={formData.spo2_low_critical}
                  onChange={e => handleChange('spo2_low_critical', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Estimated Blood Pressure & Glucose */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Estimated Biomarkers (Demonstration Placeholders)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Systolic BP High (mmHg)</label>
                <input
                  type="number"
                  value={formData.bp_systolic_attention}
                  onChange={e => handleChange('bp_systolic_attention', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Diastolic BP High (mmHg)</label>
                <input
                  type="number"
                  value={formData.bp_diastolic_attention}
                  onChange={e => handleChange('bp_diastolic_attention', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Glucose High (mg/dL)</label>
                <input
                  type="number"
                  value={formData.glucose_attention}
                  onChange={e => handleChange('glucose_attention', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Thermal & Quality */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Thermal & Quality Limits
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Skin Temp Warning (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temp_skin_warning}
                  onChange={e => handleChange('temp_skin_warning', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ambient Temp High (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temp_ambient_attention}
                  onChange={e => handleChange('temp_ambient_attention', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Min Signal Quality</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.min_signal_quality_threshold}
                  onChange={e => handleChange('min_signal_quality_threshold', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Thresholds'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
