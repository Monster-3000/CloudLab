import React from 'react';
import { useLocation } from 'react-router-dom';

const LiquidWaveBackground: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Custom accent configuration per tab route
  const getTabGlowAccent = () => {
    switch (path) {
      case '/':
        return {
          blueOrb: 'bg-blue-600/35 blur-[160px]',
          tealOrb: 'bg-cyan-500/30 blur-[140px]',
          wavePrimary: '#1fa7b3',
          waveSecondary: '#0f6874'
        };
      case '/designer':
        return {
          blueOrb: 'bg-blue-500/30 blur-[150px]',
          tealOrb: 'bg-teal-400/30 blur-[130px]',
          wavePrimary: '#25b5c0',
          waveSecondary: '#12737d'
        };
      case '/instances':
        return {
          blueOrb: 'bg-sky-600/35 blur-[170px]',
          tealOrb: 'bg-emerald-500/25 blur-[150px]',
          wavePrimary: '#1a9ba7',
          waveSecondary: '#0d5762'
        };
      case '/network':
        return {
          blueOrb: 'bg-blue-700/40 blur-[160px]',
          tealOrb: 'bg-cyan-400/35 blur-[140px]',
          wavePrimary: '#38d2dd',
          waveSecondary: '#167a84'
        };
      case '/security':
        return {
          blueOrb: 'bg-indigo-600/35 blur-[150px]',
          tealOrb: 'bg-teal-500/30 blur-[140px]',
          wavePrimary: '#1ca0ab',
          waveSecondary: '#0c525b'
        };
      default:
        return {
          blueOrb: 'bg-blue-600/30 blur-[150px]',
          tealOrb: 'bg-cyan-500/25 blur-[140px]',
          wavePrimary: '#208b94',
          waveSecondary: '#0e4f55'
        };
    }
  };

  const accent = getTabGlowAccent();

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Luminous Blurry Blue & Teal Ambient Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full ${accent.blueOrb} transition-all duration-700 pointer-events-none`} />
      <div className={`absolute bottom-[-15%] right-[-10%] w-[750px] h-[750px] rounded-full ${accent.tealOrb} transition-all duration-700 pointer-events-none`} />
      <div className="absolute top-[35%] right-[20%] w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[150px] transition-all duration-700 pointer-events-none" />

      {/* 2. Liquid Flowing Wave Ribbons Vector (Matching attached reference image) */}
      <svg className="w-full h-full object-cover opacity-60 transition-opacity duration-700" preserveAspectRatio="none" viewBox="0 0 1440 900" fill="none">
        <defs>
          <linearGradient id="liquidGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent.wavePrimary} stopOpacity="0.75" />
            <stop offset="50%" stopColor="#146d76" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#083138" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="liquidGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38d2dd" stopOpacity="0.65" />
            <stop offset="60%" stopColor={accent.waveSecondary} stopOpacity="0.5" />
            <stop offset="100%" stopColor="#072228" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="blueGlowWave" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
          </linearGradient>

          <filter id="softBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="15" />
          </filter>
        </defs>

        {/* Deep Background Liquid Wave Layer */}
        <path 
          d="M 0 350 C 320 200, 640 450, 960 250 C 1280 50, 1380 300, 1440 220 L 1440 900 L 0 900 Z" 
          fill="url(#liquidGrad1)"
        />

        {/* Midground Flowing Ribbon Ribbon Layer */}
        <path 
          d="M 0 500 C 250 350, 500 620, 800 420 C 1100 220, 1320 480, 1440 380 L 1440 900 L 0 900 Z" 
          fill="url(#liquidGrad2)" 
        />

        {/* Foreground Luminous Blue Blurry Ribbon Stream */}
        <path 
          d="M 0 620 C 350 480, 700 720, 1050 540 C 1280 400, 1390 600, 1440 520 L 1440 900 L 0 900 Z" 
          fill="url(#blueGlowWave)"
          filter="url(#softBlur)"
        />

        {/* Dynamic Curved Ribbon Lines */}
        <path 
          d="M -100 280 C 300 120, 700 380, 1100 180 C 1300 80, 1480 240, 1540 180" 
          stroke="#42e3ee" 
          strokeWidth="3" 
          strokeOpacity="0.3" 
          fill="none" 
        />
        <path 
          d="M -100 420 C 250 280, 650 520, 1050 320 C 1250 220, 1450 380, 1540 320" 
          stroke="#3b82f6" 
          strokeWidth="2.5" 
          strokeOpacity="0.35" 
          fill="none" 
        />
      </svg>
    </div>
  );
};

export default LiquidWaveBackground;
