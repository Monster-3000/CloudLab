import { Shield, AlertTriangle } from 'lucide-react';

const SecurityCenter = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Security Center</h2>
          <p className="text-slate-400 mt-1">Manage IAM roles, Firewall rules, and security incidents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 border-red-500/20">
              <div className="flex items-center space-x-3 mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Recent Security Events</h3>
              </div>
              <div className="space-y-3">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                      <div>
                          <p className="text-sm font-medium text-white">Brute force SSH attempt blocked</p>
                          <p className="text-xs text-slate-400 mt-1">IP: 192.168.1.45 (Automated mitigation applied)</p>
                      </div>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>
                      <div>
                          <p className="text-sm font-medium text-white">Unusual geographic login detected</p>
                          <p className="text-xs text-slate-400 mt-1">Admin User - IAM Role - Requires Verification</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                  <Shield className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Firewall Rules (Inbound)</h3>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                     <span className="text-sm text-white font-mono">Port 80/443 (HTTP/S)</span>
                     <span className="text-xs font-bold text-green-400 px-2 py-1 bg-green-400/10 rounded">ALLOW 0.0.0.0/0</span>
                 </div>
                 <div className="flex justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                     <span className="text-sm text-white font-mono">Port 22 (SSH)</span>
                     <span className="text-xs font-bold text-green-400 px-2 py-1 bg-green-400/10 rounded">ALLOW 10.0.0.0/16</span>
                 </div>
                 <div className="flex justify-between p-3 bg-slate-800/50 rounded border border-slate-700 opacity-60">
                     <span className="text-sm text-slate-300 font-mono">All Other Ports</span>
                     <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-400/10 rounded">DENY 0.0.0.0/0</span>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default SecurityCenter;
