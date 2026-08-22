import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, X, Cloud } from 'lucide-react';
import api from '../services/api';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { username, email, password });
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#0b192e] overflow-hidden select-none font-sans">
            {/* Vector Forest Silhouette Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <svg className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900" fill="none">
                    <defs>
                        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0a1526" />
                            <stop offset="40%" stopColor="#13263e" />
                            <stop offset="70%" stopColor="#25476a" />
                            <stop offset="100%" stopColor="#3c6b97" />
                        </linearGradient>
                        <linearGradient id="treeBack" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1a3554" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#0c1a2d" stopOpacity="0.95" />
                        </linearGradient>
                    </defs>

                    <rect width="1440" height="900" fill="url(#skyGrad)" />
                    <path d="M0 450 C 300 420, 600 480, 900 440 C 1200 400, 1350 460, 1440 450 L 1440 900 L 0 900 Z" fill="url(#treeBack)" />
                    <g fill="#142c47" opacity="0.85">
                        <polygon points="100,500 120,400 140,500" />
                        <polygon points="125,480 145,370 165,480" />
                        <polygon points="300,510 325,380 350,510" />
                        <polygon points="450,520 480,360 510,520" />
                        <polygon points="700,490 730,350 760,490" />
                        <polygon points="950,510 980,390 1010,510" />
                        <polygon points="1150,500 1180,360 1210,500" />
                    </g>

                    <g fill="#0c1a2e">
                        <rect x="50" y="0" width="45" height="900" rx="10" />
                        <rect x="150" y="0" width="55" height="900" rx="12" />
                        <rect x="1150" y="0" width="60" height="900" rx="15" />
                        <rect x="1270" y="0" width="70" height="900" rx="18" />
                    </g>

                    <g fill="#071120">
                        <path d="M-50 0 C 150 100, 350 80, 550 0 L-50 0 Z" />
                        <path d="M850 0 C 1050 120, 1300 90, 1500 0 L850 0 Z" />
                    </g>
                    <path d="M0 720 C 350 680, 700 750, 1440 700 L 1440 900 L 0 900 Z" fill="#060e1a" />
                </svg>
            </div>

            {/* Top Navigation Bar */}
            <header className="relative z-20 flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-2 text-white font-bold text-2xl tracking-wide group">
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-md">
                        <Cloud className="w-6 h-6 fill-white/20" />
                    </div>
                    <span>CloudLab</span>
                </Link>

                <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-200">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <Link to="/designer" className="hover:text-white transition-colors">Architecture</Link>
                    <Link to="/instances" className="hover:text-white transition-colors">Virtual Instances</Link>
                    <Link to="/settings" className="hover:text-white transition-colors">Services</Link>
                </nav>

                <Link 
                    to="/login" 
                    className="px-6 py-2 rounded-xl border border-white/60 text-white text-sm font-semibold hover:bg-white/15 backdrop-blur-md transition-all shadow-md"
                >
                    Login
                </Link>
            </header>

            {/* Centered Frosted Glass Register Modal */}
            <main className="relative z-20 flex-1 flex items-center justify-center p-4 my-4">
                <div className="w-full max-w-[420px] bg-white/20 backdrop-blur-2xl border border-white/40 shadow-[0_25px_60px_rgba(0,0,0,0.5)] rounded-3xl p-8 relative transition-all">
                    <button 
                        onClick={() => navigate('/')}
                        className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-all shadow-md"
                        title="Close Modal"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-8">
                        Register
                    </h2>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-900 font-medium text-xs mb-5 text-center backdrop-blur-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="relative border-b-2 border-slate-800/60 pb-1.5 focus-within:border-slate-900 transition-colors">
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full bg-transparent pr-8 py-1.5 text-slate-900 font-medium text-sm placeholder:text-slate-700/80 focus:outline-none"
                            />
                            <User className="w-4 h-4 text-slate-800 absolute right-1 top-2.5 pointer-events-none" />
                        </div>

                        <div className="relative border-b-2 border-slate-800/60 pb-1.5 focus-within:border-slate-900 transition-colors">
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full bg-transparent pr-8 py-1.5 text-slate-900 font-medium text-sm placeholder:text-slate-700/80 focus:outline-none"
                            />
                            <Mail className="w-4 h-4 text-slate-800 absolute right-1 top-2.5 pointer-events-none" />
                        </div>

                        <div className="relative border-b-2 border-slate-800/60 pb-1.5 focus-within:border-slate-900 transition-colors">
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-transparent pr-8 py-1.5 text-slate-900 font-medium text-sm placeholder:text-slate-700/80 focus:outline-none"
                            />
                            <Lock className="w-4 h-4 text-slate-800 absolute right-1 top-2.5 pointer-events-none" />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-[#13253a] hover:bg-[#0c1827] text-white rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] tracking-wide"
                        >
                            Register
                        </button>
                    </form>

                    <div className="text-center text-xs font-semibold text-slate-800 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-slate-900 underline font-bold hover:text-black">
                            Login
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="relative z-20 text-center py-4 text-xs text-slate-400 font-medium">
                © 2026 CloudLab Virtual Systems. All rights reserved.
            </footer>
        </div>
    );
};

export default Register;
