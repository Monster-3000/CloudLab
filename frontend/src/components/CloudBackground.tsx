import React from 'react';
import daySkyImg from '../assets/images/day_sky.png';

const CloudBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#87CEEB] z-0">
            {/* Base Layer: Slow panning background */}
            <div 
                className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%] bg-cover bg-center animate-[panBackground_20s_ease-in-out_infinite_alternate]"
                style={{ backgroundImage: `url(${daySkyImg})` }}
            />
            
            {/* Drifting Cloud Blobs Layer 1 (Fast) */}
            <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
                <div className="absolute top-[10%] -left-[50%] w-[150%] h-[50%] bg-white/40 rounded-[100%] blur-[100px] animate-[driftClouds_15s_linear_infinite]" />
                <div className="absolute top-[40%] -left-[50%] w-[120%] h-[60%] bg-white/30 rounded-[100%] blur-[120px] animate-[driftClouds_20s_linear_infinite]" style={{ animationDelay: '-5s' }} />
            </div>

            {/* Drifting Cloud Blobs Layer 2 (Super Fast, smaller) */}
            <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay">
                <div className="absolute bottom-[10%] -left-[50%] w-[100%] h-[40%] bg-white/50 rounded-[100%] blur-[80px] animate-[driftClouds_12s_linear_infinite]" style={{ animationDelay: '-2s' }} />
                <div className="absolute top-[20%] -left-[50%] w-[80%] h-[50%] bg-white/40 rounded-[100%] blur-[100px] animate-[driftClouds_18s_linear_infinite]" style={{ animationDelay: '-8s' }} />
            </div>

            <style>{`
                @keyframes panBackground {
                    0% { transform: scale(1) translate(0, 0); }
                    100% { transform: scale(1.15) translate(-2%, 2%); }
                }
                @keyframes driftClouds {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(200vw); }
                }
            `}</style>
        </div>
    );
};

export default CloudBackground;
