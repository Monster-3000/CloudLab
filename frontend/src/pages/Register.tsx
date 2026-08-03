import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cloud, Lock, User, Mail } from 'lucide-react';
import api from '../services/api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { username, email, password });
            // Auto login after register
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
                            <Cloud className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-center text-white mb-2">Create Account</h2>
                    <p className="text-slate-400 text-center mb-8">Deploy your first cloud simulation.</p>

                    {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm mb-6 text-center">{error}</div>}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                            <div className="relative">
                                <User className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                                <input 
                                    type="text" 
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-lg font-bold shadow-lg transition-all mt-4">
                            Register
                        </button>
                    </form>
                    
                    <p className="text-center text-slate-400 text-sm mt-6">
                        Already have an account? <Link to="/login" className="text-primary hover:text-blue-400 font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
