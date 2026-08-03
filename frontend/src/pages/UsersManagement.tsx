import React, { useEffect, useState } from 'react';
import { Users, Trash2, AlertTriangle, X } from 'lucide-react';
import api from '../services/api';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Warning Modal State
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [warningMsg, setWarningMsg] = useState('');
    const [sending, setSending] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? All their instances and data will be lost.")) return;
        
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete user");
        }
    };

    const handleSendWarning = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post(`/users/${selectedUser.id}/warnings`, { message: warningMsg });
            setShowWarningModal(false);
            setWarningMsg('');
            alert("Warning dispatched successfully!");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send warning");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
                    <Users className="w-8 h-8 text-primary" />
                    <span>User Management</span>
                </h2>
                <p className="text-slate-400 mt-1">Manage platform access, issue warnings, and monitor accounts.</p>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User ID</th>
                                <th className="px-6 py-4 font-semibold">Username</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-300">#{user.id}</td>
                                        <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${user.role === 'Administrator' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button 
                                                onClick={() => { setSelectedUser(user); setShowWarningModal(true); }}
                                                className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium bg-yellow-400/10 hover:bg-yellow-400/20 px-3 py-1.5 rounded"
                                            >
                                                Warn
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors font-medium bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warning Modal */}
            {showWarningModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-md p-6 relative border-yellow-500/30">
                        <button 
                            onClick={() => setShowWarningModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Issue Warning</h3>
                        </div>
                        
                        <form onSubmit={handleSendWarning} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Target User: <span className="text-white font-medium">{selectedUser.username}</span></label>
                                <textarea 
                                    required
                                    value={warningMsg}
                                    onChange={(e) => setWarningMsg(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white h-32 focus:outline-none focus:border-yellow-500/50 resize-none custom-scrollbar"
                                    placeholder="Enter your warning message to this user..."
                                />
                            </div>
                            <div className="flex space-x-3 justify-end mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setShowWarningModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={sending}
                                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {sending ? 'Sending...' : 'Dispatch Warning'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;
