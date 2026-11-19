import React, { useState } from 'react';
import { WatchCanvas3D } from '../three/WatchCanvas3D';
import { WATCH_COMPONENTS, DeviceComponent } from '../types/deviceComponents';
import { 
  Watch, Play, Pause, RotateCcw, Eye, Layers, 
  ChevronRight, Sliders, Shield 
} from 'lucide-react';

export const WatchPage: React.FC = () => {
  const [selectedComp, setSelectedComp] = useState<DeviceComponent>(WATCH_COMPONENTS[0]);
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [internalView, setInternalView] = useState<boolean>(false);

  const toggleExploded = () => {
    if (isExploded) {
      setExplodedProgress(0);
      setIsExploded(false);
    } else {
      setExplodedProgress(1);
      setIsExploded(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-mono font-semibold mb-2">
            3D MECHANICAL EXPLORER
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            PulseBridge Smartwatch
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            "More Than a Watch. Your Connected Health Companion." · 15 Addressable Components (W01-W15)
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleExploded}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isExploded ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            {isExploded ? 'Reassemble Watch' : 'Exploded View'}
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs transition ${
              autoRotate ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Toggle Auto Rotation"
          >
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setInternalView(!internalView)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
              internalView ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Toggle Transparent Shell"
          >
            <Eye className="w-4 h-4" />
            {internalView ? 'Opaque Shell' : 'Internal Parts'}
          </button>
        </div>
      </div>

      {/* Main 3D Studio & Component Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Canvas Studio */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[520px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
            <WatchCanvas3D
              selectedComponentId={selectedComp.id}
              onSelectComponent={setSelectedComp}
              explodedProgress={explodedProgress}
              autoRotate={autoRotate}
              internalView={internalView}
              showLabels={true}
            />
          </div>

          {/* Exploded Slider Controls */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <span className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider shrink-0">
              Explosion Expansion: {Math.round(explodedProgress * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedProgress}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setExplodedProgress(val);
                setIsExploded(val > 0.1);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <button
              onClick={() => { setExplodedProgress(0); setIsExploded(false); }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              title="Reset to Assembled"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Component Detail Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-mono font-extrabold text-sm shadow-xs">
                  {selectedComp.canonicalId}
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{selectedComp.name}</h3>
                  <span className="text-xs font-medium text-slate-500 font-mono">{selectedComp.category} Subsystem</span>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                selectedComp.status === 'Implemented' ? 'bg-emerald-100 text-emerald-800' :
                selectedComp.status === 'Simulated' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {selectedComp.status.toUpperCase()}
              </span>
            </div>

            {/* Purpose */}
            <div>
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">
                Subsystem Purpose
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                {selectedComp.purpose}
              </p>
            </div>

            {/* Technical Specification */}
            <div>
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">
                Technical Architecture & Materials
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono">
                {selectedComp.technicalDescription}
              </p>
            </div>

            {/* Physical Location */}
            <div>
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">
                Mechanical Integration Location
              </h4>
              <p className="text-slate-600 text-xs">
                {selectedComp.physicalLocation}
              </p>
            </div>

            {/* Supported Readings */}
            <div>
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                Supported Telemetry & Metrics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedComp.supportedReadings.map((reading, i) => (
                  <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200/60 rounded-lg text-xs font-medium">
                    {reading}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Component Catalog Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              Watch Component Hierarchy (Click to Select)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {WATCH_COMPONENTS.map(comp => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedComp(comp)}
                  className={`p-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition ${
                    selectedComp.id === comp.id
                      ? 'bg-teal-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="font-mono">{comp.canonicalId}</span>
                  <span className="truncate max-w-[130px]">{comp.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
