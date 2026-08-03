import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const instanceTiers = [
    { type: 't3.micro', name: 'General Purpose (Micro)', cpu: 2, ram: 1, storage: 20, cost: 8.50 },
    { type: 'm5.large', name: 'General Purpose (Large)', cpu: 4, ram: 16, storage: 50, cost: 45.00 },
    { type: 'c5.xlarge', name: 'Compute Optimized', cpu: 8, ram: 16, storage: 100, cost: 95.50 },
    { type: 'r5.2xlarge', name: 'Memory Optimized', cpu: 8, ram: 64, storage: 200, cost: 180.00 },
];

const VirtualInstances = () => {
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';
  const actionParam = searchParams.get('action');
  
  const [isModalOpen, setIsModalOpen] = useState(actionParam === 'create');
  
  const [newVm, setNewVm] = useState({
      name: '',
      vendor: 'AWS',
      instance_type: 't3.micro',
      os: 'Ubuntu 22.04',
      region: 'us-east-1'
  });

  const fetchVms = async () => {
    try {
      const response = await api.get('/vms');
      setVms(response.data);
    } catch (error) {
      console.error("Failed to fetch VMs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVms();
    const interval = setInterval(fetchVms, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (actionParam === 'create') {
          setIsModalOpen(true);
      }
  }, [actionParam]);

  const handleCreate = async (e) => {
      e.preventDefault();
      try {
          const selectedTier = instanceTiers.find(t => t.type === newVm.instance_type);
          const payload = {
              ...newVm,
              cpu_cores: selectedTier.cpu,
              ram_gb: selectedTier.ram,
              storage_gb: selectedTier.storage,
              monthly_cost: selectedTier.cost
          };
          await api.post('/vms', payload);
          setIsModalOpen(false);
          fetchVms();
      } catch (error) {
          console.error("Failed to create VM", error);
      }
  };

  const handleDelete = async (id) => {
      try {
          await api.delete(`/vms/${id}`);
          fetchVms();
      } catch (error) {
          console.error("Failed to delete VM", error);
      }
  };

  const getVendorColor = (vendor) => {
      switch(vendor) {
          case 'AWS': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
          case 'Azure': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          case 'GCP': return 'text-red-400 bg-red-400/10 border-red-400/20';
          default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      }
  };

  const filteredVms = vms.filter(vm => 
      vm.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
      vm.instance_type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      vm.vendor.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Virtual Instances</h2>
          <p className="text-slate-400 mt-1">Manage and provision your multi-cloud virtual machines.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          <Plus className="w-5 h-5" />
          <span>Launch Instance</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-300 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Instance Name</th>
                <th className="px-6 py-4 font-semibold">Vendor & Type</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Specs (CPU/RAM/Disk)</th>
                <th className="px-6 py-4 font-semibold">Est. Cost</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading instances...</td></tr>
              ) : filteredVms.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">
                    {searchFilter ? `No instances found matching "${searchFilter}".` : 'No virtual instances found. Launch one to get started!'}
                </td></tr>
              ) : (
                filteredVms.map((vm, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={vm.id} 
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                        <Server className="w-4 h-4 text-primary" />
                        <span>{vm.name}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-max border ${getVendorColor(vm.vendor)}`}>
                                {vm.vendor}
                            </span>
                            <span className="text-xs text-slate-400">{vm.instance_type}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                            <span>{vm.status}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                        {vm.cpu_cores} vCPU • {vm.ram_gb} GB • {vm.storage_gb} GB
                    </td>
                    <td className="px-6 py-4 text-yellow-400 font-medium">
                        ${vm.monthly_cost?.toFixed(2)}/mo
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(vm.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-6 border border-slate-600 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-4">Launch New Instance</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Instance Name</label>
                <input 
                  type="text" 
                  required
                  value={newVm.name}
                  onChange={(e) => setNewVm({...newVm, name: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="e.g. web-server-01"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Cloud Vendor</label>
                    <select 
                      value={newVm.vendor}
                      onChange={(e) => setNewVm({...newVm, vendor: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="AWS">Amazon Web Services</option>
                      <option value="Azure">Microsoft Azure</option>
                      <option value="GCP">Google Cloud Platform</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Operating System</label>
                    <select 
                      value={newVm.os}
                      onChange={(e) => setNewVm({...newVm, os: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="Ubuntu 22.04">Ubuntu 22.04 LTS</option>
                      <option value="Amazon Linux 2023">Amazon Linux 2023</option>
                      <option value="Windows Server 2022">Windows Server 2022</option>
                    </select>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Instance Type & Cost</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {instanceTiers.map(tier => (
                        <div 
                          key={tier.type}
                          onClick={() => setNewVm({...newVm, instance_type: tier.type})}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${
                              newVm.instance_type === tier.type 
                              ? 'bg-primary/20 border-primary shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' 
                              : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/80'
                          }`}
                        >
                            <div>
                                <div className="text-white font-medium text-sm">{tier.name} ({tier.type})</div>
                                <div className="text-xs text-slate-400 mt-1">{tier.cpu} vCPU • {tier.ram} GB RAM • {tier.storage} GB Storage</div>
                            </div>
                            <div className="text-yellow-400 font-semibold text-sm">
                                ${tier.cost.toFixed(2)}<span className="text-xs text-slate-500">/mo</span>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-lg">Launch Instance</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VirtualInstances;
