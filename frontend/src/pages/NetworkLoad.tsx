import React from 'react';
import { Activity, Network } from 'lucide-react';

const NetworkLoad = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Network & Load Simulator</h2>
          <p className="text-slate-400 mt-1">Monitor real-time traffic, VPCs, and Load Balancers.</p>
        </div>
        <button className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors font-medium">
          Configure VPC
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center space-y-4 col-span-2 min-h-[300px] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
             <Activity className="w-12 h-12 text-blue-400" />
             <h3 className="text-xl font-bold text-white">Load Balancer Simulation</h3>
             <p className="text-slate-400 text-center max-w-md">Traffic generation and request routing simulation is currently active. Metrics will populate shortly.</p>
             <div className="flex space-x-6 mt-4">
                 <div className="text-center">
                     <p className="text-2xl font-bold text-white">1,402</p>
                     <p className="text-xs text-slate-400 uppercase tracking-wider">Req/Sec</p>
                 </div>
                 <div className="text-center">
                     <p className="text-2xl font-bold text-green-400">99.9%</p>
                     <p className="text-xs text-slate-400 uppercase tracking-wider">Uptime</p>
                 </div>
                 <div className="text-center">
                     <p className="text-2xl font-bold text-yellow-400">42ms</p>
                     <p className="text-xs text-slate-400 uppercase tracking-wider">Latency</p>
                 </div>
             </div>
          </div>
          
          <div className="glass-card p-6 flex flex-col min-h-[300px]">
             <div className="flex items-center space-x-3 mb-4">
                 <Network className="w-6 h-6 text-purple-400" />
                 <h3 className="text-lg font-bold text-white">Subnets</h3>
             </div>
             <div className="space-y-4 flex-1">
                 <div className="p-3 bg-slate-800/50 rounded border border-slate-700 flex justify-between items-center">
                     <div>
                         <p className="text-sm font-medium text-white">Public Subnet A</p>
                         <p className="text-xs text-slate-400 font-mono mt-1">10.0.1.0/24</p>
                     </div>
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 </div>
                 <div className="p-3 bg-slate-800/50 rounded border border-slate-700 flex justify-between items-center">
                     <div>
                         <p className="text-sm font-medium text-white">Private Subnet A</p>
                         <p className="text-xs text-slate-400 font-mono mt-1">10.0.2.0/24</p>
                     </div>
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default NetworkLoad;
