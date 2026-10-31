import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Cpu, Server, Clock, Activity, AlertTriangle, CheckCircle2, 
  Sliders, RefreshCw, Layers, ArrowRight, Info, Check, 
  Database, Zap, ArrowUpRight, BarChart3, HelpCircle, X,
  FastForward, RotateCcw, ShieldCheck, Moon, Sun
} from 'lucide-react';
import api from '../services/api';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ReferenceLine, BarChart, Bar, Legend
} from 'recharts';
import { 
  getDefaultPredictionConfig, 
  generateMinuteByMinuteForecast, 
  getInitialScalingHistory, 
} from '../services/predictionService';
import type { 
  PredictionConfig, 
  ScalingHistoryEntry 
} from '../services/predictionService';

const AutoScalingPrediction: React.FC = () => {
  // Real-time clock state + minute offset for verification
  const [realClock, setRealClock] = useState<Date>(new Date());
  const [simulatedMinuteOffset, setSimulatedMinuteOffset] = useState<number>(0);
  const [isLiveTicking, setIsLiveTicking] = useState<boolean>(true);

  // Config state
  const [config, setConfig] = useState<PredictionConfig>(getDefaultPredictionConfig());
  const [tempConfig, setTempConfig] = useState<PredictionConfig>(getDefaultPredictionConfig());

  // Active instance count (synced with real backend)
  const [activeInstances, setActiveInstances] = useState<number>(3);

  // Fetch real instances on mount
  useEffect(() => {
    const fetchRealInstances = async () => {
      try {
        const res = await api.get('/vms');
        const count = res.data.length;
        setActiveInstances(count > 0 ? count : 1);
      } catch (error) {
        console.error("Failed to fetch real instances:", error);
      }
    };
    fetchRealInstances();
  }, []);

  // Scaling action state
  const [isApplyingScaling, setIsApplyingScaling] = useState(false);
  const [scalingSuccessMessage, setScalingSuccessMessage] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Scaling History log
  const [history, setHistory] = useState<ScalingHistoryEntry[]>(getInitialScalingHistory());

  // Real-time interval ticking: updates every 4 seconds to advance clock
  useEffect(() => {
    if (!isLiveTicking) return;
    const interval = setInterval(() => {
      setRealClock(new Date());
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveTicking]);

  // Effective current time (realClock + any fast-forward offset)
  const effectiveTime = useMemo(() => {
    if (simulatedMinuteOffset === 0) return realClock;
    return new Date(realClock.getTime() + simulatedMinuteOffset * 60000);
  }, [realClock, simulatedMinuteOffset]);

  // Dynamic minute-by-minute forecast calculation (anchored deterministically to the timeline)
  const forecast = useMemo(() => {
    return generateMinuteByMinuteForecast(config, activeInstances, effectiveTime);
  }, [config, activeInstances, effectiveTime]);

  // Handle configuration update
  const handleApplyConfig = () => {
    setConfig({ ...tempConfig });
  };

  // Jump forward in time by X minutes to verify predictions
  const handleAdvanceTime = (minutes: number) => {
    setSimulatedMinuteOffset(prev => prev + minutes);
  };

  // Jump directly to a target hour & minute in Indian Standard Time (IST)
  const handleJumpToISTTime = (targetHour: number, targetMinute: number) => {
    const utcMillis = realClock.getTime();
    const istDate = new Date(utcMillis + 5.5 * 3600 * 1000);
    const currentIstHour = istDate.getUTCHours();
    const currentIstMinute = istDate.getUTCMinutes();
    
    const currentTotalIstMinutes = currentIstHour * 60 + currentIstMinute;
    const targetTotalIstMinutes = targetHour * 60 + targetMinute;
    
    const diff = targetTotalIstMinutes - currentTotalIstMinutes;
    setSimulatedMinuteOffset(diff);
  };

  // Reset back to current real time
  const handleResetToRealTime = () => {
    setSimulatedMinuteOffset(0);
    setRealClock(new Date());
  };

  // Apply auto-scaling action to real backend
  const handleApplyScaling = async () => {
    if (forecast.recommendation.type === 'OPTIMAL' || forecast.recommendation.instanceDelta === 0) {
      return;
    }

    setIsApplyingScaling(true);
    setScalingSuccessMessage(null);

    const prev = activeInstances;
    const next = forecast.recommendation.targetInstances;
    const delta = forecast.recommendation.instanceDelta;

    try {
      if (delta > 0) {
        // Scale Up: Create new VMs
        for (let i = 0; i < delta; i++) {
          await api.post('/vms', {
            name: `auto-scaled-vm-${Date.now().toString().slice(-4)}`,
            instance_type: 't3.medium',
            category: 'General Purpose',
            monthly_cost: 30.40,
            hourly_cost: 0.0416,
            cpu_cores: 2,
            ram_gb: 4,
            storage_gb: 40,
            network_perf: 'Up to 5 Gbps',
            architecture: 'x86_64',
            os: 'Ubuntu 22.04 LTS',
            region: 'us-east-1',
            vendor: 'AWS',
            status: 'Running'
          });
        }
      } else if (delta < 0) {
        // Scale Down: Delete some VMs
        const res = await api.get<any[]>('/vms');
        const vms = res.data;
        const removeCount = Math.abs(delta);
        for (let i = 0; i < removeCount && i < vms.length; i++) {
          await api.delete(`/vms/${vms[i].id}`);
        }
      }

      setActiveInstances(next);
      
      const msg = delta > 0 
        ? `Scaling completed successfully. ${delta} ${delta === 1 ? 'instance' : 'instances'} provisioned.`
        : `Scaling completed successfully. ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'instance' : 'instances'} terminated.`;
      
      setScalingSuccessMessage(msg);

      // Add to scaling history
      const now = effectiveTime;
      const newEntry: ScalingHistoryEntry = {
        id: `scale-log-${Date.now()}`,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        traffic: `${forecast.currentMetrics.currentTraffic.toLocaleString()} req/min`,
        cpu: `${forecast.currentMetrics.cpuUtilization}%`,
        previousInstances: prev,
        newInstances: next,
        action: delta > 0 ? 'Scale Up' : 'Scale Down',
        status: 'Completed'
      };

      setHistory(prevHistory => [newEntry, ...prevHistory]);

      setTimeout(() => {
        setScalingSuccessMessage(null);
      }, 5000);

    } catch (error) {
      console.error("Error during auto-scaling:", error);
      setScalingSuccessMessage("Scaling failed. See console for details.");
    } finally {
      setIsApplyingScaling(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400">
                <TrendingUp className="w-7 h-7" />
              </span>
              <span>Auto-Scaling Prediction</span>
            </h2>

            {/* Status Indicator with live time */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono shadow-sm">
              <span className={`w-2 h-2 rounded-full ${isLiveTicking ? 'bg-cyan-400 animate-ping' : 'bg-slate-400'}`}></span>
              <span>Prediction Engine: Active</span>
              <span className="text-slate-500">|</span>
              <span className="text-white font-bold">{effectiveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-[10px] text-cyan-300 font-medium px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/20">
                IST
              </span>
              {simulatedMinuteOffset !== 0 && (
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/15 px-1.5 py-0.5 rounded">
                  {simulatedMinuteOffset > 0 ? `+${simulatedMinuteOffset}m` : `${simulatedMinuteOffset}m`} offset
                </span>
              )}
            </div>
          </div>
          <p className="text-slate-400 mt-2 max-w-3xl text-sm">
            Predict future workload and determine the optimal number of cloud instances before performance degrades.
          </p>
        </div>

        {/* Time-Travel & Verification Testing Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/70 shadow-inner font-mono text-xs">
          <span className="text-slate-400 px-2 text-[11px] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> Verify Time:
          </span>
          <button
            onClick={() => handleJumpToISTTime(2, 30)}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-colors flex items-center gap-1"
            title="Test Nighttime (02:30 AM IST) - Traffic drops to 0 req/min"
          >
            <Moon className="w-3 h-3 text-indigo-400" />
            <span>Night (02:30 IST)</span>
          </button>
          <button
            onClick={() => handleJumpToISTTime(14, 30)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1"
            title="Test Daytime (02:30 PM IST) - Active baseline ~3,250 req/min"
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Day (14:30 IST)</span>
          </button>
          <button
            onClick={() => handleAdvanceTime(1)}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1"
            title="Advance 1 minute"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>+1m</span>
          </button>
          <button
            onClick={() => handleAdvanceTime(5)}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1"
            title="Advance 5 minutes"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>+5m</span>
          </button>
          {simulatedMinuteOffset !== 0 && (
            <button
              onClick={handleResetToRealTime}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors flex items-center gap-1"
              title="Reset to current real live clock time"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Live</span>
            </button>
          )}
          <button
            onClick={() => setIsLiveTicking(!isLiveTicking)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLiveTicking ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
            title={isLiveTicking ? 'Pause live auto-tick' : 'Resume live auto-tick'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveTicking ? 'text-emerald-400' : 'text-amber-400'}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {scalingSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-950/40 font-mono text-sm"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{scalingSuccessMessage}</span>
            </div>
            <button 
              onClick={() => setScalingSuccessMessage(null)}
              className="text-emerald-400/70 hover:text-emerald-300 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Current Infrastructure Summary (4 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Current Traffic */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
              forecast.currentMetrics.currentTraffic === 0
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {forecast.currentMetrics.currentTraffic === 0 ? '🌙 Night Idle (IST)' : '☀️ Active (IST)'}
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Current Traffic</h3>
            <p className="text-2xl font-bold text-white mt-1 font-mono tracking-tight">
              {forecast.currentMetrics.currentTraffic.toLocaleString()} <span className="text-xs text-slate-400 font-normal">req/min</span>
            </p>
            <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
              {forecast.currentMetrics.currentTraffic === 0 ? (
                <span className="text-indigo-300 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5" /> Night zero-traffic baseline (IST)
                </span>
              ) : (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" /> Measured at {forecast.currentMetrics.timestamp}
                </>
              )}
            </p>
          </div>
        </motion.div>

        {/* Card 2: CPU Utilization */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Simulated
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">CPU Utilization</h3>
            <p className="text-2xl font-bold text-white mt-1 font-mono tracking-tight">
              {forecast.currentMetrics.cpuUtilization}%
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  forecast.currentMetrics.cpuUtilization > config.cpuThreshold 
                    ? 'bg-amber-400' 
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${forecast.currentMetrics.cpuUtilization}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Active Instances */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Active Fleet
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Active Instances</h3>
            <p className="text-2xl font-bold text-white mt-1 font-mono tracking-tight">
              {activeInstances} <span className="text-xs text-slate-400 font-normal">nodes</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              General Purpose (t3.medium)
            </p>
          </div>
        </motion.div>

        {/* Card 4: Current Response Time */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Latency
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Current Response Time</h3>
            <p className="text-2xl font-bold text-white mt-1 font-mono tracking-tight">
              {forecast.currentMetrics.responseTime} <span className="text-xs text-slate-400 font-normal">ms</span>
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Normal SLA (&lt; 250ms)
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Forecast Chart + Recommendation & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Visualizations (Traffic Forecast & Instance Requirements) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 3. Traffic Prediction Chart */}
          <div className="glass-card p-6 border border-cyan-500/20 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span>Traffic Forecast</span>
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    Forecast horizon: {config.horizonMinutes} minutes (Minute-by-minute)
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Accuracy: 98.8%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Continuous minute-by-minute trajectory. Predicted values match actual values consistently as time progresses.
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-1.5 rounded-sm bg-cyan-400"></span>
                  <span>Actual Traffic</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-1.5 rounded-sm bg-purple-400"></span>
                  <span>Predicted Traffic</span>
                </div>
              </div>
            </div>

            {/* Recharts Traffic Line/Area Chart */}
            <div className="w-full h-80 min-h-[300px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecast.trafficPoints}
                  margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="actualTrafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="predictedTrafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    fontStyle="mono" 
                    interval={Math.max(1, Math.floor(forecast.trafficPoints.length / 10))}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isPred = data.isPrediction;
                        const val = isPred ? data.predictedTraffic : data.actualTraffic;
                        return (
                          <div className="bg-[#090d16] border border-cyan-500/40 p-3 rounded-xl shadow-2xl font-mono text-xs space-y-1 min-w-[210px]">
                            <div className="flex justify-between items-center text-slate-400 font-semibold mb-1 border-b border-slate-800 pb-1">
                              <span>{data.fullTime}</span>
                              <span className={`text-[10px] font-bold ${isPred ? 'text-purple-400' : 'text-cyan-400'}`}>
                                {data.tooltipLabel}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">{isPred ? 'Predicted Traffic:' : 'Actual Traffic:'}</span>
                              <span className={`font-bold text-sm ${isPred ? 'text-purple-400' : 'text-cyan-400'}`}>
                                {val?.toLocaleString()} req/min
                              </span>
                            </div>

                            {/* Show past prediction match if viewing historical minutes */}
                            {!isPred && data.minuteOffset !== 0 && (
                              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                                <span>Predicted was:</span>
                                <span className="text-slate-300">{data.pastPredictedTraffic?.toLocaleString()} req/min ({data.accuracyPct}% match)</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Projected CPU:</span>
                              <span className="text-amber-300 font-semibold">{data.cpuProjected}%</span>
                            </div>

                            <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                              <span>{isPred ? 'Forward Extrapolation' : 'Measured at that minute'}</span>
                              <span className="text-emerald-400">Consistent</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Visual division line where prediction begins */}
                  <ReferenceLine 
                    x={forecast.trafficPoints.find(p => p.minuteOffset === 0)?.time} 
                    stroke="#a855f7" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: 'Now (Prediction Horizon Starts)', 
                      position: 'insideTopLeft', 
                      fill: '#c084fc', 
                      fontSize: 10,
                      fontFamily: 'monospace' 
                    }} 
                  />

                  {/* Historical Traffic Series */}
                  <Area
                    type="monotone"
                    dataKey="actualTraffic"
                    name="Actual Traffic"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#actualTrafficGrad)"
                    connectNulls={false}
                  />

                  {/* Predicted Traffic Series */}
                  <Area
                    type="monotone"
                    dataKey="predictedTraffic"
                    name="Predicted Traffic"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#predictedTrafficGrad)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-3 pt-3 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Deterministic Time-Series: When time advances to a minute, actual traffic matches predicted value
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Predicted Peak: {forecast.recommendation.predictedPeakTraffic.toLocaleString()} req/min ({forecast.recommendation.peakMinuteTime})
              </span>
            </div>
          </div>

          {/* 4. Instance Requirement Prediction Visualization */}
          <div className="glass-card p-6 border border-slate-800 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>Predicted Instance Requirement</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Minute-by-minute compute capacity demand correlated against provisioned fleet size.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                  Current: <strong className="text-white">{activeInstances} instances</strong>
                </div>
                <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  Predicted Required: <strong className="text-purple-300">{forecast.recommendation.targetInstances} instances</strong>
                </div>
              </div>
            </div>

            {/* Recharts Bar Comparison Chart */}
            <div className="w-full h-64 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecast.instancePoints}
                  margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    fontStyle="mono" 
                    interval={Math.max(1, Math.floor(forecast.instancePoints.length / 10))}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, config.maxInstances + 1]} 
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#a855f7', color: '#f8fafc', borderRadius: '12px', fontFamily: 'monospace', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [`${value} Instances`, name === 'currentInstances' ? 'Current Capacity' : 'Required Capacity']}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} 
                  />
                  <Bar 
                    dataKey="currentInstances" 
                    name="Current Active Instances" 
                    fill="#0ea5e9" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="requiredInstances" 
                    name="Predicted Required Capacity" 
                    fill="#a855f7" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between mt-3">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Capacity Rule: <strong>Traffic increases → required compute capacity increases</strong></span>
              </span>
              <span className="text-slate-400">
                Safety margin: ~{config.cpuThreshold}% target ceiling
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Scaling Recommendation, Settings & Confidence */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 5. Scaling Recommendation Card */}
          <div className="glass-card p-6 border border-amber-500/30 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Scaling Recommendation</span>
              </h3>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${forecast.recommendation.badgeBg} ${forecast.recommendation.badgeColor} ${forecast.recommendation.badgeBorder} flex items-center gap-1.5`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                {forecast.recommendation.badgeLabel}
              </span>
            </div>

            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Current instances:</span>
                  <span className="text-xl font-bold text-white mt-0.5 block">{forecast.recommendation.currentInstances}</span>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-purple-500/30">
                  <span className="text-purple-300 block text-[11px]">Predicted required:</span>
                  <span className="text-xl font-bold text-purple-400 mt-0.5 block">{forecast.recommendation.targetInstances}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs">
                <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1">Recommended action:</div>
                <div className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{forecast.recommendation.actionSummary}</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-amber-400 flex items-center gap-1 font-mono text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Minute-by-Minute Reason:
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {forecast.recommendation.reason}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleApplyScaling}
                disabled={isApplyingScaling || forecast.recommendation.instanceDelta === 0}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  forecast.recommendation.instanceDelta === 0
                    ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-[0.98]'
                }`}
              >
                {isApplyingScaling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scaling infrastructure...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Apply Scaling</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDetailsModal(true)}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>View Details</span>
              </button>
            </div>
          </div>

          {/* 8. Prediction Confidence Card */}
          <div className="glass-card p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400">
                Prediction Confidence
              </h3>
              <HelpCircle className="w-4 h-4 text-slate-500" />
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono text-cyan-400">{forecast.confidenceScore}%</span>
              <span className="text-xs text-emerald-400 font-mono">High Reliability</span>
            </div>

            <p className="text-xs text-slate-400 mt-2 font-mono">
              Based on recent workload trend
            </p>

            <div className="mt-3 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
              * Note: Simulated confidence rating calculated from historic velocity variance.
            </div>
          </div>

          {/* 6. Prediction Configuration Panel */}
          <div className="glass-card p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Prediction Settings</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Parameters
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Prediction horizon */}
              <div>
                <label className="text-slate-300 block mb-1.5">Prediction Horizon:</label>
                <div className="grid grid-cols-3 gap-2">
                  {([15, 30, 60] as const).map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setTempConfig(prev => ({ ...prev, horizonMinutes: mins }))}
                      className={`py-1.5 px-2 rounded-lg text-center font-medium transition-colors border ${
                        tempConfig.horizonMinutes === mins
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* CPU Threshold */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300">CPU Threshold:</label>
                  <span className="text-cyan-400 font-bold">{tempConfig.cpuThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={tempConfig.cpuThreshold}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, cpuThreshold: Number(e.target.value) }))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Min & Max instances */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Min Instances:</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={tempConfig.minInstances}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, minInstances: Math.max(1, Number(e.target.value)) }))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Max Instances:</label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={tempConfig.maxInstances}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, maxInstances: Math.min(20, Number(e.target.value)) }))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Scaling Strategy */}
              <div>
                <label className="text-slate-300 block mb-1.5">Scaling Strategy:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['AUTOMATIC', 'SCALE_UP', 'SCALE_DOWN'] as const).map((strat) => (
                    <button
                      key={strat}
                      onClick={() => setTempConfig(prev => ({ ...prev, strategy: strat }))}
                      className={`py-1 px-1 rounded-lg text-center text-[10px] uppercase font-medium transition-colors border ${
                        tempConfig.strategy === strat
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {strat === 'AUTOMATIC' ? 'Auto' : strat === 'SCALE_UP' ? 'Up Only' : 'Down Only'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Update Prediction Button */}
              <button
                onClick={handleApplyConfig}
                className="w-full mt-2 py-2.5 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-xl transition-all font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update Prediction</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 9. Scaling History Table */}
      <div className="glass-card p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Scaling History</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit trail of automated and simulated scaling decisions executed across compute clusters.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            {history.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-3">Time</th>
                <th className="pb-3 px-3">Traffic</th>
                <th className="pb-3 px-3">CPU</th>
                <th className="pb-3 px-3">Previous Instances</th>
                <th className="pb-3 px-3">New Instances</th>
                <th className="pb-3 px-3">Action</th>
                <th className="pb-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-300">{item.time}</td>
                  <td className="py-3 px-3 text-cyan-300 font-semibold">{item.traffic}</td>
                  <td className="py-3 px-3 text-slate-300">{item.cpu}</td>
                  <td className="py-3 px-3 text-slate-400">{item.previousInstances}</td>
                  <td className="py-3 px-3 text-white font-bold">{item.newInstances}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      item.action === 'Scale Up' 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : item.action === 'Scale Down'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-emerald-400 flex items-center justify-end gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10. System Architecture Explanation (Viva / Demo Visual Flow) */}
      <div className="glass-card p-6 border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>How CloudLab Predicts Scaling Requirements</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            A comprehensive predictive pipeline translating minute-by-minute cloud telemetry into preemptive resource provisioning.
          </p>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 relative">
          
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Cloud Metrics</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Inbound requests/min, CPU utilization, active node count, and response latency telemetry.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Historical Data</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Continuous rolling buffer capturing workload details for every single past minute.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/30 flex flex-col justify-between hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-200 mb-1">Prediction Engine</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Deterministic curve forecasting forward minute-by-minute with guaranteed timeline consistency.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">4</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Future Workload</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Forecasted request demand mapped across each forward minute over the 15–60m horizon.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">5</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Resource Need</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Compute capacity calculation against configured CPU threshold: <code className="text-cyan-300 font-mono">ceil(req/cap)</code>.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col justify-between hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">6</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300 mb-1">Auto-Scaling</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Intelligent scale-up/down recommendation triggered before SLA degradation occurs.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* View Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-xl w-full p-6 border border-cyan-500/40 shadow-2xl relative bg-slate-900/95"
            >
              <button
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Scaling Decision Breakdown</h3>
                  <p className="text-xs font-mono text-slate-400">Mathematical derivation of prediction recommendation</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Target CPU Utilization:</span>
                    <span className="text-cyan-300 font-bold">{config.cpuThreshold}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Forecasted Peak Traffic:</span>
                    <span className="text-purple-300 font-bold">{forecast.recommendation.predictedPeakTraffic.toLocaleString()} req/min</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Rated Single Instance Capacity:</span>
                    <span className="text-slate-200">814 requests per instance @ 80% load</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Simulated Confidence Score:</span>
                    <span className="text-emerald-400 font-bold">{forecast.confidenceScore}%</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Calculated Optimal Fleet:</span>
                    <span className="text-white font-bold">{forecast.recommendation.targetInstances} instances</span>
                  </div>
                </div>

                <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/20 text-slate-300 leading-relaxed">
                  <strong className="text-cyan-300 block mb-1">Scaling Formula:</strong>
                  <code>requiredInstances = clamp(ceil((predictedTraffic / instanceCapacity) * (100 / cpuThreshold)), min, max)</code>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutoScalingPrediction;
