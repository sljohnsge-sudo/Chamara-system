import React from 'react';
import logoImg from '../assets/peugeot_land_logo.png';

export default function PeugeotLogo({ className = "w-28 h-20", lightMode = false, showBadge = true }) {
  return (
    <div className={`inline-flex items-center justify-center relative ${className}`}>
      <div className={`p-1.5 rounded-2xl transition-all flex items-center justify-center ${
        lightMode 
          ? 'bg-white border border-slate-200 shadow-sm' 
          : 'bg-white/95 backdrop-blur-md border border-[#00a8e8]/40 shadow-lg shadow-[#00a8e8]/20'
      }`}>
        <img
          src={logoImg}
          alt="Peugeot Land Official Logo"
          className="max-h-full max-w-full object-contain mix-blend-multiply filter contrast-125 brightness-95"
        />
      </div>
    </div>
  );
}
