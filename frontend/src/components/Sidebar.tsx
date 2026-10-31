import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Server, Cloud, Settings, LogOut, Users,
  ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      navigate('/login');
  };

  const userStr = localStorage.getItem('user');
  let isAdmin = false;
  try {
      if (userStr) isAdmin = JSON.parse(userStr).role === 'Administrator';
  } catch(e) {}

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Architecture Designer', path: '/designer', icon: Cloud },
    { name: 'Virtual Instances', path: '/instances', icon: Server },
    { name: 'Auto-Scaling Prediction', path: '/autoscaling', icon: TrendingUp },
    // Disabled pages (can be re-enabled when needed):
    // { name: 'Network & Load', path: '/network', icon: Network },
    // { name: 'Security Center', path: '/security', icon: Shield },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
      // @ts-ignore
      navItems.splice(3, 0, { name: 'User Management', path: '/users', icon: Users });
  }

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen glass border-r flex flex-col z-20 transition-all duration-300 select-none relative`}>
      
      {/* Sidebar Header & Toggle Tool Button */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between'} border-b border-slate-700/40 min-h-[72px]`}>
        {!isCollapsed ? (
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
            CloudLab
          </h1>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg text-base">
            CL
          </div>
        )}

        {/* Minimize / Expand Sidebar Tool Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-700/60 shadow-sm flex items-center justify-center group"
          title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium truncate text-sm">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout Button */}
      <div className="p-3 border-t border-slate-700/50">
        <button 
          onClick={handleLogout} 
          title={isCollapsed ? "Logout" : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors duration-200`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

