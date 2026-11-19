import React from 'react';
import { DeviceConfiguration } from '../types/telemetry';
import { CircleDot, Watch, Layers } from 'lucide-react';

interface ConfigurationSelectorProps {
  currentConfig: DeviceConfiguration;
  onChange: (config: DeviceConfiguration) => void;
  className?: string;
}

export const ConfigurationSelector: React.FC<ConfigurationSelectorProps> = ({
  currentConfig,
  onChange,
  className = ''
}) => {
  const options: { id: DeviceConfiguration; label: string; icon: any; desc: string }[] = [
    {
      id: 'ring_only',
      label: 'Ring Only',
      icon: CircleDot,
      desc: 'PulseBridge Ring active'
    },
    {
      id: 'watch_only',
      label: 'Watch Only',
      icon: Watch,
      desc: 'PulseBridge Watch active'
    },
    {
      id: 'both',
      label: 'Ring + Watch (Both)',
      icon: Layers,
      desc: 'Dual-wearable active'
    }
  ];

  return (
    <div className={`inline-flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner ${className}`}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = currentConfig === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
