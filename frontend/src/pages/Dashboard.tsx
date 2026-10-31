import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, HardDrive, Activity, DollarSign, Cpu, Database, Zap, 
  Maximize2, Minimize2, ChevronDown, ChevronUp, Minus, X, RefreshCw, Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface TelemetryPoint {
  time: string;
  cpu: number;
  ram: number;
}

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    total_vms: '0',
    running_vms: '0',
    total_cpu_cores: 0,
    total_ram_gb: 0,
    storage_usage: '0 GB',
    network_traffic: '0.0 TB',
    estimated_cost: '$0.00',
    cpu_utilization: 0,
    ram_utilization: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<TelemetryPoint[]>([]);

  // Widget Minimize / Expand Tool States
  const [isMetricsMinimized, setIsMetricsMinimized] = useState(false);
  const [isChartMinimized, setIsChartMinimized] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isLogsMinimized, setIsLogsMinimized] = useState(false);
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<{ title: string; value: string; detail: string; icon: any; color: string; bg: string } | null>(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const data = response.data;
      setStatsData(data);
      
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setChartData(prev => {
        if (prev.length === 0) {
          // Initialize synced baseline history across 12 ticks
          return Array.from({ length: 12 }, (_, i) => {
            const pastTime = new Date(Date.now() - (11 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return {
              time: pastTime,
              cpu: data.cpu_utilization > 0 ? Math.max(0, Math.min(100, data.cpu_utilization + (Math.sin(i) * 3))) : 0,
              ram: data.ram_utilization > 0 ? Math.max(0, Math.min(100, data.ram_utilization + (Math.cos(i) * 2))) : 0,
            };
          });
        }
        
        // Append live synced server data point
        const newSeries = [...prev.slice(1)];
        newSeries.push({
          time: nowTime,
          cpu: data.cpu_utilization,
          ram: data.ram_utilization,
        });
        return newSeries;
      });

    } catch (error) {
      console.error("Failed to fetch telemetry stats from API", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh telemetry every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const simulateVMCreation = async () => {
    try {
      await api.post('/vms', {
        name: `VM-${Math.floor(Math.random() * 8999 + 1000)}`,
        instance_type: 't3.medium',
        category: 'General Purpose',
        vendor: 'AWS',
        monthly_cost: 30.40,
        hourly_cost: 0.0416,
        cpu_cores: 2,
        ram_gb: 4,
        storage_gb: 40,
        network_perf: 'Up to 5 Gbps',
        architecture: 'x86_64',
        status: 'Running'
      });
      // Force immediate telemetry sync update
      fetchStats();
    } catch (error) {
      console.error("Failed to simulate VM creation", error);
    }
  };

  const stats = [
    { title: 'Total Virtual Servers', value: `${statsData.running_vms} Active / ${statsData.total_vms} Total`, icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/10', detail: 'Simulated AWS & GCP instances provisioned across active availability zones.' },
    { title: 'Storage Provisioned', value: statsData.storage_usage, icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-500/10', detail: 'Total SSD & NVMe EBS volume allocation across active instances.' },
    { title: 'Network Throughput', value: statsData.network_traffic, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', detail: 'Cumulative inbound and outbound virtual interface telemetry data transfer.' },
    { title: 'Est. Monthly Cost', value: statsData.estimated_cost, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/10', detail: 'Real-time billing estimation calculated from running instance hardware specs.' },
  ];

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header & Minimization Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Infrastructure Overview</span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Telemetry Synced
            </span>
          </h2>
          <p className="text-slate-400 mt-1">Real-time resource utilization & simulated cloud capacity metrics.</p>
        </div>

        {/* Global Dashboard Control Tools */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setIsMetricsMinimized(!isMetricsMinimized)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMetricsMinimized ? "Expand Overview Cards" : "Minimize Overview Cards"}
          >
            {isMetricsMinimized ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            <span>{isMetricsMinimized ? "Expand Cards" : "Minimize Cards"}</span>
          </button>
          
          <button
            onClick={fetchStats}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh Telemetry Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Telemetry Metric Cards Grid (Collapsible / Expandable) */}
      <AnimatePresence>
        {!isMetricsMinimized && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="glass-card p-6 flex flex-col justify-between group hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1 relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl border border-slate-700/50 ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>

                  {/* Card Tool Button: Expand Card Modal */}
                  <button
                    onClick={() => setExpandedMetric(stat)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all border border-transparent hover:border-cyan-500/30"
                    title={`Expand ${stat.title} details`}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">{stat.title}</h3>
                  {loading ? (
                    <div className="h-9 w-28 bg-slate-800/60 rounded animate-pulse mt-2"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white mt-1.5 tracking-tight">{stat.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Dashboard Widget Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Resource Utilization Telemetry Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`lg:col-span-2 glass-card flex flex-col p-6 border border-cyan-500/20 transition-all duration-300 ${
            isChartMinimized ? 'h-[90px]' : 'h-[430px]'
          }`}
        >
          {/* Header & Tool Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Resource Utilization Telemetry</span>
              </h3>
              {!isChartMinimized && (
                <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                  <span className="text-blue-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> CPU: {statsData.cpu_utilization}% ({statsData.total_cpu_cores} Cores)
                  </span>
                  <span className="text-purple-400 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" /> RAM: {statsData.ram_utilization}% ({statsData.total_ram_gb} GB)
                  </span>
                </div>
              )}
            </div>

            {/* Widget Control Buttons: Simulate, Minimize, Expand */}
            <div className="flex items-center gap-2">
              {!isChartMinimized && (
                <button 
                  onClick={simulateVMCreation}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl hover:border-cyan-400 transition-all text-xs font-semibold font-mono flex items-center gap-1.5 shadow-sm"
                >
                  + Simulate VM Launch
                </button>
              )}

              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/60">
                {/* Minimize / Restore Tool Button */}
                <button
                  onClick={() => setIsChartMinimized(!isChartMinimized)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title={isChartMinimized ? "Restore Chart View" : "Minimize Chart View"}
                >
                  {isChartMinimized ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <Minus className="w-4 h-4" />}
                </button>

                {/* Expand Fullscreen Tool Button */}
                <button
                  onClick={() => setIsChartExpanded(true)}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded transition-colors"
                  title="Expand Chart to Full Screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Area Chart Body (Hidden when Minimized) */}
          {!isChartMinimized && (
            <div className="flex-1 w-full min-h-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} fontStyle="mono" />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#06b6d4', color: '#f8fafc', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#38bdf8' }}
                    formatter={(value: any) => [`${value}%`, 'Utilization']}
                  />
                  <Area type="monotone" dataKey="cpu" name="CPU Usage" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCpu)" />
                  <Area type="monotone" dataKey="ram" name="RAM Usage" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRam)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
        
        {/* Widget 2: Telemetry Event Logs Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`glass-card flex flex-col p-6 border border-slate-800 transition-all duration-300 ${
            isLogsMinimized ? 'h-[90px]' : 'h-[430px]'
          }`}
        >
          {/* Logs Header & Controls */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Telemetry Event Logs</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE</span>
            </h3>

            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/60">
              {/* Minimize Tool Button */}
              <button
                onClick={() => setIsLogsMinimized(!isLogsMinimized)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title={isLogsMinimized ? "Restore Logs Panel" : "Minimize Logs Panel"}
              >
                {isLogsMinimized ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <Minus className="w-4 h-4" />}
              </button>

              {/* Expand Fullscreen Tool Button */}
              <button
                onClick={() => setIsLogsExpanded(true)}
                className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded transition-colors"
                title="Expand Logs Panel"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs Body (Hidden when Minimized) */}
          {!isLogsMinimized && (
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-cyan-500/20">
                <p className="text-cyan-300 font-semibold flex items-center justify-between">
                  <span>⚡ Telemetry Synced</span>
                  <span className="text-[10px] text-slate-500">Just Now</span>
                </p>
                <p className="text-slate-400 mt-1">CPU Cores: {statsData.total_cpu_cores} | RAM: {statsData.total_ram_gb} GB provisioned</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-purple-500/20">
                <p className="text-purple-300 font-semibold flex items-center justify-between">
                  <span>✨ Google Gemini AI</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Cloud Active</span>
                </p>
                <p className="text-slate-400 mt-1">CloudLab AI Assistant powered by Gemini 2.5 Flash</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-emerald-400 font-semibold flex items-center justify-between">
                  <span>🟢 Infrastructure Health</span>
                  <span className="text-[10px] text-emerald-500">Operational</span>
                </p>
                <p className="text-slate-400 mt-1">All {statsData.running_vms} virtual servers running within normal thresholds</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANDED FULLSCREEN MODALS FOR TOOL BUTTONS                                 */}
      {/* ========================================================================= */}

      {/* 1. Expanded Metric Card Modal */}
      <AnimatePresence>
        {expandedMetric && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-lg w-full p-6 border border-cyan-500/40 shadow-2xl relative bg-slate-900/95"
            >
              <button 
                onClick={() => setExpandedMetric(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl border border-slate-700/50 ${expandedMetric.bg} ${expandedMetric.color}`}>
                  <expandedMetric.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{expandedMetric.title}</h3>
                  <p className="text-2xl font-mono text-cyan-400 font-semibold">{expandedMetric.value}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 font-mono text-sm space-y-3 text-slate-300">
                <p className="text-slate-300">{expandedMetric.detail}</p>
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                  <span>Status: Operational</span>
                  <span>Sync: Live API</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setExpandedMetric(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Expanded Telemetry Chart Modal */}
      <AnimatePresence>
        {isChartExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/85 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-6xl h-[85vh] p-6 border border-cyan-500/50 shadow-2xl flex flex-col bg-slate-900/95 relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Resource Utilization Telemetry — Expanded Focus View</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">High-precision real-time monitor across CPU cores and memory pools</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={simulateVMCreation}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl hover:border-cyan-400 transition-all text-xs font-semibold font-mono"
                  >
                    + Simulate VM Launch
                  </button>

                  <button 
                    onClick={() => setIsChartExpanded(false)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                    title="Minimize / Exit Fullscreen"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Fullscreen Chart Body */}
              <div className="flex-1 w-full pt-6 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorCpuExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRamExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontStyle="mono" />
                    <YAxis stroke="#94a3b8" unit="%" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#06b6d4', color: '#f8fafc', borderRadius: '12px', fontSize: '14px', fontFamily: 'monospace' }}
                    />
                    <Area type="monotone" dataKey="cpu" name="CPU Utilization" stroke="#06b6d4" strokeWidth={3} fill="url(#colorCpuExp)" />
                    <Area type="monotone" dataKey="ram" name="RAM Utilization" stroke="#a855f7" strokeWidth={3} fill="url(#colorRamExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Expanded Event Logs Modal */}
      <AnimatePresence>
        {isLogsExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/85 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-4xl h-[80vh] p-6 border border-emerald-500/50 shadow-2xl flex flex-col bg-slate-900/95 relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Telemetry Event Console — Expanded View</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">Real-time system telemetry audit events and system state logs</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsLogsExpanded(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>

              {/* Fullscreen Event Logs Console */}
              <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar space-y-4 font-mono text-sm">
                <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30">
                  <div className="flex justify-between items-center text-cyan-300 font-semibold mb-1">
                    <span>⚡ Telemetry Synced</span>
                    <span className="text-xs text-slate-500">Just Now</span>
                  </div>
                  <p className="text-slate-300">Total CPU Cores: {statsData.total_cpu_cores} | RAM: {statsData.total_ram_gb} GB provisioned across active VM nodes.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/30">
                  <div className="flex justify-between items-center text-purple-300 font-semibold mb-1">
                    <span>✨ Google Gemini AI Assistant</span>
                    <span className="text-xs text-emerald-400 font-mono">Cloud Active</span>
                  </div>
                  <p className="text-slate-300">Cloud AI assistant integrated with Gemini 2.5 Flash for cloud telemetry & architecture guidance.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30">
                  <div className="flex justify-between items-center text-emerald-400 font-semibold mb-1">
                    <span>🟢 System Infrastructure Health Check</span>
                    <span className="text-xs text-emerald-500">Operational</span>
                  </div>
                  <p className="text-slate-300">All {statsData.running_vms} virtual servers running within expected telemetry parameters.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;

