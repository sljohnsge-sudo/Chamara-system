import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import logoImg from '../assets/peugeot_land_logo.png';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Workshop Manager');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or Employee ID.');
      return;
    }
    setError(null);
    onLogin({ username, role });
  };

  const handleQuickLogin = (demoRole, demoName) => {
    setUsername(demoName);
    setPassword('demo1234');
    setRole(demoRole);
    onLogin({ username: demoName, role: demoRole });
  };

  return (
    <div className="min-h-screen w-full bg-[#040812] text-slate-100 relative overflow-hidden font-sans selection:bg-[#00a8e8] selection:text-white flex flex-col justify-between">
      
      {/* BACKGROUND GRADIENT & AUTOMOTIVE NEON ATMOSPHERE */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#03060f] via-[#071122] to-[#0c1830]" />
        
        {/* Soft Cyan Glow Orbs */}
        <div className="absolute top-1/4 left-1/3 w-[650px] h-[650px] bg-[#00a8e8]/15 rounded-full blur-[170px]" />
        <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[150px]" />

        {/* Abstract Grid SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <pattern id="login-hero-grid-clean" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00a8e8" strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#login-hero-grid-clean)" />
        </svg>
      </div>

      {/* TOP HEADER */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-8 sm:px-12 py-6 flex items-center justify-between" style={{ paddingLeft: '1.2cm' }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00a8e8]/15 border border-[#00a8e8]/30 text-[#00a8e8] text-xs font-extrabold uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Peugeot Land Official System
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="text-[#00a8e8] font-bold">Gorakapola, Panadura</span>
          <span>•</span>
          <span className="text-slate-400">Hotline: 0775101292</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-8 sm:px-12 lg:px-16 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* ========================================================================= */}
        {/* LEFT SIDE HERO TEXT                                                       */}
        {/* ========================================================================= */}
        <div 
          className="lg:col-span-6 space-y-6 max-w-xl mx-auto lg:mx-0"
          style={{ marginLeft: '1cm', paddingLeft: '0.5cm' }}
        >
          
          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.15] font-['Space_Grotesk']">
              PEUGEOT LAND <br />
              <span className="bg-gradient-to-r from-[#00a8e8] via-sky-300 to-white bg-clip-text text-transparent">
                Repair & Invoice Portal
              </span>
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Authorized Peugeot workshop management platform. Efficiently open job cards, issue spare parts from stock, compute labour charges, and generate official customer invoices.
          </p>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDE: CLEAN WHITE LOGIN CARD                                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="login-card-box">
            
            {/* SINGLE Official Logo Placement */}
            <div className="login-logo-header">
              <div className="login-logo-frame">
                <img
                  src={logoImg}
                  alt="Peugeot Land Logo"
                  className="h-12 w-auto object-contain mix-blend-multiply"
                />
              </div>
              <h2 className="login-title-text">
                PEUGEOT LAND (PVT) LTD
              </h2>
              <p className="login-subtitle-text">Sign in to your workshop account</p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* Role Selection */}
              <div className="login-field-group">
                <label className="login-field-label">
                  SELECT PORTAL ROLE
                </label>
                <select
                  className="login-input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Workshop Manager">Workshop Manager</option>
                  <option value="Service Advisor">Service Advisor</option>
                  <option value="Master Technician">Master Technician</option>
                  <option value="Inventory Officer">Inventory Officer</option>
                </select>
              </div>

              {/* Username Input */}
              <div className="login-field-group">
                <label className="login-field-label">
                  EMPLOYEE USERNAME / ID
                </label>
                <input
                  type="text"
                  required
                  className="login-input-field"
                  placeholder="e.g. chamara.admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Password Input */}
              <div className="login-field-group">
                <label className="login-field-label">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  className="login-input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Remember Me & Reset Password */}
              <div className="login-remember-row">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#00a8e8] focus:ring-[#00a8e8]"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[#00a8e8] hover:underline cursor-pointer font-bold">Reset key?</span>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                className="login-submit-btn"
              >
                <span>SIGN IN TO SYSTEM</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>

            {/* Quick Demo Login Shortcut Pills */}
            <div className="login-demo-section">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                1-Click Demo Quick Access
              </div>
              <div className="login-demo-grid">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Workshop Manager', 'Manager Chamara')}
                  className="login-demo-btn"
                >
                  Manager Login
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Master Technician', 'Tech Nimal')}
                  className="login-demo-btn"
                >
                  Technician Login
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-[10px] text-slate-400 font-medium">
              Peugeot Land Workshop System v2.6 | Connected to XAMPP MySQL
            </div>

          </div>
        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-20 max-w-7xl mx-auto w-full px-8 sm:px-12 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-800/80" style={{ paddingLeft: '1.2cm' }}>
        <div>&copy; 2026 Peugeot Land (Pvt) Ltd. All Rights Reserved.</div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span>Gorakapola, Panadura</span>
          <span>•</span>
          <span className="text-[#00a8e8] font-bold">Hotline: 0775101292 / 0779980747</span>
        </div>
      </footer>

    </div>
  );
}
