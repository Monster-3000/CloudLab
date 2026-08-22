import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, HardDrive, Activity, DollarSign, Cpu, Database, Zap } from 'lucide-react';
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
    { title: 'Total Virtual Servers', value: `${statsData.running_vms} Active / ${statsData.total_vms} Total`, icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Storage Provisioned', value: statsData.storage_usage, icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Network Throughput', value: statsData.network_traffic, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Est. Monthly Cost', value: statsData.estimated_cost, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="space-y-8">
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

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 flex flex-col justify-between group hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border border-slate-700/50 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
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
      </div>
      
      {/* Synced Telemetry Utilization Chart & Activity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card h-[430px] flex flex-col p-6 border border-cyan-500/20"
        >
          {/* Header & Gauge Badges */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Resource Utilization Telemetry</span>
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                <span className="text-blue-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> CPU: {statsData.cpu_utilization}% ({statsData.total_cpu_cores} Cores)
                </span>
                <span className="text-purple-400 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> RAM: {statsData.ram_utilization}% ({statsData.total_ram_gb} GB)
                </span>
              </div>
            </div>

            <button 
              onClick={simulateVMCreation}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl hover:border-cyan-400 transition-all text-xs font-semibold font-mono flex items-center gap-1.5 shadow-sm"
            >
              + Simulate VM Launch
            </button>
          </div>

          {/* Recharts Synced Area Chart */}
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
        </motion.div>
        
        {/* Telemetry Logs Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card h-[430px] flex flex-col p-6 border border-slate-800"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
            <span>Telemetry Event Logs</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE</span>
          </h3>
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
                <span>🦙 Ollama Llama 3.2 3B</span>
                <span className="text-[10px] text-slate-500">Active</span>
              </p>
              <p className="text-slate-400 mt-1">Chatbot assistant connected on port 11434</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-emerald-400 font-semibold flex items-center justify-between">
                <span>🟢 Infrastructure Health</span>
                <span className="text-[10px] text-emerald-500">Operational</span>
              </p>
              <p className="text-slate-400 mt-1">All {statsData.running_vms} virtual servers running within normal thresholds</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
