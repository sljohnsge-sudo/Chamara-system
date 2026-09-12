import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Package, Wrench, Calendar, CheckCircle2, Clock, 
  ArrowUpRight, BarChart3, ShieldCheck, Car, RefreshCw, CreditCard, AlertCircle, Eye, User, Phone
} from 'lucide-react';
import axios from 'axios';
import { getJobCards, getManagerAnalytics } from '../services/api';

export default function ManagerDashboard({ onNavigate, onViewJob }) {
  const [period, setPeriod] = useState('all'); // 'today' | 'week' | 'month' | 'year' | 'all'
  const [data, setData] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedPeriod) => {
    setLoading(true);
    try {
      const [analyticsRes, jobsRes] = await Promise.all([
        getManagerAnalytics(selectedPeriod),
        getJobCards()
      ]);
      setData(analyticsRes.data);
      setActiveJobs(jobsRes.data || []);
    } catch (err) {
      console.error('Error fetching manager analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const formatLKR = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 2
    }).format(amount || 0).replace('LKR', 'LKR ');
  };

  return (
    <div className="mgr-dashboard-wrapper">
      
      {/* EXECUTIVE HEADER & TIME PERIOD SELECTOR */}
      <div className="mgr-header-box">
        <div>
          <div className="mgr-header-badge">
            <ShieldCheck className="w-3.5 h-3.5" /> Executive Cockpit
          </div>
          <h1 className="mgr-header-title">
            PEUGEOT LAND BUSINESS & CASH ANALYTICS
          </h1>
          <p className="mgr-header-sub">Real-time revenue, historical cumulative sales, cash received, and profit analytics.</p>
        </div>

        {/* Time Period Filter Pills */}
        <div className="mgr-period-pills">
          <button
            onClick={() => setPeriod('all')}
            className={`mgr-period-btn ${period === 'all' ? 'active' : ''}`}
          >
            All History
          </button>
          <button
            onClick={() => setPeriod('today')}
            className={`mgr-period-btn ${period === 'today' ? 'active' : ''}`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`mgr-period-btn ${period === 'week' ? 'active' : ''}`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`mgr-period-btn ${period === 'month' ? 'active' : ''}`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`mgr-period-btn ${period === 'year' ? 'active' : ''}`}
          >
            This Year
          </button>

          <button
            onClick={() => fetchAnalytics(period)}
            title="Refresh Data"
            className="p-1.5 text-slate-500 hover:text-[#00a8e8] rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* EXECUTIVE FINANCIAL METRIC CARDS (GRID OF 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        
        {/* 1. TOTAL BUSINESS VALUE */}
        <div className="mgr-stat-card">
          <div className="mgr-stat-top">
            <span className="mgr-stat-label">TOTAL BUSINESS VALUE</span>
            <div className="mgr-stat-icon-box bg-sky-50 text-[#00a8e8]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mgr-stat-val-text">
            {formatLKR(data?.total_business_value)}
          </div>
          <div className="mgr-stat-desc-text">
            <span className="text-[#00a8e8] font-bold">Parts + Labour</span> total ({period})
          </div>
        </div>

        {/* 2. CASH RECEIVED (PAID INVOICES) */}
        <div 
          onClick={() => onNavigate && onNavigate('jobs-list')}
          className="mgr-stat-card bg-emerald-50/50 border-2 border-emerald-400 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="mgr-stat-top">
            <span className="mgr-stat-label text-emerald-900 font-extrabold">CASH RECEIVED (PAID)</span>
            <div className="mgr-stat-icon-box bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mgr-stat-val-text text-emerald-800">
            {formatLKR(data?.total_cash_received)}
          </div>
          <div className="mgr-stat-desc-text text-emerald-800 font-bold flex items-center justify-between">
            <span>Settled & Received</span>
            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-black text-[10px] flex items-center gap-1">
              {data?.paid_invoices_count || 0} Paid Invoices <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 3. PENDING RECEIVABLES (OPEN UNPAID INVOICES) */}
        <div 
          onClick={() => onNavigate && onNavigate('jobs-list')}
          className="mgr-stat-card bg-amber-50/50 border-2 border-amber-400 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="mgr-stat-top">
            <span className="mgr-stat-label text-amber-900 font-extrabold">OPEN UNPAID INVOICES</span>
            <div className="mgr-stat-icon-box bg-amber-100 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mgr-stat-val-text text-amber-800">
            {formatLKR(data?.total_pending_receivables)}
          </div>
          <div className="mgr-stat-desc-text text-amber-800 font-bold flex items-center justify-between">
            <span>Open Pending Receivables</span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-black text-[10px] flex items-center gap-1">
              {data?.unpaid_invoices_count || 0} Open Invoices <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 4. JOB CARD STATUSES */}
        <div className="mgr-stat-card">
          <div className="mgr-stat-top">
            <span className="mgr-stat-label">JOB CARD STATUSES</span>
            <div className="mgr-stat-icon-box bg-amber-50 text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mgr-stat-val-text flex items-baseline gap-2">
            <span className="text-amber-600">{data?.job_cards?.pending || 0}</span>
            <span className="text-xs font-bold text-slate-500">Pending</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600">{data?.job_cards?.closed || 0}</span>
            <span className="text-xs font-bold text-slate-500">Closed</span>
          </div>
          <div className="mgr-stat-desc-text flex items-center gap-1.5">
            <span className="text-sky-600 font-bold">{data?.job_cards?.open || 0} Open</span>
            <span>•</span>
            <span className="text-purple-600 font-bold">{data?.job_cards?.in_progress || 0} In Progress</span>
          </div>
        </div>

        {/* 5. SPARE PARTS ISSUED VALUE */}
        <div className="mgr-stat-card">
          <div className="mgr-stat-top">
            <span className="mgr-stat-label">SPARE PARTS ISSUED</span>
            <div className="mgr-stat-icon-box bg-purple-50 text-purple-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mgr-stat-val-text">
            {formatLKR(data?.parts_issued_value)}
          </div>
          <div className="mgr-stat-desc-text">
            Inventory stock issued to jobs
          </div>
        </div>

        {/* 6. ESTIMATED NET PROFIT */}
        <div className="mgr-stat-card mgr-stat-card-profit">
          <div className="mgr-stat-top">
            <span className="mgr-stat-label text-emerald-800">NET PROFIT & MARGIN</span>
            <div className="mgr-stat-icon-box bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mgr-stat-val-text text-emerald-700">
            {formatLKR(data?.net_profit)}
          </div>
          <div className="mgr-stat-desc-text flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="px-2 py-0.5 bg-emerald-100 rounded text-emerald-800">{data?.profit_margin_percent}% Margin</span>
            <span>Est. Net</span>
          </div>
        </div>

      </div>

      {/* NEW SECTION: ACTIVE WORKSHOP OPEN JOB CARDS & INVOICES (LIVE QUICK VIEW) */}
      <div className="mgr-panel-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="mgr-panel-title">
            <Wrench className="w-4.5 h-4.5 text-[#00a8e8]" /> Active Open Job Cards & Invoices Direct View
          </h2>
          <button 
            onClick={() => onNavigate && onNavigate('jobs-list')}
            className="text-xs text-[#00a8e8] font-extrabold hover:underline cursor-pointer flex items-center gap-1"
          >
            View Full Job Cards Board <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="mgr-table">
            <thead>
              <tr>
                <th>Job #</th>
                <th>Customer Name</th>
                <th>Vehicle Reg & Model</th>
                <th>Repair Description</th>
                <th style={{ textAlign: 'center' }}>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Invoice Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeJobs && activeJobs.length > 0 ? (
                activeJobs.slice(0, 5).map((job) => {
                  const partsTotal = job.inventory_issues?.reduce((sum, item) => sum + parseFloat(item.total_price), 0) || 0;
                  const labourTotal = parseFloat(job.labour_charge || 0);
                  const grandTotal = partsTotal + labourTotal;

                  return (
                    <tr key={job.id}>
                      <td className="font-mono font-black text-[#00a8e8]">
                        {job.job_number}
                      </td>
                      <td className="font-bold text-slate-900">
                        {job.customer?.name}
                        <div className="text-[10px] text-slate-400 font-normal">📞 {job.customer?.phone}</div>
                      </td>
                      <td>
                        <span className="font-extrabold text-slate-900">{job.vehicle?.vehicle_number}</span>
                        <div className="text-[10px] text-slate-500">{job.vehicle?.make_model}</div>
                      </td>
                      <td className="text-slate-600 max-w-xs truncate">
                        {job.repair_fault}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          job.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {job.payment_status === 'paid' ? `✓ PAID (${job.payment_method || 'Cash'})` : 'UNPAID'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-black text-[#00a8e8]">
                        LKR {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => onViewJob && onViewJob(job.id)}
                          className="px-3 py-1.5 bg-[#00a8e8] hover:bg-[#008cc9] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-6">
                    No active open job cards currently in workshop.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="mgr-main-grid">
        
        {/* LEFT COLUMN: TOP SPARE PARTS & MODEL BREAKDOWN */}
        <div className="space-y-6">
          
          {/* Top Moving Spare Parts Table */}
          <div className="mgr-panel-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="mgr-panel-title">
                <Package className="w-4 h-4 text-[#00a8e8]" /> Top Moving Spare Parts ({period})
              </h2>
              <button 
                onClick={() => onNavigate && onNavigate('inventory')}
                className="text-xs text-[#00a8e8] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                View All Stock <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'center' }}>Units Issued</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.top_spare_parts && data.top_spare_parts.length > 0 ? (
                    data.top_spare_parts.map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-slate-900">{item.item_name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md font-bold text-xs">
                            {item.quantity} units
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }} className="font-bold text-[#00a8e8]">
                          {formatLKR(item.revenue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center text-slate-400 py-6">
                        No spare parts issued during this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Peugeot Models Volume Breakdown */}
          <div className="mgr-panel-card">
            <h2 className="mgr-panel-title">
              <Car className="w-4 h-4 text-[#00a8e8]" /> Vehicle Model Servicing Volume
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.top_vehicle_models && data.top_vehicle_models.length > 0 ? (
                data.top_vehicle_models.map((vm, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <div className="font-bold text-xs text-slate-900">{vm.make_model}</div>
                    <span className="px-2.5 py-1 bg-sky-100 text-[#00a8e8] rounded-md font-extrabold text-xs">
                      {vm.count} Job Cards
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs py-4">No vehicle model data available.</div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: QUICK METRIC REVENUE SUMMARY */}
        <div className="space-y-6">
          <div className="mgr-panel-card">
            <h2 className="mgr-panel-title">
              <BarChart3 className="w-4 h-4 text-[#00a8e8]" /> Financial Overview Summary
            </h2>
            
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Labour Charges Revenue:</span>
                <span className="font-bold text-slate-900">{formatLKR(data?.labour_revenue)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Spare Parts Retail Revenue:</span>
                <span className="font-bold text-slate-900">{formatLKR(data?.parts_issued_value)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Est. Cost of Goods Sold (65%):</span>
                <span className="font-bold text-red-600">- {formatLKR(data?.estimated_parts_cost)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Est. Workshop Overhead (20% Labour):</span>
                <span className="font-bold text-red-600">- {formatLKR((data?.labour_revenue || 0) * 0.20)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-emerald-50 px-3 rounded-xl border border-emerald-200 text-emerald-900 font-bold">
                <span>Net Operating Profit:</span>
                <span className="text-sm font-black">{formatLKR(data?.net_profit)}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate && onNavigate('jobs-list')}
                className="w-full py-2.5 bg-[#00a8e8] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#00a8e8]/30 hover:bg-[#008cc9] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" /> Manage Active Job Cards & Invoices
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
