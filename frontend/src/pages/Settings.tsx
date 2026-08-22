import { Key, Bell } from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Platform Settings</h2>
        <p className="text-slate-400 mt-1">Manage your account, API keys, and workspace preferences.</p>
      </div>

      <div className="glass-card p-6 space-y-6">
          <div className="flex items-center space-x-4 border-b border-slate-700/50 pb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  JD
              </div>
              <div>
                  <h3 className="text-xl font-bold text-white">Admin User</h3>
                  <p className="text-slate-400 text-sm">admin@cloudlab.local • Administrator</p>
              </div>
              <div className="flex-1 text-right">
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg transition-colors text-sm">
                      Edit Profile
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="space-y-4">
                  <h4 className="text-white font-semibold flex items-center"><Key className="w-4 h-4 mr-2 text-primary" /> API Access</h4>
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                      <p className="text-sm text-slate-400 mb-3">Generate tokens to interact with the CloudLab API programmatically.</p>
                      <button className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors text-sm w-full">
                          Generate New API Key
                      </button>
                  </div>
              </div>
              
              <div className="space-y-4">
                  <h4 className="text-white font-semibold flex items-center"><Bell className="w-4 h-4 mr-2 text-yellow-400" /> Notifications</h4>
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm text-slate-300">Billing Alerts (Over $500/mo)</span>
                          <input type="checkbox" defaultChecked className="toggle-checkbox" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm text-slate-300">Security Incident Alerts</span>
                          <input type="checkbox" defaultChecked className="toggle-checkbox" />
                      </label>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Settings;
