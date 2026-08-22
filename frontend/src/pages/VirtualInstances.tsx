import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Plus, Trash2, Cpu, HardDrive, Zap, Layers } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

export interface VirtualMachineType {
  id: number;
  name: string;
  instance_type: string;
  category?: string;
  monthly_cost: number;
  hourly_cost?: number;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  network_perf?: string;
  architecture?: string;
  os: string;
  region: string;
  vendor: string;
  status: string;
  ip_address?: string;
}

export interface InstanceTier {
  type: string;
  name: string;
  category: string;
  vendor: string;
  cpu: number;
  ram: number;
  storage: number;
  cost: number;
  hourly: number;
  network: string;
  arch: string;
}

const instanceTiers: InstanceTier[] = [
  // AWS General Purpose
  { type: 't4g.nano', name: 'AWS Graviton2 Micro', category: 'General Purpose', vendor: 'AWS', cpu: 2, ram: 0.5, storage: 10, cost: 3.10, hourly: 0.0042, network: 'Up to 5 Gbps', arch: 'ARM64 (Graviton2)' },
  { type: 't3.micro', name: 'General Purpose Micro', category: 'General Purpose', vendor: 'AWS', cpu: 2, ram: 1, storage: 20, cost: 7.60, hourly: 0.0104, network: 'Up to 5 Gbps', arch: 'x86_64' },
  { type: 't3.small', name: 'General Purpose Small', category: 'General Purpose', vendor: 'AWS', cpu: 2, ram: 2, storage: 30, cost: 15.20, hourly: 0.0208, network: 'Up to 5 Gbps', arch: 'x86_64' },
  { type: 't3.medium', name: 'General Purpose Medium', category: 'General Purpose', vendor: 'AWS', cpu: 2, ram: 4, storage: 40, cost: 30.40, hourly: 0.0416, network: 'Up to 5 Gbps', arch: 'x86_64' },
  { type: 'm6i.large', name: 'AWS General Purpose Large', category: 'General Purpose', vendor: 'AWS', cpu: 2, ram: 8, storage: 50, cost: 70.08, hourly: 0.096, network: 'Up to 12.5 Gbps', arch: 'x86_64' },
  { type: 'm6g.xlarge', name: 'AWS Graviton3 Enterprise', category: 'General Purpose', vendor: 'AWS', cpu: 4, ram: 16, storage: 100, cost: 112.32, hourly: 0.154, network: 'Up to 12.5 Gbps', arch: 'ARM64 (Graviton3)' },

  // AWS Compute Optimized
  { type: 'c6i.large', name: 'AWS Compute Optimized', category: 'Compute', vendor: 'AWS', cpu: 2, ram: 4, storage: 50, cost: 62.05, hourly: 0.085, network: 'Up to 12.5 Gbps', arch: 'x86_64' },
  { type: 'c6g.xlarge', name: 'AWS Compute Graviton3', category: 'Compute', vendor: 'AWS', cpu: 4, ram: 8, storage: 100, cost: 99.28, hourly: 0.136, network: 'Up to 12.5 Gbps', arch: 'ARM64 (Graviton3)' },

  // AWS Memory Optimized
  { type: 'r6i.large', name: 'AWS Memory Optimized', category: 'Memory', vendor: 'AWS', cpu: 2, ram: 16, storage: 100, cost: 91.98, hourly: 0.126, network: 'Up to 12.5 Gbps', arch: 'x86_64' },
  { type: 'r6g.xlarge', name: 'AWS Memory Graviton3', category: 'Memory', vendor: 'AWS', cpu: 4, ram: 32, storage: 200, cost: 147.16, hourly: 0.2016, network: 'Up to 12.5 Gbps', arch: 'ARM64 (Graviton3)' },

  // AWS Storage & GPU
  { type: 'i3en.large', name: 'AWS NVMe Storage High-I/O', category: 'Storage', vendor: 'AWS', cpu: 2, ram: 16, storage: 1250, cost: 168.00, hourly: 0.230, network: 'Up to 25 Gbps', arch: 'x86_64' },
  { type: 'g5.xlarge', name: 'AWS NVIDIA A10G Tensor GPU', category: 'GPU / AI', vendor: 'AWS', cpu: 4, ram: 16, storage: 250, cost: 734.40, hourly: 1.006, network: 'Up to 25 Gbps', arch: 'x86_64' },
  { type: 'db.r6g.large', name: 'AWS RDS PostgreSQL Primary', category: 'Database', vendor: 'AWS', cpu: 2, ram: 16, storage: 200, cost: 146.00, hourly: 0.20, network: 'Up to 12.5 Gbps', arch: 'ARM64 (Graviton3)' },

  // Multi-cloud parity options
  { type: 'Standard_D2s_v5', name: 'Azure General Purpose D2s', category: 'General Purpose', vendor: 'Azure', cpu: 2, ram: 8, storage: 64, cost: 70.00, hourly: 0.096, network: '4 Gbps', arch: 'x86_64' },
  { type: 'n2-standard-4', name: 'GCP N2 Standard Compute', category: 'General Purpose', vendor: 'GCP', cpu: 4, ram: 16, storage: 100, cost: 114.50, hourly: 0.156, network: '10 Gbps', arch: 'x86_64' }
];

const categories = ['All', 'General Purpose', 'Compute', 'Memory', 'Storage', 'GPU / AI', 'Database'];

const VirtualInstances: React.FC = () => {
  const [vms, setVms] = useState<VirtualMachineType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';
  const actionParam = searchParams.get('action');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(actionParam === 'create');
  
  const [newVm, setNewVm] = useState({
    name: '',
    vendor: 'AWS',
    instance_type: 't3.medium',
    os: 'Ubuntu 22.04 LTS',
    region: 'us-east-1'
  });

  const fetchVms = async () => {
    try {
      const response = await api.get<VirtualMachineType[]>('/vms');
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedTier = instanceTiers.find(t => t.type === newVm.instance_type) || instanceTiers[3];
      const payload = {
        ...newVm,
        category: selectedTier.category,
        cpu_cores: selectedTier.cpu,
        ram_gb: selectedTier.ram,
        storage_gb: selectedTier.storage,
        monthly_cost: selectedTier.cost,
        hourly_cost: selectedTier.hourly,
        network_perf: selectedTier.network,
        architecture: selectedTier.arch
      };
      await api.post('/vms', payload);
      setIsModalOpen(false);
      fetchVms();
    } catch (error) {
      console.error("Failed to create VM", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/vms/${id}`);
      fetchVms();
    } catch (error) {
      console.error("Failed to delete VM", error);
    }
  };

  const getVendorColor = (vendor: string) => {
    switch(vendor) {
      case 'AWS': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Azure': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'GCP': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch(cat) {
      case 'Compute': return 'text-purple-300 bg-purple-500/10 border-purple-500/30';
      case 'Memory': return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
      case 'Storage': return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
      case 'GPU / AI': return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      case 'Database': return 'text-pink-300 bg-pink-500/10 border-pink-500/30';
      default: return 'text-blue-300 bg-blue-500/10 border-blue-500/30';
    }
  };

  const filteredVms = vms.filter(vm => {
    const matchesSearch = vm.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
      vm.instance_type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      vm.vendor.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (vm.category && vm.category.toLowerCase().includes(searchFilter.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || vm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableModalTiers = instanceTiers.filter(t => t.vendor === newVm.vendor);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            <span>Virtual Instances & AWS Services</span>
          </h2>
          <p className="text-slate-400 mt-1">
            Manage and provision cloud instances powered by updated AWS EC2 & cloud dataset specifications.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        >
          <Plus className="w-5 h-5" />
          <span>Launch AWS Instance</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Category:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-primary text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Instances Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/70 text-slate-300 border-b border-slate-700/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Instance Name</th>
                <th className="px-6 py-4 font-semibold">Vendor & Plan Type</th>
                <th className="px-6 py-4 font-semibold">Category & Arch</th>
                <th className="px-6 py-4 font-semibold">Specs (vCPU / RAM / Disk)</th>
                <th className="px-6 py-4 font-semibold">Est. Cost</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading instances dataset...</td></tr>
              ) : filteredVms.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">
                  {searchFilter ? `No instances found matching "${searchFilter}".` : 'No instances found in this category. Launch one to get started!'}
                </td></tr>
              ) : (
                filteredVms.map((vm, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={vm.id} 
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-primary">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{vm.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                            <span>{vm.ip_address || '192.168.1.100'}</span>
                            <span>• {vm.region}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-max border ${getVendorColor(vm.vendor)}`}>
                          {vm.vendor}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-300">{vm.instance_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold w-max border ${getCategoryBadge(vm.category || 'General Purpose')}`}>
                          {vm.category || 'General Purpose'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          {vm.architecture || 'x86_64'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <span>{vm.cpu_cores} vCPU</span>
                          <span className="text-slate-500">•</span>
                          <span>{vm.ram_gb} GB RAM</span>
                        </div>
                        <div className="text-slate-400 flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          <span>{vm.storage_gb} GB Storage</span>
                          {vm.network_perf && <span className="text-slate-500">({vm.network_perf})</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-yellow-400 font-semibold text-sm">
                          ${vm.monthly_cost ? vm.monthly_cost.toFixed(2) : '14.50'}<span className="text-xs text-slate-500">/mo</span>
                        </div>
                        {vm.hourly_cost && (
                          <div className="text-[11px] text-slate-400">
                            ${vm.hourly_cost.toFixed(4)}/hr
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(vm.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete Instance"
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

      {/* Launch Instance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-2xl p-6 border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>Launch AWS & Cloud Service Instance</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select from updated cloud service plans and deployment configurations.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Instance Name</label>
                <input 
                  type="text" 
                  required
                  value={newVm.name}
                  onChange={(e) => setNewVm({...newVm, name: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                  placeholder="e.g. aws-ec2-web-prod-01"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Cloud Vendor</label>
                  <select 
                    value={newVm.vendor}
                    onChange={(e) => {
                      const v = e.target.value;
                      const defaultTier = instanceTiers.find(t => t.vendor === v) || instanceTiers[0];
                      setNewVm({...newVm, vendor: v, instance_type: defaultTier.type});
                    }}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                  >
                    <option value="AWS">Amazon Web Services (AWS)</option>
                    <option value="Azure">Microsoft Azure</option>
                    <option value="GCP">Google Cloud Platform</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Operating System</label>
                  <select 
                    value={newVm.os}
                    onChange={(e) => setNewVm({...newVm, os: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                  >
                    <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS</option>
                    <option value="Amazon Linux 2023">Amazon Linux 2023</option>
                    <option value="Red Hat Enterprise Linux 9">Red Hat Enterprise Linux 9</option>
                    <option value="Windows Server 2022">Windows Server 2022</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select Service Tier / Plan</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {availableModalTiers.map(tier => (
                    <div 
                      key={tier.type}
                      onClick={() => setNewVm({...newVm, instance_type: tier.type})}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                        newVm.instance_type === tier.type 
                        ? 'bg-primary/20 border-primary shadow-[inset_0_0_12px_rgba(59,130,246,0.3)]' 
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">{tier.name}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">{tier.type}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${getCategoryBadge(tier.category)}`}>{tier.category}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>{tier.cpu} vCPU</span> • 
                          <span>{tier.ram} GB RAM</span> • 
                          <span>{tier.storage} GB Storage</span> • 
                          <span className="text-slate-500">{tier.arch}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold text-sm">
                          ${tier.cost.toFixed(2)}<span className="text-xs text-slate-500">/mo</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ${tier.hourly.toFixed(4)}/hr
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-lg text-sm"
                >
                  Launch Instance
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VirtualInstances;


