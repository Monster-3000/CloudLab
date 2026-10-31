import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import VirtualInstances from './pages/VirtualInstances';
import ArchitectureDesigner from './pages/ArchitectureDesigner';
import AutoScalingPrediction from './pages/AutoScalingPrediction';
// import NetworkLoad from './pages/NetworkLoad';
// import SecurityCenter from './pages/SecurityCenter';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';

import UsersManagement from './pages/UsersManagement';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// Admin Route Wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return <Navigate to="/login" replace />;
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'Administrator') {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    } catch {
        return <Navigate to="/login" replace />;
    }
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="designer" element={<ArchitectureDesigner />} />
          <Route path="instances" element={<VirtualInstances />} />
          <Route path="autoscaling" element={<AutoScalingPrediction />} />
          {/* Disabled pages: */}
          {/* <Route path="network" element={<NetworkLoad />} /> */}
          {/* <Route path="security" element={<SecurityCenter />} /> */}
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={
              <AdminRoute>
                  <UsersManagement />
              </AdminRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
