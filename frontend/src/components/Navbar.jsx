import React from 'react';
import { LayoutDashboard, PlusCircle, ClipboardList, Package, LogOut, UserCheck, FileText } from 'lucide-react';
import logoImg from '../assets/peugeot_land_logo.png';

export default function Navbar({ activeTab, setActiveTab, openJobsCount, user, onLogout }) {
  return (
    <header className="no-print nav-bar-card">
      
      {/* Top Peugeot Land Cyan Brand Banner */}
      <div className="nav-top-banner">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white rounded-xl shadow-sm border border-white">
            <img
              src={logoImg}
              alt="Peugeot Land Official Logo"
              className="h-9 w-auto object-contain mix-blend-multiply"
            />
          </div>
          <span className="font-extrabold text-base tracking-wider uppercase font-['Space_Grotesk'] text-white">
            PEUGEOT LAND (PVT) LTD
          </span>
        </div>

        <div className="text-xs font-semibold bg-white/20 px-3.5 py-1.5 rounded-full text-white">
          Gorakapola, Panadura | Hotline: 0775101292 / 0779980747
        </div>
      </div>

      {/* Navigation & User Controls Bar */}
      <div className="nav-controls-row">
        
        {/* Navigation Tab Pills */}
        <nav className="nav-pills-container">
          
          {/* Executive Dashboard Tab (Available only for Manager) */}
          {(user?.role === 'Workshop Manager' || user?.role === 'Admin') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-pill-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Manager Dashboard</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('new-job')}
            className={`nav-pill-btn ${activeTab === 'new-job' ? 'active' : ''}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Open New Job Card</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs-list')}
            className={`nav-pill-btn ${activeTab === 'jobs-list' ? 'active' : ''}`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Active Job Cards / Invoices</span>
            {openJobsCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] bg-sky-100 text-[#00a8e8] font-black rounded-full border border-sky-300">
                {openJobsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`nav-pill-btn ${activeTab === 'quotations' ? 'active' : ''}`}
          >
            <FileText className="w-4 h-4" />
            <span>Quotations & Estimates</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`nav-pill-btn ${activeTab === 'customers' ? 'active' : ''}`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Customer History</span>
          </button>

          {/* Inventory Stock Tab (Hidden for Technician) */}
          {user?.role !== 'Master Technician' && user?.role !== 'Technician' && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`nav-pill-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory Stock</span>
            </button>
          )}
        </nav>

        {/* User Profile & Logout Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="nav-user-badge">
              <UserCheck className="w-4 h-4 text-[#00a8e8]" />
              <div>
                <div className="font-extrabold text-slate-900 text-xs leading-none">{user.username}</div>
                <div className="text-[10px] text-slate-500 font-semibold leading-none mt-1">{user.role}</div>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="nav-logout-btn"
            title="Sign Out of Workshop System"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

      </div>

    </header>
  );
}
