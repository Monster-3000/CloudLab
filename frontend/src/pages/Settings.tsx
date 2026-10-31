import { useState } from 'react';
import { 
  Bell, LayoutDashboard, Cloud, Server, Users, Sparkles, BookOpen, Check, ShieldCheck 
} from 'lucide-react';

const Settings = () => {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    billing: true,
    security: true,
    telemetry: true,
    maintenance: false,
  });

  const getStoredUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getStoredUser();

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const platformModules = [
    {
      title: 'Dashboard Overview',
      path: '/',
      icon: LayoutDashboard,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      badge: 'Live Telemetry',
      description: 'Central command panel featuring real-time CPU & RAM utilization graphs, active VM telemetry metrics, event logs, and minimizable widget tools.'
    },
    {
      title: 'Architecture Designer',
      path: '/designer',
      icon: Cloud,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      badge: 'Drag & Drop Canvas',
      description: 'Visual cloud topology engine to design multi-tier architectures with servers, load balancers, databases, and storage buckets with cost estimation.'
    },
    {
      title: 'Virtual Instances',
      path: '/instances',
      icon: Server,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      badge: 'VM Operations',
      description: 'Provision, launch, stop, reboot, and terminate virtual servers across AWS, GCP, and Azure with full hardware specs and status monitoring.'
    },
    {
      title: 'User Management',
      path: '/users',
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      badge: 'Admin Only',
      description: 'Role-Based Access Control (RBAC) panel for administrators to manage user accounts, update security roles, and review platform users.'
    },
    {
      title: 'Gemini AI Assistant',
      path: 'AI Companion',
      icon: Sparkles,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      badge: 'Gemini 2.5 Flash',
      description: 'Integrated Google Gemini AI cloud assistant for real-time cloud architecture recommendations, cost reduction strategies, and instant technical guidance.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Platform Settings & Module Guide</h2>
        <p className="text-slate-400 mt-1">Manage account preferences and explore comprehensive descriptions of platform features.</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        {/* User Profile Header */}
        <div className="flex items-center space-x-4 border-b border-slate-700/50 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg uppercase">
            {currentUser?.username ? currentUser.username.substring(0, 2) : 'AD'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{currentUser?.username || 'Administrator'}</h3>
            <p className="text-slate-400 text-sm">{currentUser?.email || 'admin@cloudlab.local'} • <span className="text-cyan-400 font-mono">{currentUser?.role || 'Administrator'}</span></p>
          </div>
          <div className="flex-1 text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Account Active
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Left Module Guide (Scrollable), Right Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          
          {/* Scrollable Platform Modules Description Panel (Takes 2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" /> 
              <span>Platform Panels & Modules Reference</span>
            </h4>

            {/* Scrollable Container */}
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 h-[380px] overflow-y-auto custom-scrollbar space-y-4">
              {platformModules.map((mod) => (
                <div 
                  key={mod.title}
                  className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-lg border border-slate-700/50 ${mod.bg} ${mod.color}`}>
                        <mod.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-white font-semibold text-sm group-hover:text-cyan-300 transition-colors">{mod.title}</h5>
                        <span className="text-[11px] font-mono text-slate-500">{mod.path}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {mod.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2 pl-12">
                    {mod.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Notifications Panel (Takes 1 Column) */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" /> 
              <span>Alert Preferences</span>
            </h4>
            
            <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
              <label className="flex items-start justify-between cursor-pointer space-x-3">
                <div>
                  <span className="text-sm font-medium text-slate-200 block">Billing Alerts</span>
                  <span className="text-[11px] text-slate-500 block">Notify when cost exceeds $500/mo</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.billing} 
                  onChange={() => handleToggle('billing')}
                  className="mt-1 accent-cyan-500 w-4 h-4 rounded cursor-pointer" 
                />
              </label>

              <label className="flex items-start justify-between cursor-pointer space-x-3 border-t border-slate-800 pt-3">
                <div>
                  <span className="text-sm font-medium text-slate-200 block">Security Incident Alerts</span>
                  <span className="text-[11px] text-slate-500 block">Immediate alert on login attempts</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.security} 
                  onChange={() => handleToggle('security')}
                  className="mt-1 accent-cyan-500 w-4 h-4 rounded cursor-pointer" 
                />
              </label>

              <label className="flex items-start justify-between cursor-pointer space-x-3 border-t border-slate-800 pt-3">
                <div>
                  <span className="text-sm font-medium text-slate-200 block">Telemetry Warnings</span>
                  <span className="text-[11px] text-slate-500 block">Warn when CPU usage exceeds 90%</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.telemetry} 
                  onChange={() => handleToggle('telemetry')}
                  className="mt-1 accent-cyan-500 w-4 h-4 rounded cursor-pointer" 
                />
              </label>

              <label className="flex items-start justify-between cursor-pointer space-x-3 border-t border-slate-800 pt-3">
                <div>
                  <span className="text-sm font-medium text-slate-200 block">System Maintenance</span>
                  <span className="text-[11px] text-slate-500 block">Scheduled maintenance updates</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.maintenance} 
                  onChange={() => handleToggle('maintenance')}
                  className="mt-1 accent-cyan-500 w-4 h-4 rounded cursor-pointer" 
                />
              </label>

              <div className="pt-2">
                <button 
                  onClick={handleSave}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl transition-all text-xs font-semibold font-mono flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Preferences Saved</span>
                    </>
                  ) : (
                    <span>Save Alert Preferences</span>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;

