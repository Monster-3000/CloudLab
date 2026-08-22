import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, X, Cloud, Check, User, Shield } from 'lucide-react';
import api from '../services/api';
import CloudBackground from '../components/CloudBackground';

const Login: React.FC = () => {
    const [searchParams] = useSearchParams();
    const isInitialAdmin = searchParams.get('mode') === 'admin';
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginType, setLoginType] = useState<'user' | 'admin'>(isInitialAdmin ? 'admin' : 'user');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password, type: loginType });
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err.response?.data?.message || err.message || 'Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#0b192e] overflow-hidden select-none font-sans">
            {/* 3D Cloud Atmosphere Background */}
            <CloudBackground />

            {/* Top Navigation Bar */}
            <header className="relative z-20 flex items-center justify-center pt-10 w-full max-w-7xl mx-auto">
                <div className="flex items-center px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    <Link to="/" className="flex items-center gap-3 text-white font-bold text-2xl tracking-wide group">
                        <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-sm group-hover:scale-105 transition-all">
                            <Cloud className="w-6 h-6 fill-white/40" />
                        </div>
                        <span>CloudLab</span>
                    </Link>
                </div>
            </header>

            {/* Centered Frosted Glass Login Modal */}
            <main className="relative z-20 flex-1 flex items-center justify-center p-4 my-4">
                <div className="w-full max-w-[440px] bg-white/20 backdrop-blur-2xl border border-white/40 shadow-[0_25px_60px_rgba(0,0,0,0.5)] rounded-3xl p-8 relative transition-all">
                    {/* Close 'X' Button on Top Right */}
                    <button 
                        onClick={() => navigate('/')}
                        className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-all shadow-md hover:scale-105"
                        title="Close Modal"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-4 flex items-center justify-center gap-2">
                        {loginType === 'admin' && <Shield className="w-7 h-7 text-slate-900" />}
                        <span>{loginType === 'admin' ? 'Admin Portal' : 'Login'}</span>
                    </h2>

                    {/* Separate Admin vs User Role Selector Segment */}
                    <div className="flex items-center p-1 bg-slate-900/30 rounded-xl mb-6 border border-slate-900/20 font-semibold text-xs text-slate-800">
                        <button
                            type="button"
                            onClick={() => { setLoginType('user'); setError(''); }}
                            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                loginType === 'user'
                                    ? 'bg-slate-900 text-white shadow-md font-bold'
                                    : 'hover:text-slate-950 font-medium'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Normal User</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setLoginType('admin'); setError(''); }}
                            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                loginType === 'admin'
                                    ? 'bg-slate-900 text-white shadow-md font-bold'
                                    : 'hover:text-slate-950 font-medium'
                            }`}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Administrator</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-950 font-semibold text-xs mb-5 text-center backdrop-blur-md">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email / Username Field */}
                        <div className="relative border-b-2 border-slate-800/60 pb-1.5 focus-within:border-slate-900 transition-colors">
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={loginType === 'admin' ? "Admin ID / Username" : "Username or Email"}
                                className="w-full bg-transparent pr-8 py-1.5 text-slate-900 font-medium text-sm placeholder:text-slate-700/80 focus:outline-none"
                            />
                            <Mail className="w-4 h-4 text-slate-800 absolute right-1 top-2.5 pointer-events-none" />
                        </div>

                        {/* Password Field */}
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

                        {/* Checkbox Options Row */}
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <div 
                                    onClick={() => setRememberMe(!rememberMe)}
                                    className={`w-4 h-4 rounded border border-slate-800 flex items-center justify-center transition-colors ${rememberMe ? 'bg-slate-900 text-white' : 'bg-transparent'}`}
                                >
                                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>Remember me</span>
                            </label>

                            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Password reset link sent to your registered email."); }} className="hover:underline text-slate-900">
                                Forgot Password?
                            </a>
                        </div>

                        {/* Main Login Pill Button */}
                        <button 
                            type="submit" 
                            className="w-full py-3 bg-[#13253a] hover:bg-[#0c1827] text-white rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] tracking-wide"
                        >
                            {loginType === 'admin' ? 'Authenticate as Admin' : 'Login'}
                        </button>
                    </form>

                    {/* Footer Role Links */}
                    <div className="text-center text-xs font-semibold text-slate-800 mt-6 space-y-2">
                        <div>
                            Don't have an account?{' '}
                            <Link to="/register" className="text-slate-900 underline font-bold hover:text-black">
                                Register
                            </Link>
                        </div>
                        <div>
                            {loginType === 'user' ? (
                                <button 
                                    type="button"
                                    onClick={() => { setLoginType('admin'); setError(''); }} 
                                    className="text-slate-900 font-bold hover:underline opacity-80 hover:opacity-100"
                                >
                                    🛡️ Switch to Administrator Login Portal
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={() => { setLoginType('user'); setError(''); }} 
                                    className="text-slate-900 font-bold hover:underline opacity-80 hover:opacity-100"
                                >
                                    👤 Standard User? Switch to Normal User Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-20 text-center py-4 text-xs text-slate-400 font-medium">
                © 2026 CloudLab Virtual Systems. All rights reserved.
            </footer>
        </div>
    );
};

export default Login;
