import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, HardDrive, Activity, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    total_vms: '0',
    storage_usage: '0 GB',
    network_traffic: '0.0 TB',
    estimated_cost: '$0.00'
  });
  
  const [loading, setLoading] = useState(true);

  // Initial mock data for the chart
  const generateInitialData = () => {
    return Array.from({ length: 15 }, (_, i) => ({
      name: `T-${14 - i}`,
      cpu: Math.floor(Math.random() * 40) + 20,
      ram: Math.floor(Math.random() * 30) + 40,
    }));
  };

  const [chartData, setChartData] = useState(generateInitialData());

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStatsData(response.data);
      
      // Update chart with new data point based on active VMs to simulate utilization
      setChartData(prev => {
          const newData = [...prev.slice(1)];
          const baseUsage = parseInt(response.data.total_vms) * 5; 
          newData.push({
              name: 'Now',
              cpu: Math.min(100, Math.max(10, baseUsage + Math.floor(Math.random() * 20))),
              ram: Math.min(100, Math.max(20, baseUsage + Math.floor(Math.random() * 15))),
          });
          return newData;
      });

    } catch (error) {
      console.error("Failed to fetch stats from API", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 seconds for real-time simulation feel
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const simulateVMCreation = async () => {
    try {
      await api.post('/vms', {
          name: `VM-${Math.floor(Math.random() * 1000)}`,
          instance_type: 't3.micro',
          vendor: 'AWS',
          monthly_cost: 8.50,
          cpu_cores: 2,
          ram_gb: 1,
          storage_gb: 20
      });
      // Force refresh stats immediately
      fetchStats();
    } catch (error) {
      console.error("Failed to create VM", error);
    }
  }

  const stats = [
    { title: 'Total Virtual Servers', value: statsData.total_vms, icon: Server, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Storage Usage', value: statsData.storage_usage, icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'Network Traffic', value: statsData.network_traffic, icon: Activity, color: 'text-green-400', bg: 'bg-green-400/10' },
    { title: 'Monthly Est. Cost', value: statsData.estimated_cost, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Infrastructure Overview</h2>
        <p className="text-slate-400 mt-1">Monitor your simulated cloud environment in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 flex flex-col justify-between group hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-xl border border-slate-700/50 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-medium">{stat.title}</h3>
              {loading ? (
                  <div className="h-9 w-24 bg-slate-700/50 rounded animate-pulse mt-2"></div>
              ) : (
                  <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stat.value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card h-[400px] flex flex-col p-6"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Resource Utilization</h3>
                <button 
                  onClick={simulateVMCreation}
                  className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors text-sm font-medium"
                >
                  + Simulate VM Creation
                </button>
            </div>
            <div className="flex-1 w-full h-full min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div style={{ width: '600px', height: '280px' }}>
                    <AreaChart
                      width={600}
                      height={280}
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="cpu" name="CPU Usage" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                      <Area type="monotone" dataKey="ram" name="RAM Usage" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
                    </AreaChart>
                </div>
            </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card h-[400px] flex flex-col p-6"
        >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity Logs</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-sm text-white font-medium">System initialized</p>
                    <p className="text-xs text-slate-400 mt-1">All services running optimally</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-sm text-white font-medium">Network routing updated</p>
                    <p className="text-xs text-slate-400 mt-1">VPC peering connection established</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-green-400 font-medium">Health check passed</p>
                    <p className="text-xs text-slate-400 mt-1">API gateway responding under 50ms</p>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
