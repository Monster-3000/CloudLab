import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface NotificationItem {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

const TopNav: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<NotificationItem[]>('/notifications');
      setNotifications(res.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/instances?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getStoredUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getStoredUser();

  return (
    <header className="h-16 glass border-b flex items-center justify-between px-6 z-30 relative">
      <div className="flex items-center space-x-4 flex-1">
          <form onSubmit={handleSearch} className="flex items-center bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700/50 focus-within:border-primary/50 transition-colors w-96">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources, VMs, Cloudflare..." 
              className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-500 w-full"
            />
          </form>
          <button 
            onClick={() => navigate('/instances?action=create')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg transition-colors text-sm font-medium shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
      </div>
      <div className="flex items-center space-x-4">
        
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-800/50"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
              )}
            </button>
            
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 glass-card border border-slate-700 shadow-2xl rounded-xl overflow-hidden flex flex-col z-50">
                    <div className="p-3 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        <span className="text-xs text-primary font-medium">{notifications.length} unread</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">No new notifications.</div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="p-3 border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors group">
                                    <p className="text-sm text-slate-300 pr-6 relative">
                                        {notif.message}
                                        <button 
                                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                                            className="absolute right-0 top-0 text-slate-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </p>
                                    <span className="text-xs text-slate-500 mt-2 block">
                                        {new Date(notif.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center space-x-3 pl-4 border-l border-slate-700/50 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-sm font-bold text-white shadow-lg uppercase">
            {currentUser?.username ? currentUser.username.substring(0, 2) : 'JD'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                {currentUser?.username || 'Guest'}
            </span>
            <span className="text-xs text-slate-500">
                {currentUser?.role || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
