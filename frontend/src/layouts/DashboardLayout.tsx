import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import ChatbotHelper from '../components/ChatbotHelper';
import LiquidWaveBackground from '../components/LiquidWaveBackground';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <motion.div 
      initial={{ y: '50vh', opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.5 }}
      className="flex h-screen bg-[#070c17] overflow-hidden text-slate-200 selection:bg-cyan-500/30 relative"
    >
      {/* Liquid Teal/Cyan Wave & Blurry Blue Ambient Background */}
      <LiquidWaveBackground />

      {/* Glassmorphism Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative z-10">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 z-10 relative scroll-smooth custom-scrollbar">
          <Outlet />
        </main>
        <ChatbotHelper />
      </div>
    </motion.div>
  );
};

export default DashboardLayout;
