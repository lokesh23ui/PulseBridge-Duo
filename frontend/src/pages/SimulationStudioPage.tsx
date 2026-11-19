import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { SIMULATION_SCENARIOS, SimulationScenario } from '../types/scenarios';
import { RingCanvas3D } from '../three/RingCanvas3D';
import { WatchCanvas3D } from '../three/WatchCanvas3D';
import { DualDeviceCanvas3D } from '../three/DualDeviceCanvas3D';
import { PPGWaveformOscilloscope } from '../components/PPGWaveformOscilloscope';
import { WokwiPayloadPanel } from '../components/WokwiPayloadPanel';
import { 
  Zap, Play, Pause, RotateCcw, CircleDot, Watch, Layers, 
  Cpu, Activity, ShieldAlert, Sliders, Battery, Wifi, WifiOff, RefreshCw, CheckCircle2, Info
} from 'lucide-react';

export const SimulationStudioPage: React.FC = () => {
  const {
    simulationMode,
    setSimulationMode,
    activeScenarioId,
    activeScenario,
    setScenario,
    isSimulating,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    latestReading,
    dualSnapshot,
    engine,
    injectWokwiPayload,
    toggleDeviceConnection,
    toggleDeviceCharging,
    setUserOverrides
  } = useMonitoring();

  // Watch screen state for simulator interaction (cycles with side crown button)
  const [watchScreenIndex, setWatchScreenIndex] = useState<number>(0);
  const watchScreens = ['CLOCK_VITALS', 'HEART_RATE_GRAPH', 'ACTIVITY_RINGS', 'ALERT_NOTICE'];

  // Local interactive slider overrides
  const [customHR, setCustomHR] = useState<number>(activeScenario.ringHR);
  const [customSpo2, setCustomSpo2] = useState<number>(activeScenario.spo2 ?? 98);
  const [customSignalQuality, setCustomSignalQuality] = useState<number>(activeScenario.signalQualityRing);

  const handleHRChange = (val: number) => {
    setCustomHR(val);
    setUserOverrides({ hr: val });
  };

  const handleSpo2Change = (val: number) => {
    setCustomSpo2(val);
    setUserOverrides({ spo2: val });
  };

  const handleSignalChange = (val: number) => {
    setCustomSignalQuality(val);
    setUserOverrides({ signalQuality: val });
  };

  const handleScenarioSelect = (id: number) => {
    setScenario(id);
    const scen = SIMULATION_SCENARIOS.find(s => s.id === id);
    if (scen) {
      setCustomHR(scen.ringHR);
      setCustomSpo2(scen.spo2 ?? 98);
      setCustomSignalQuality(scen.signalQualityRing);
    }
  };

  const handleWatchCrownClick = () => {
    setWatchScreenIndex((prev) => (prev + 1) % watchScreens.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Title & Global Scenario Controller */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-white shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Zap className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                PulseBridge Simulation Studio
              </h1>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">
              Comprehensive virtual testbed for independent, correlated, and hardware-emulated wearable sensing.
            </p>
          </div>

          {/* Master Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isSimulating ? pauseSimulation : startSimulation}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition ${
                isSimulating ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSimulating ? 'Pause Studio' : 'Resume Studio'}
            </button>
            <button
              type="button"
              onClick={resetSimulation}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset Simulation State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 10-Scenario Dropdown Bar */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-teal-400 mb-1">
              Select Demonstration Scenario (1 of 10)
            </label>
            <select
              value={activeScenarioId}
              onChange={(e) => handleScenarioSelect(parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:ring-2 focus:ring-blue-500"
            >
              {SIMULATION_SCENARIOS.map((scen) => (
                <option key={scen.id} value={scen.id}>
                  Scenario {scen.id}: {scen.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-8 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-slate-200 block">{activeScenario.tagline}</span>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{activeScenario.description}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 ${
              activeScenario.expectedStatus === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              activeScenario.expectedStatus === 'WARNING' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              activeScenario.expectedStatus === 'ATTENTION' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {activeScenario.expectedStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Mode Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ring', label: '1. Smart Ring Simulator', icon: CircleDot },
          { id: 'watch', label: '2. Smartwatch Simulator', icon: Watch },
          { id: 'dual', label: '3. Dual Wearable Simulator', icon: Layers },
          { id: 'wokwi', label: '4. ESP32 / Wokwi Emulation', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = simulationMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSimulationMode(tab.id as any)}
              className={`px-4 py-3 rounded-t-2xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODE 1: SMART RING SIMULATOR */}
      {simulationMode === 'ring' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 3D Ring View */}
            <div className="lg:col-span-6 h-[460px] rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950">
              <RingCanvas3D autoRotate={true} showLabels={true} />
            </div>

            {/* Virtual Ring Device Telemetry Panel */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <CircleDot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Virtual Smart Ring Telemetry</h3>
                    <span className="text-xs font-mono text-slate-500">ID: PB-RING-01 · Nordic nRF5340 BLE</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDeviceConnection('ring')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                      engine.isRingOnline() ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {engine.isRingOnline() ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {engine.isRingOnline() ? 'Online' : 'Disconnected'}
                  </button>
                </div>
              </div>

              {/* Live Metric Readouts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block">Heart Rate</span>
                  <strong className="text-blue-600 text-base">{Math.round(customHR)} bpm</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block">SpO2 Oxygen</span>
                  <strong className={customSpo2 < 90 ? 'text-red-600 text-base' : 'text-teal-600 text-base'}>
                    {customSpo2 ? `${customSpo2}%` : 'null'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block">Skin Temp</span>
                  <strong className="text-amber-600 text-base">36.6 °C</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block">Signal Quality</span>
                  <strong className="text-slate-800 text-base">{Math.round(customSignalQuality * 100)}%</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block">Battery Level</span>
                  <strong className="text-slate-800 text-base">{engine.getRingBattery()}%</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase block">Sampling Rate</span>
                  <strong className="text-slate-800 text-base">100 Hz</strong>
                </div>
              </div>

              {/* Interactive Parameter Sliders */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold font-mono text-slate-600 uppercase tracking-wider">
                  Interactive Optical Parameters
                </h4>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-600">Simulated Heart Rate:</span>
                    <strong className="text-blue-600">{Math.round(customHR)} bpm</strong>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="180"
                    value={customHR}
                    onChange={(e) => handleHRChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-600">Simulated SpO2 Saturation:</span>
                    <strong className={customSpo2 < 90 ? 'text-red-600' : 'text-teal-600'}>{customSpo2}%</strong>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="100"
                    value={customSpo2}
                    onChange={(e) => handleSpo2Change(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-600">Optical Signal Quality (Contact Quality):</span>
                    <strong className="text-slate-800">{Math.round(customSignalQuality * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={customSignalQuality}
                    onChange={(e) => handleSignalChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Synthetic PPG Waveform Oscilloscope */}
          <PPGWaveformOscilloscope
            heartRate={customHR}
            signalQuality={customSignalQuality}
            height={200}
          />
        </div>
      )}

      {/* MODE 2: SMARTWATCH SIMULATOR */}
      {simulationMode === 'watch' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 3D Smartwatch */}
            <div className="lg:col-span-6 h-[460px] rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950">
              <WatchCanvas3D autoRotate={true} showLabels={true} />
            </div>

            {/* Simulated Watch Screen & Digital Crown Interaction */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                    <Watch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Interactive AMOLED Watch Face</h3>
                    <span className="text-xs font-mono text-slate-500">ID: PB-WATCH-01 · 1.4" 454x454 Display</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDeviceConnection('watch')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                      engine.isWatchOnline() ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {engine.isWatchOnline() ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {engine.isWatchOnline() ? 'Online' : 'Disconnected'}
                  </button>
                </div>
              </div>

              {/* Virtual AMOLED Screen Simulation */}
              <div className="p-6 bg-slate-950 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden min-h-[220px]">
                <span className="absolute top-3 left-4 text-[10px] font-mono text-slate-500">
                  SCREEN: {watchScreens[watchScreenIndex]}
                </span>
                <span className="absolute top-3 right-4 text-[10px] font-mono text-emerald-400">
                  {engine.getWatchBattery()}% BAT
                </span>

                {watchScreens[watchScreenIndex] === 'CLOCK_VITALS' && (
                  <div className="space-y-1">
                    <div className="text-4xl font-extrabold font-mono text-white tracking-wider">10:42</div>
                    <div className="text-xs text-sky-400 font-semibold font-mono">
                      ♥ {Math.round(customHR)} BPM · {customSpo2}% SpO2
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">8,420 STEPS · 42% ACTIVITY</div>
                  </div>
                )}

                {watchScreens[watchScreenIndex] === 'HEART_RATE_GRAPH' && (
                  <div className="space-y-2 w-full max-w-[200px]">
                    <span className="text-xs font-mono text-teal-400 font-bold uppercase">Continuous HR Graph</span>
                    <div className="h-14 flex items-end justify-center gap-1.5 pt-2">
                      {[68, 72, 75, 78, 85, 92, 88, 80, 74, customHR].map((val, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${Math.min(100, Math.max(15, (val - 50) * 1.5))}%` }}
                          className="w-3 bg-blue-500 rounded-t-xs"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-white font-bold">{Math.round(customHR)} BPM CURRENT</span>
                  </div>
                )}

                {watchScreens[watchScreenIndex] === 'ACTIVITY_RINGS' && (
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-teal-400 font-mono">Activity Progress</div>
                    <div className="text-2xl font-extrabold text-white font-mono">85% COMPLETE</div>
                    <p className="text-xs text-slate-400">Move: 420 kcal · Exercise: 32 min</p>
                  </div>
                )}

                {watchScreens[watchScreenIndex] === 'ALERT_NOTICE' && (
                  <div className="space-y-1 p-2 bg-red-950/60 rounded-xl border border-red-800/80">
                    <ShieldAlert className="w-5 h-5 text-red-400 mx-auto" />
                    <div className="text-xs font-bold text-red-200">Simulated Health Alert</div>
                    <div className="text-[11px] text-red-300">
                      {customSpo2 < 90 ? `Hypoxia Warning: SpO2 at ${customSpo2}%` : `HR Alert: ${Math.round(customHR)} bpm`}
                    </div>
                  </div>
                )}
              </div>

              {/* Physical Crown Button Simulator Control */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleWatchCrownClick}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Press Virtual Digital Crown (Cycle Screens)
                </button>
              </div>
            </div>
          </div>

          <PPGWaveformOscilloscope
            heartRate={customHR}
            signalQuality={customSignalQuality}
            height={200}
          />
        </div>
      )}

      {/* MODE 3: DUAL WEARABLE SIMULATOR (THE CORE TECHNICAL SHOWCASE) */}
      {simulationMode === 'dual' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Dual 3D Showcase */}
          <DualDeviceCanvas3D autoRotate={true} />

          {/* Mandatory Engineering & Clinical Truth Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-blue-950">Dual Wearable Synchronization Principles:</strong> The dual-device simulation 
              demonstrates coordinated collection and comparison of compatible readings (finger optical microvascular PPG vs wrist optical PPG). 
              It does not establish clinical diagnostic accuracy or prove improved measurement performance without certified medical sensor validation.
            </div>
          </div>

          {/* Side-by-Side Independent Devices Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ring Stream */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-base">PulseBridge Ring Stream</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${
                  engine.isRingOnline() ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {engine.isRingOnline() ? 'Connected' : 'Offline'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Heart Rate</span>
                  <strong className="text-blue-600 text-lg">
                    {dualSnapshot?.ring?.heart_rate_bpm ?? 'No data'} bpm
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Signal Quality</span>
                  <strong className="text-slate-800 text-lg">
                    {dualSnapshot?.ring ? `${Math.round(dualSnapshot.ring.signal_quality * 100)}%` : 'No data'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Skin Temp</span>
                  <strong className="text-amber-600 text-lg">
                    {dualSnapshot?.ring?.temperature_c ?? 'No data'} °C
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Battery</span>
                  <strong className="text-slate-800 text-lg">{engine.getRingBattery()}%</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleDeviceConnection('ring')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                {engine.isRingOnline() ? 'Simulate Ring Disconnect' : 'Reconnect Ring'}
              </button>
            </div>

            {/* Watch Stream */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Watch className="w-5 h-5 text-teal-600" />
                  <h4 className="font-bold text-slate-900 text-base">PulseBridge Watch Stream</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${
                  engine.isWatchOnline() ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {engine.isWatchOnline() ? 'Connected' : 'Offline'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Heart Rate</span>
                  <strong className="text-teal-600 text-lg">
                    {dualSnapshot?.watch?.heart_rate_bpm ?? 'No data'} bpm
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Signal Quality</span>
                  <strong className="text-slate-800 text-lg">
                    {dualSnapshot?.watch ? `${Math.round(dualSnapshot.watch.signal_quality * 100)}%` : 'No data'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Blood Pressure (Est.)</span>
                  <strong className="text-slate-800 text-lg">
                    {dualSnapshot?.watch?.bp_systolic_mmhg ? `${dualSnapshot.watch.bp_systolic_mmhg}/${dualSnapshot.watch.bp_diastolic_mmhg}` : 'No data'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase block">Battery</span>
                  <strong className="text-slate-800 text-lg">{engine.getWatchBattery()}%</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleDeviceConnection('watch')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                {engine.isWatchOnline() ? 'Simulate Watch Disconnect' : 'Reconnect Watch'}
              </button>
            </div>
          </div>

          {/* Divergence & Correlation Status Panel */}
          {dualSnapshot && (
            <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <h4 className="font-bold text-base">Dual-Device Correlation Engine</h4>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {dualSnapshot.readingCompatibility.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {dualSnapshot.notes}
              </p>

              {dualSnapshot.heartRateDiff !== null && (
                <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Heart Rate Delta: <strong className="text-sky-300">Δ {dualSnapshot.heartRateDiff} bpm</strong></span>
                  <span>·</span>
                  <span>Cross-Device Signal Confidence: <strong className="text-emerald-400">Validated</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 4: WOKWI ESP32 HARDWARE EMULATION */}
      {simulationMode === 'wokwi' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <WokwiPayloadPanel onInject={injectWokwiPayload} />
        </div>
      )}
    </div>
  );
};
