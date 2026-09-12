import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Eye, Car, User, Clock, AlertCircle, Wrench, 
  FileText, CheckCircle, CreditCard, Phone, ShieldCheck, X, RotateCcw,
  SlidersHorizontal, CheckCircle2, LayoutGrid, List, ArrowUpDown,
  ChevronLeft, ChevronRight, PackageCheck, Calendar, Layers, Activity,
  DollarSign
} from 'lucide-react';
import { getJobCards, updateJobStatus } from '../services/api';
import PaymentConfirmModal from './PaymentConfirmModal';

/* ─────────────────────────── DESIGN TOKENS (WHITE, BLUE, YELLOW, GREEN) ─────────────────────────── */
const C = {
  white: '#ffffff',
  pageBg: '#f8fafc',
  cardBg: '#ffffff',
  
  // Peugeot Blue / Cyan
  blue: '#00a8e8',
  blueDark: '#008cc9',
  blueLight: '#f0f9ff',
  blueBorder: '#bae6fd',
  
  // Yellow / Amber
  yellow: '#d97706',
  yellowDark: '#b45309',
  yellowLight: '#fffbeb',
  yellowBorder: '#fde68a',
  
  // Green / Emerald
  green: '#059669',
  greenDark: '#047857',
  greenLight: '#ecfdf5',
  greenBorder: '#a7f3d0',
  
  // Neutrals / Slate
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
};

const fmtLKR = (val) => `Rs. ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function JobCardList({ onViewJob, onOpenJobInEditor }) {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [loading, setLoading] = useState(false);
  const [selectedPayJob, setSelectedPayJob] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchJobs = () => {
    setLoading(true);
    getJobCards(search, statusFilter, paymentFilter)
      .then(res => {
        setJobs(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
    setCurrentPage(1);
  }, [search, statusFilter, paymentFilter]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, { status: newStatus });
      fetchJobs();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const hasActiveFilters = Boolean(search || statusFilter || paymentFilter || sortBy !== 'newest');

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentFilter('');
    setSortBy('newest');
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: C.yellowLight, color: C.yellowDark, border: `1px solid ${C.yellowBorder}`,
            borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800
          }}>
            <Clock size={12} color={C.yellow} /> Open
          </span>
        );
      case 'In-Progress':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: C.blueLight, color: '#0369a1', border: `1px solid ${C.blueBorder}`,
            borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800
          }}>
            <Wrench size={12} color={C.blue} /> In-Progress
          </span>
        );
      case 'Pending Parts':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: C.yellowLight, color: C.yellowDark, border: `1px solid ${C.yellowBorder}`,
            borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800
          }}>
            <AlertCircle size={12} color={C.yellow} /> Pending Parts
          </span>
        );
      case 'Completed':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: C.greenLight, color: C.greenDark, border: `1px solid ${C.greenBorder}`,
            borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 900
          }}>
            <CheckCircle2 size={12} color={C.green} /> Completed
          </span>
        );
      case 'Delivered':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: C.blueLight, color: '#0369a1', border: `1px solid ${C.blueBorder}`,
            borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800
          }}>
            <PackageCheck size={12} color={C.blue} /> Delivered
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: C.slate100, color: C.slate700, border: `1px solid ${C.slate200}`,
            borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700
          }}>
            {status}
          </span>
        );
    }
  };

  // Live Statistics
  const stats = useMemo(() => {
    const total = jobs.length;
    let openOrProgress = 0;
    let unpaidCount = 0;
    let unpaidSum = 0;
    let paidCount = 0;
    let paidSum = 0;

    jobs.forEach(j => {
      const parts = j.inventory_issues?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) || 0;
      const labour = parseFloat(j.labour_charge || 0);
      const grand = parts + labour;

      if (j.status === 'Open' || j.status === 'In-Progress' || j.status === 'Pending Parts') {
        openOrProgress++;
      }
      if (j.payment_status === 'paid') {
        paidCount++;
        paidSum += grand;
      } else {
        unpaidCount++;
        unpaidSum += grand;
      }
    });

    return { total, openOrProgress, unpaidCount, unpaidSum, paidCount, paidSum };
  }, [jobs]);

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    const counts = { '': jobs.length, 'Open': 0, 'In-Progress': 0, 'Pending Parts': 0, 'Completed': 0, 'Delivered': 0 };
    jobs.forEach(j => {
      if (counts[j.status] !== undefined) {
        counts[j.status]++;
      }
    });
    return counts;
  }, [jobs]);

  // Sorting
  const sortedJobs = useMemo(() => {
    let list = [...jobs];
    if (sortBy === 'newest') {
      list.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'amount-high') {
      list.sort((a, b) => {
        const totalA = (a.inventory_issues?.reduce((s, i) => s + parseFloat(i.total_price || 0), 0) || 0) + parseFloat(a.labour_charge || 0);
        const totalB = (b.inventory_issues?.reduce((s, i) => s + parseFloat(i.total_price || 0), 0) || 0) + parseFloat(b.labour_charge || 0);
        return totalB - totalA;
      });
    } else if (sortBy === 'customer') {
      list.sort((a, b) => (a.customer?.name || '').localeCompare(b.customer?.name || ''));
    }
    return list;
  }, [jobs, sortBy]);

  // Paginated Jobs
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedJobs.slice(start, start + itemsPerPage);
  }, [sortedJobs, currentPage, itemsPerPage]);

  const statusOptions = [
    { label: 'All Jobs', value: '' },
    { label: 'Open', value: 'Open' },
    { label: 'In-Progress', value: 'In-Progress' },
    { label: 'Pending Parts', value: 'Pending Parts' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Delivered', value: 'Delivered' }
  ];

  return (
    <div style={{ width: '100%', paddingBottom: 80, fontFamily: 'Outfit, sans-serif' }}>
      
      {/* ────────────────── 1. EXECUTIVE HEADER BANNER ────────────────── */}
      <div style={{
        background: C.white,
        border: `2px solid ${C.slate200}`,
        borderLeft: `8px solid ${C.blue}`,
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: C.blueLight, border: `1px solid ${C.blueBorder}`,
              color: C.blue, padding: '4px 12px', borderRadius: 999,
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8
            }}>
              <ShieldCheck size={14} color={C.blue} /> Workshop Fleet Operations
            </div>
            <h1 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 24, fontWeight: 900, color: C.slate900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ACTIVE JOB CARDS &amp; OFFICIAL INVOICES
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.slate500, fontWeight: 500 }}>
              Real-time vehicle repair status, inventory consumption, payment settlement, and tax invoicing.
            </p>
          </div>

          {/* System Record Count */}
          <div style={{
            background: C.blueLight,
            border: `2px solid ${C.blueBorder}`,
            padding: '10px 18px',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: C.slate500, letterSpacing: '0.5px' }}>
                System Records
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.blue, fontFamily: 'monospace', lineHeight: 1 }}>
                {jobs.length} <span style={{ fontSize: 12, fontWeight: 700, color: C.slate600, fontFamily: 'sans-serif' }}>Jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────── 2. EXECUTIVE 4 KPI METRIC CARDS ────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginTop: 20,
          paddingTop: 20,
          borderTop: `1px solid ${C.slate200}`
        }}>
          
          {/* KPI 1: Total Fleet Jobs (Blue) */}
          <div style={{
            background: C.white,
            border: `1.5px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.slate500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Fleet Jobs</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={16} color={C.blue} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", sans-serif' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginTop: 4 }}>
              Active Database Records
            </div>
          </div>

          {/* KPI 2: Active in Workshop (Yellow) */}
          <div style={{
            background: C.white,
            border: `1.5px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.slate500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Workshop</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.yellowLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={16} color={C.yellow} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.yellowDark, fontFamily: '"Space Grotesk", sans-serif' }}>
              {stats.openOrProgress}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.yellow, marginTop: 4 }}>
              Open &amp; In-Progress Jobs
            </div>
          </div>

          {/* KPI 3: Pending Settlements (Yellow) */}
          <div style={{
            background: C.white,
            border: `1.5px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.slate500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unpaid Invoices</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.yellowLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={16} color={C.yellow} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.yellowDark, fontFamily: '"Space Grotesk", sans-serif' }}>
              {stats.unpaidCount}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.yellowDark, marginTop: 4 }}>
              {fmtLKR(stats.unpaidSum)}
            </div>
          </div>

          {/* KPI 4: Cash Settled (Green) */}
          <div style={{
            background: C.white,
            border: `1.5px solid ${C.slate200}`,
            borderRadius: 16,
            padding: '16px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.slate500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Settled</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color={C.green} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.greenDark, fontFamily: '"Space Grotesk", sans-serif' }}>
              {stats.paidCount}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.greenDark, marginTop: 4 }}>
              {fmtLKR(stats.paidSum)}
            </div>
          </div>

        </div>
      </div>

      {/* ────────────────── 3. PERFECTLY ALIGNED TOOLBAR & FILTERS ────────────────── */}
      <div style={{
        background: C.white,
        border: `2px solid ${C.slate200}`,
        borderRadius: 20,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        
        {/* ROW 1: Search, Dropdowns, View Switcher, Reset */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}>
          
          {/* 1. Search Box (Icon strictly placed inside without overlapping text) */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 260 }}>
            <Search 
              size={18} 
              color={C.blue} 
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <input
              type="text"
              placeholder="Search Job # (JOB-001), Customer Name, Vehicle Reg # (WP CA-1234), Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: 46,
                background: C.white,
                border: `2px solid ${search ? C.blue : C.slate200}`,
                borderRadius: 14,
                paddingLeft: 44,
                paddingRight: search ? 40 : 14,
                fontSize: 13,
                fontWeight: 700,
                color: C.slate900,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: C.slate100, border: 'none', borderRadius: 8,
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: C.slate600
                }}
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 2. Payment Dropdown */}
          <div style={{ width: 170, minWidth: 150 }}>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{
                width: '100%',
                height: 46,
                background: C.white,
                border: `2px solid ${paymentFilter ? C.blue : C.slate200}`,
                borderRadius: 14,
                padding: '0 14px',
                fontSize: 13,
                fontWeight: 700,
                color: C.slate900,
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">All Payments</option>
              <option value="unpaid">Unpaid Invoices</option>
              <option value="paid">Cash Received</option>
            </select>
          </div>

          {/* 3. Sort Dropdown */}
          <div style={{ width: 170, minWidth: 150 }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                height: 46,
                background: C.white,
                border: `2px solid ${C.slate200}`,
                borderRadius: 14,
                padding: '0 14px',
                fontSize: 13,
                fontWeight: 700,
                color: C.slate900,
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="amount-high">Sort: Highest Total</option>
              <option value="customer">Sort: Customer Name</option>
            </select>
          </div>

          {/* 4. View Mode Switcher (Cards / Table) */}
          <div style={{
            background: C.slate100,
            border: `1.5px solid ${C.slate200}`,
            borderRadius: 14,
            padding: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? C.white : 'transparent',
                color: viewMode === 'grid' ? C.blue : C.slate600,
                border: 'none',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? C.white : 'transparent',
                color: viewMode === 'table' ? C.blue : C.slate600,
                border: 'none',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: viewMode === 'table' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          {/* 5. Reset Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                height: 46,
                background: C.blueLight,
                color: C.blue,
                border: `1.5px solid ${C.blueBorder}`,
                borderRadius: 14,
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxSizing: 'border-box'
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}

        </div>

        {/* ROW 2: Status Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${C.slate100}`
        }}>
          <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: C.slate500, marginRight: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} color={C.blue} /> Status:
          </span>
          {statusOptions.map(opt => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                style={{
                  background: isActive ? C.blue : C.white,
                  color: isActive ? C.white : C.slate700,
                  border: `1.5px solid ${isActive ? C.blue : C.slate200}`,
                  borderRadius: 12,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: isActive ? 900 : 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: isActive ? '0 4px 12px rgba(0,168,232,0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{opt.label}</span>
                {statusCounts[opt.value] !== undefined && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : C.slate100,
                    color: isActive ? C.white : C.slate600,
                    borderRadius: 6,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 900
                  }}>
                    {statusCounts[opt.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* ────────────────── 4. CONTENT VIEW (CARDS OR TABLE) ────────────────── */}
      {loading ? (
        <div style={{
          background: C.white,
          border: `2px solid ${C.slate200}`,
          borderRadius: 20,
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ width: 44, height: 44, border: `4px solid ${C.blue}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.slate600 }}>Loading Active Job Cards...</p>
        </div>
      ) : sortedJobs.length === 0 ? (
        <div style={{
          background: C.white,
          border: `2px solid ${C.slate200}`,
          borderRadius: 20,
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: C.blue }}>
            <AlertCircle size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: C.slate900 }}>No Job Cards Found</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: C.slate500 }}>
            {hasActiveFilters ? 'No active jobs match your search or filters.' : 'There are no active job cards in the system.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{
                background: C.blue, color: C.white, border: 'none', borderRadius: 12,
                padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        
        /* ────────────── PREMIUM CARDS GRID VIEW ────────────── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 20
        }}>
          {paginatedJobs.map(job => {
            const partsTotal = job.inventory_issues?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) || 0;
            const labourTotal = parseFloat(job.labour_charge || 0);
            const invoiceGrandTotal = partsTotal + labourTotal;
            const isPaid = job.payment_status === 'paid';

            return (
              <div 
                key={job.id} 
                style={{
                  background: C.white,
                  border: `2px solid ${C.slate200}`,
                  borderRadius: 20,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div>
                  
                  {/* Card Header: License Plate & Status Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 14, borderBottom: `1.5px solid ${C.slate100}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        background: '#111827',
                        color: '#fde047',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 8,
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        <Car size={13} color="#fde047" />
                        {job.vehicle?.vehicle_number || 'NO REG'}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.slate600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.vehicle?.make_model || 'Peugeot'}
                      </span>
                    </div>

                    <div>
                      {renderStatusBadge(job.status)}
                    </div>
                  </div>

                  {/* Job Number & Date Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0' }}>
                    <div style={{
                      background: C.blueLight,
                      color: C.blue,
                      border: `1px solid ${C.blueBorder}`,
                      borderRadius: 8,
                      padding: '3px 10px',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      fontWeight: 900
                    }}>
                      {job.job_number}
                    </div>
                    <div style={{ fontSize: 12, color: C.slate400, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} />
                      {new Date(job.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  {/* Customer Info Box */}
                  <div style={{
                    background: C.slate50,
                    border: `1.5px solid ${C.slate200}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: C.slate900, marginBottom: 4 }}>
                      <User size={15} color={C.blue} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.customer?.name || 'Walk-in Customer'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.slate500, paddingLeft: 23 }}>
                      <Phone size={13} color={C.slate400} />
                      <span>{job.customer?.phone || 'No phone'}</span>
                    </div>
                  </div>

                  {/* Repair Issue / Fault */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: C.slate400, letterSpacing: '0.5px', marginBottom: 4 }}>
                      Issue / Service:
                    </div>
                    <div style={{
                      background: C.slate50,
                      border: `1px solid ${C.slate200}`,
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: C.slate700,
                      fontWeight: 500,
                      minHeight: 40,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {job.repair_fault || 'General service and mechanical inspection.'}
                    </div>
                  </div>

                  {/* Financial Breakdown Card (Clean Blue & White) */}
                  <div style={{
                    background: C.blueLight,
                    border: `1.5px solid ${C.blueBorder}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 14
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.slate600, fontWeight: 600, marginBottom: 4 }}>
                      <span>Parts Issued ({job.inventory_issues?.length || 0}):</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: C.slate800 }}>{fmtLKR(partsTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.slate600, fontWeight: 600, marginBottom: 6 }}>
                      <span>Labour Charges:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: C.slate800 }}>{fmtLKR(labourTotal)}</span>
                    </div>
                    <div style={{
                      paddingTop: 8,
                      borderTop: `1px solid ${C.blueBorder}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: C.slate800, letterSpacing: '0.5px' }}>
                        Invoice Total:
                      </span>
                      <span style={{ fontSize: 17, fontWeight: 900, color: C.blue, fontFamily: '"Space Grotesk", sans-serif' }}>
                        {fmtLKR(invoiceGrandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Pill & Settle Cash Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        background: isPaid ? C.greenLight : C.yellowLight,
                        color: isPaid ? C.greenDark : C.yellowDark,
                        border: `1px solid ${isPaid ? C.greenBorder : C.yellowBorder}`,
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {isPaid ? `✓ PAID (${job.payment_method || 'Cash'})` : '● UNPAID'}
                      </span>
                      {job.car_released && (
                        <span style={{
                          background: C.blueLight,
                          color: C.blue,
                          border: `1px solid ${C.blueBorder}`,
                          borderRadius: 8,
                          padding: '4px 8px',
                          fontSize: 10,
                          fontWeight: 800
                        }}>
                          Gate Pass
                        </span>
                      )}
                    </div>

                    {!isPaid && (
                      <button
                        onClick={() => setSelectedPayJob(job)}
                        style={{
                          background: C.greenLight,
                          color: C.greenDark,
                          border: `1.5px solid ${C.greenBorder}`,
                          borderRadius: 10,
                          padding: '5px 12px',
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Confirm Cash Settlement"
                      >
                        <CheckCircle size={13} color={C.green} /> Settle Cash
                      </button>
                    )}
                  </div>

                </div>

                {/* Card Actions Footer */}
                <div style={{ paddingTop: 14, borderTop: `1.5px solid ${C.slate100}` }}>
                  
                  {/* Inline Status Changer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate400 }}>
                      Change Status:
                    </span>
                    {isPaid ? (
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={13} /> Locked (Paid)
                      </span>
                    ) : (
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        style={{
                          background: C.white,
                          border: `1.5px solid ${C.slate200}`,
                          borderRadius: 10,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.slate800,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Open">Open</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Pending Parts">Pending Parts</option>
                        <option value="Completed">Completed</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    )}
                  </div>

                  {/* Buttons Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!isPaid && (
                      <button
                        onClick={() => {
                          if (onOpenJobInEditor) {
                            onOpenJobInEditor(job);
                          } else if (onViewJob) {
                            onViewJob(job, 'work-stage');
                          }
                        }}
                        style={{
                          flex: 1,
                          height: 40,
                          background: C.blueLight,
                          color: C.blue,
                          border: `1.5px solid ${C.blueBorder}`,
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Wrench size={14} /> Edit Job
                      </button>
                    )}

                    <button
                      onClick={() => onViewJob && onViewJob(job, 'invoice-stage')}
                      style={{
                        flex: 1,
                        height: 40,
                        background: isPaid ? C.green : C.blue,
                        color: C.white,
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: isPaid ? '0 4px 12px rgba(5,150,105,0.25)' : '0 4px 12px rgba(0,168,232,0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Eye size={14} /> {isPaid ? 'View Invoice' : 'Invoice & Pay'}
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      ) : (
        
        /* ────────────── DETAILED EXECUTIVE TABLE VIEW ────────────── */
        <div style={{
          background: C.white,
          border: `2px solid ${C.slate200}`,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.slate50, borderBottom: `2px solid ${C.slate200}`, color: C.slate700, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '16px 18px' }}>Job #</th>
                  <th style={{ padding: '16px 18px' }}>Vehicle &amp; Reg</th>
                  <th style={{ padding: '16px 18px' }}>Customer</th>
                  <th style={{ padding: '16px 18px' }}>Date</th>
                  <th style={{ padding: '16px 18px', textAlign: 'right' }}>Parts Total</th>
                  <th style={{ padding: '16px 18px', textAlign: 'right' }}>Labour</th>
                  <th style={{ padding: '16px 18px', textAlign: 'right' }}>Grand Total</th>
                  <th style={{ padding: '16px 18px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '16px 18px', textAlign: 'center' }}>Payment</th>
                  <th style={{ padding: '16px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.map((job, idx) => {
                  const partsTotal = job.inventory_issues?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) || 0;
                  const labourTotal = parseFloat(job.labour_charge || 0);
                  const invoiceGrandTotal = partsTotal + labourTotal;
                  const isPaid = job.payment_status === 'paid';

                  return (
                    <tr 
                      key={job.id} 
                      style={{
                        borderBottom: `1px solid ${C.slate100}`,
                        background: idx % 2 === 0 ? C.white : C.slate50
                      }}
                    >
                      {/* Job Number */}
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 900, color: C.blue }}>
                        {job.job_number}
                      </td>

                      {/* Vehicle */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 900, color: C.slate900, fontFamily: 'monospace' }}>
                          {job.vehicle?.vehicle_number || 'NO REG'}
                        </div>
                        <div style={{ fontSize: 11, color: C.slate500 }}>
                          {job.vehicle?.make_model || 'Peugeot'}
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: C.slate900 }}>
                          {job.customer?.name || 'Walk-in'}
                        </div>
                        <div style={{ fontSize: 11, color: C.slate500 }}>
                          {job.customer?.phone || '-'}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 18px', color: C.slate500, whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {new Date(job.created_at).toLocaleDateString('en-GB')}
                      </td>

                      {/* Parts Total */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: C.slate700 }}>
                        {fmtLKR(partsTotal)}
                      </td>

                      {/* Labour */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: C.slate700 }}>
                        {fmtLKR(labourTotal)}
                      </td>

                      {/* Grand Total */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: C.blue, fontSize: 14 }}>
                        {fmtLKR(invoiceGrandTotal)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {renderStatusBadge(job.status)}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          background: isPaid ? C.greenLight : C.yellowLight,
                          color: isPaid ? C.greenDark : C.yellowDark,
                          border: `1px solid ${isPaid ? C.greenBorder : C.yellowBorder}`,
                          borderRadius: 8,
                          padding: '3px 8px',
                          fontSize: 10,
                          fontWeight: 900,
                          textTransform: 'uppercase'
                        }}>
                          {isPaid ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {!isPaid && (
                            <button
                              onClick={() => {
                                if (onOpenJobInEditor) {
                                  onOpenJobInEditor(job);
                                } else if (onViewJob) {
                                  onViewJob(job, 'work-stage');
                                }
                              }}
                              style={{
                                background: C.blueLight,
                                color: C.blue,
                                border: `1px solid ${C.blueBorder}`,
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Edit Job Card"
                            >
                              <Wrench size={13} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => onViewJob && onViewJob(job, 'invoice-stage')}
                            style={{
                              background: isPaid ? C.green : C.blue,
                              color: C.white,
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="View Invoice"
                          >
                            <Eye size={13} /> Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────── 5. CLEAN PAGINATION ────────────────── */}
      {sortedJobs.length > itemsPerPage && (
        <div style={{
          background: C.white,
          border: `2px solid ${C.slate200}`,
          borderRadius: 16,
          padding: '14px 20px',
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          
          <div style={{ fontSize: 13, color: C.slate600, fontWeight: 700 }}>
            Showing <span style={{ color: C.slate900, fontWeight: 900 }}>{((currentPage - 1) * itemsPerPage) + 1}</span> - <span style={{ color: C.slate900, fontWeight: 900 }}>{Math.min(currentPage * itemsPerPage, sortedJobs.length)}</span> of <span style={{ color: C.blue, fontWeight: 900 }}>{sortedJobs.length}</span> Job Cards
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                background: C.white,
                border: `1.5px solid ${C.slate300}`,
                color: currentPage === 1 ? C.slate400 : C.slate700,
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 800,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div style={{ fontSize: 13, fontWeight: 700, color: C.slate700, padding: '0 8px' }}>
              Page <span style={{ color: C.blue, fontWeight: 900 }}>{currentPage}</span> of <span style={{ fontWeight: 900 }}>{totalPages}</span>
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                background: C.white,
                border: `1.5px solid ${C.slate300}`,
                color: currentPage === totalPages ? C.slate400 : C.slate700,
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 800,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

        </div>
      )}

      {/* ────────────────── 6. PAYMENT CONFIRMATION MODAL ────────────────── */}
      {selectedPayJob && (
        <PaymentConfirmModal
          job={selectedPayJob}
          onClose={() => setSelectedPayJob(null)}
          onSuccess={() => {
            fetchJobs();
          }}
        />
      )}

    </div>
  );
}
