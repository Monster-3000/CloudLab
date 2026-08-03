import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Server, Network, Shield, Cloud, Settings, LogOut, Users } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

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
    { name: 'Network & Load', path: '/network', icon: Network },
    { name: 'Security Center', path: '/security', icon: Shield },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (isAdmin) {
      // @ts-ignore
      navItems.splice(5, 0, { name: 'User Management', path: '/users', icon: Users });
  }

  return (
    <div className="w-64 h-screen glass border-r flex flex-col z-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          CloudLab
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700/50">
        <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors duration-200">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
