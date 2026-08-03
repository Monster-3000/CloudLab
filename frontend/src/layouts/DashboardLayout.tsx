import React from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden text-slate-200 selection:bg-primary/30">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative">
        {/* Background ambient glow - Adds premium feel */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none z-0" />
        
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 z-10 relative scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
