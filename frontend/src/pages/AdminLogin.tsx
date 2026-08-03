import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User } from 'lucide-react';
import api from '../services/api';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: any) => {
        e.preventDefault();
        try {
            // Pass type='admin' to enforce backend RBAC check
            const res = await api.post('/auth/login', { username, password, type: 'admin' });
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err: any) {
            console.error("Admin Login Error:", err);
            setError(err.response?.data?.message || err.message || 'Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-8 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-center text-white mb-2">Admin Portal</h2>
                    <p className="text-amber-200/70 text-center mb-8">Authorized personnel only.</p>

                    {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm mb-6 text-center">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Admin ID</label>
                            <div className="relative">
                                <User className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                                <input 
                                    type="text" 
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="admin"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Passcode</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white rounded-lg font-bold shadow-lg transition-all mt-4">
                            Authenticate
                        </button>
                    </form>
                    
                    <p className="text-center text-slate-400 text-sm mt-6">
                        Not an admin? <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium">Return to User Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
