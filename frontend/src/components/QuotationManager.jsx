import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Search, Wrench, Car, Package,
  User, CheckCircle2, AlertCircle, FileText, List,
  ShieldCheck, ArrowUpDown, ChevronLeft, ChevronRight,
  Clock, X, RotateCcw, LayoutGrid, Zap, DollarSign,
  Printer, CheckCircle, SlidersHorizontal, Layers, Sparkles
} from 'lucide-react';
import { getCustomers, getVehicles, getQuotations, createQuotation, getInventoryItems } from '../services/api';
import QuotationDetailModal from './QuotationDetailModal';

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

const CARD = {
  background: C.white,
  border: `2px solid ${C.slate200}`,
  borderRadius: 20,
  padding: '24px 28px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
  marginBottom: 24,
  width: '100%',
  boxSizing: 'border-box'
};

const LABEL = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  color: C.slate600,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: 8,
};

const INPUT_BASE = {
  width: '100%',
  height: 46,
  border: `1.5px solid ${C.slate200}`,
  borderRadius: 12,
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 700,
  color: C.slate900,
  background: C.white,
  outline: 'none',
  fontFamily: 'Outfit, sans-serif',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  boxSizing: 'border-box',
};

const DIVIDER = {
  border: 'none',
  borderTop: `1.5px solid ${C.slate100}`,
  margin: '20px 0',
};

const fmtLKR = (val) => `Rs. ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─── Reusable Sub-Components ──────────────────────────────────────────────── */
function IconBox({ gradient, children }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.white, flexShrink: 0,
      boxShadow: '0 4px 12px rgba(0,168,232,0.25)',
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ step, title, subtitle, iconGradient, icon, badgeColor, badgeBg, badgeBorder, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: `1.5px solid ${C.slate100}`, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <IconBox gradient={iconGradient}>{icon}</IconBox>
        <div>
          <h2 style={{ margin: 0, fontFamily: '"Space Grotesk", Outfit, sans-serif', fontSize: 18, fontWeight: 900, color: C.slate900, letterSpacing: '0.2px' }}>
            {step}. {title}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: C.slate500 }}>{subtitle}</p>
        </div>
      </div>
      {right || (
        <span style={{
          fontSize: 11, fontWeight: 800, color: badgeColor,
          background: badgeBg, border: `1.5px solid ${badgeBorder}`,
          padding: '4px 14px', borderRadius: 999, whiteSpace: 'nowrap',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Step {step} of 3
        </span>
      )}
    </div>
  );
}

function Field({ label, required, children, style }) {
  return (
    <div style={style}>
      <label style={LABEL}>{label}{required && <span style={{ color: C.yellow, marginLeft: 3 }}>*</span>}</label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = 'text', style = {}, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...INPUT_BASE, ...style, borderColor: focused ? C.blue : C.slate200, boxShadow: focused ? `0 0 0 3px ${C.blueLight}` : 'none' }}
      {...rest}
    />
  );
}

function StyledSelect({ value, onChange, children, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...INPUT_BASE, cursor: 'pointer', ...style, borderColor: focused ? C.blue : C.slate200, boxShadow: focused ? `0 0 0 3px ${C.blueLight}` : 'none' }}
    >
      {children}
    </select>
  );
}

function StyledTextarea({ value, onChange, placeholder, rows = 3, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...INPUT_BASE, height: 'auto', padding: '12px 16px', resize: 'vertical', ...style, borderColor: focused ? C.blue : C.slate200, boxShadow: focused ? `0 0 0 3px ${C.blueLight}` : 'none' }}
    />
  );
}

function Grid4({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function QuotationManager({ onViewQuotation, onConvertToJob }) {
  const [activeSubTab, setActiveSubTab] = useState('create'); // 'create' | 'list'

  /* ── Quotation list state ───────────────────────────────────────── */
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [listLoading, setListLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  /* ── Vehicle quick-search ───────────────────────────────────── */
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [vehicleSearchResults, setVehicleSearchResults] = useState([]);

  /* ── Customer ───────────────────────────────────────────────── */
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  /* ── Vehicle ────────────────────────────────────────────────── */
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [makeModel, setMakeModel] = useState('Peugeot 407 P');
  const [mileage, setMileage] = useState('');

  /* ── Repair & Labour ────────────────────────────────────────── */
  const [repairDescription, setRepairDescription] = useState('');
  const [labourItems, setLabourItems] = useState([
    { description: 'Scanner Diagnostic & Service Inspection', amount: '3500' }
  ]);

  /* ── Parts ──────────────────────────────────────────────────── */
  const [inventoryCatalog, setInventoryCatalog] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [issueQty, setIssueQty] = useState(1);
  const [selectedParts, setSelectedParts] = useState([]);
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [partFilterModel, setPartFilterModel] = useState('');

  /* ── Discount & Promotional Offer ───────────────────────────── */
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  /* ── UI state ───────────────────────────────────────────────── */
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => { fetchQuotations(); fetchInventory(); }, []);
  useEffect(() => { fetchQuotations(); }, [search]);
  useEffect(() => { setPartFilterModel(makeModel); }, [makeModel]);

  const effectiveFilterModel = partFilterModel || makeModel || 'All';

  const getFilteredInventory = () => {
    let list = inventoryCatalog;

    if (effectiveFilterModel !== 'All') {
      const modelLower = effectiveFilterModel.toLowerCase();
      const keywords = ['407', '3008', '5008', '208', '508', 'partner', '308', '2008'].filter(k => modelLower.includes(k));
      list = list.filter(item => {
        const appModel = (item.applicable_model || '').toLowerCase();
        const itemName = (item.item_name || '').toLowerCase();
        if (appModel.includes('universal') || appModel.includes('all peugeot') || appModel.includes('all models')) return true;
        if (keywords.length > 0) return keywords.some(k => appModel.includes(k) || itemName.includes(k));
        return appModel.includes(modelLower) || itemName.includes(modelLower);
      });
    }

    if (partSearchQuery.trim()) {
      const query = partSearchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const code = (item.item_code || '').toLowerCase();
        const name = (item.item_name || '').toLowerCase();
        const model = (item.applicable_model || '').toLowerCase();
        return code.includes(query) || name.includes(query) || model.includes(query);
      });
    }

    return list;
  };

  const filteredInventory = getFilteredInventory();

  const fetchQuotations = async () => {
    setListLoading(true);
    try { const res = await getQuotations(search); setQuotations(res.data || []); }
    catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  const fetchInventory = async () => {
    try { const res = await getInventoryItems(); setInventoryCatalog(res.data || []); }
    catch (err) { console.error(err); }
  };

  /* ── Vehicle quick-search handlers ─────────────────────────── */
  const handleSearchVehicle = async (e) => {
    const q = e.target.value;
    setVehicleSearchQuery(q);
    if (q.trim().length >= 1) {
      try { const res = await getVehicles(q.trim()); setVehicleSearchResults(res.data || []); }
      catch (err) { console.error(err); }
    } else { setVehicleSearchResults([]); }
  };

  const handleSelectVehicle = (veh) => {
    setVehicleNumber(veh.vehicle_number || '');
    if (veh.make_model) setMakeModel(veh.make_model);
    if (veh.customer) {
      setCustomerName(veh.customer.name || '');
      setCustomerPhone(veh.customer.phone || '');
      setCustomerEmail(veh.customer.email || '');
    }
    setVehicleSearchResults([]);
    setVehicleSearchQuery(veh.vehicle_number);
    setFormSuccess(`✓ Vehicle ${veh.vehicle_number} & Customer details loaded!`);
  };

  /* ── Customer directory search ──────────────────────────────── */
  const handleSearchCustomers = async (e) => {
    const val = e.target.value;
    setCustomerSearch(val);
    if (val.trim().length > 0) {
      try { const res = await getCustomers(val); setCustomerOptions(res.data || []); }
      catch (err) { console.error(err); }
    } else { setCustomerOptions([]); }
  };

  const handleSelectCustomer = (c) => {
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    setCustomerOptions([]);
    setCustomerSearch('');
  };

  /* ── Labour handlers ────────────────────────────────────────── */
  const handleAddLabourRow = () => setLabourItems([...labourItems, { description: '', amount: '' }]);
  const handleRemoveLabourRow = (idx) => {
    if (labourItems.length === 1) return;
    setLabourItems(labourItems.filter((_, i) => i !== idx));
  };
  const handleLabourChange = (idx, field, value) => {
    const updated = [...labourItems]; updated[idx][field] = value; setLabourItems(updated);
  };

  /* ── Parts handlers ─────────────────────────────────────────── */
  const handleAddPart = () => {
    if (!selectedPartId) return;
    const item = inventoryCatalog.find(i => i.id === parseInt(selectedPartId));
    if (!item) return;
    const existingIndex = selectedParts.findIndex(p => p.inventory_item_id === item.id);
    if (existingIndex >= 0) {
      const updated = [...selectedParts];
      updated[existingIndex].quantity += parseInt(issueQty);
      updated[existingIndex].total_price = updated[existingIndex].quantity * parseFloat(item.unit_price);
      setSelectedParts(updated);
    } else {
      setSelectedParts([...selectedParts, {
        inventory_item_id: item.id, item_code: item.item_code, item_name: item.item_name,
        quantity: parseInt(issueQty), unit_price: parseFloat(item.unit_price),
        total_price: parseInt(issueQty) * parseFloat(item.unit_price),
      }]);
    }
    setSelectedPartId(''); setIssueQty(1);
  };

  const handleRemovePart = (idx) => setSelectedParts(selectedParts.filter((_, i) => i !== idx));

  const totalLabour = labourItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const totalParts = selectedParts.reduce((s, p) => s + p.total_price, 0);
  const subtotalAmount = totalLabour + totalParts;

  // Discount calculations
  const rawDiscount = parseFloat(discountValue) || 0;
  const calculatedDiscount = Math.min(subtotalAmount, Math.max(0, rawDiscount));

  const grandTotal = Math.max(0, subtotalAmount - calculatedDiscount);

  // Live Stats for Quotations
  const stats = useMemo(() => {
    const total = quotations.length;
    let totalVal = 0;
    quotations.forEach(q => {
      totalVal += parseFloat(q.total_amount || 0);
    });
    return { total, totalVal };
  }, [quotations]);

  /* ── Form submit ────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!customerName.trim() || !customerPhone.trim()) { setFormError('Customer Name and Mobile Phone are required.'); return; }
    if (!vehicleNumber.trim()) { setFormError('Vehicle Registration Number is required.'); return; }

    const validLabour = labourItems
      .filter(i => i.description.trim() && !isNaN(parseFloat(i.amount)))
      .map(i => ({ description: i.description.trim(), amount: parseFloat(i.amount) }));

    const payload = {
      customer_name: customerName.trim(), customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || null,
      vehicle_number: vehicleNumber.toUpperCase().trim(), make_model: makeModel,
      mileage: mileage ? parseInt(mileage) : 0,
      repair_description: repairDescription,
      labour_items: validLabour,
      parts_items: selectedParts,
    };

    setFormSubmitting(true);
    try {
      const res = await createQuotation(payload);
      setFormSuccess(`Quotation ${res.data.quotation_number} created successfully!`);
      setFormSubmitting(false);
      setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
      setVehicleNumber(''); setMileage(''); setRepairDescription('');
      setLabourItems([{ description: 'Scanner Diagnostic & Service Inspection', amount: '3500' }]);
      setSelectedParts([]);
      setVehicleSearchQuery('');
      fetchQuotations();
      if (onViewQuotation) {
        onViewQuotation(res.data);
      } else {
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      setFormSubmitting(false);
      const detail = err.response?.data?.detail || err.message;
      setFormError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  return (
    <div style={{ width: '100%', paddingBottom: 80, fontFamily: 'Outfit, sans-serif' }}>

      {/* ────────────────── 1. EXECUTIVE HEADER BANNER ────────────────── */}
      <div style={{
        ...CARD,
        display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
        flexWrap: 'wrap', gap: 20, borderLeftWidth: 6, borderLeftColor: C.blue,
        padding: '24px 28px',
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`, borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            <ShieldCheck size={14} color={C.blue} /> Official Cost Estimates
          </div>
          <h1 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 24, fontWeight: 900, color: C.slate900, textTransform: 'uppercase' }}>
            QUOTATIONS &amp; PRICE ESTIMATES
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.slate500, fontWeight: 500 }}>
            Prepare, print, and issue formal price estimates to customers, with instant conversion to live Job Cards.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, background: C.slate100, padding: 6, borderRadius: 14, border: `1px solid ${C.slate200}` }}>
          <button 
            type="button"
            onClick={() => setActiveSubTab('create')} 
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
              transition: 'all 0.15s ease',
              background: activeSubTab === 'create' ? C.blue : 'transparent',
              color: activeSubTab === 'create' ? C.white : C.slate600,
              boxShadow: activeSubTab === 'create' ? '0 4px 12px rgba(0,168,232,0.3)' : 'none',
            }}
          >
            ➕ New Quotation
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubTab('list')} 
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
              transition: 'all 0.15s ease',
              background: activeSubTab === 'list' ? C.blue : 'transparent',
              color: activeSubTab === 'list' ? C.white : C.slate600,
              boxShadow: activeSubTab === 'list' ? '0 4px 12px rgba(0,168,232,0.3)' : 'none',
            }}
          >
            📋 All Quotations ({quotations.length})
          </button>
        </div>
      </div>

      {/* ────────────────── KPI STATS BAR (Strict 4-Color Palette) ────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24
      }}>
        {/* KPI 1: Total Quotations */}
        <div style={{ background: C.white, border: `2px solid ${C.slate200}`, borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.slate500, textTransform: 'uppercase' }}>Issued Quotations</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color={C.blue} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", sans-serif' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginTop: 4 }}>Total Estimates Generated</div>
        </div>

        {/* KPI 2: Total Estimated Volume */}
        <div style={{ background: C.white, border: `2px solid ${C.slate200}`, borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.slate500, textTransform: 'uppercase' }}>Estimated Revenue</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} color={C.green} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.greenDark, fontFamily: '"Space Grotesk", sans-serif' }}>
            {fmtLKR(stats.totalVal)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginTop: 4 }}>Combined Quotation Value</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ALL QUOTATIONS LIST VIEW                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'list' && (
        <div style={CARD}>
          
          {/* List Header & Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 20, borderBottom: `1.5px solid ${C.slate100}`, marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 18, fontWeight: 900, color: C.slate900, textTransform: 'uppercase' }}>
                Issued Quotations Directory
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.slate500, fontWeight: 500 }}>
                View detailed estimates, print customer copies, or convert to active job cards.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={16} color={C.blue} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by Quotation #, Customer, Vehicle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', height: 42, background: C.white,
                    border: `2px solid ${search ? C.blue : C.slate200}`,
                    borderRadius: 12, paddingLeft: 42, paddingRight: search ? 36 : 14,
                    fontSize: 13, fontWeight: 700, color: C.slate900, outline: 'none'
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: C.slate100, border: 'none', borderRadius: 6, width: 22, height: 22, color: C.slate600, cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div style={{ background: C.slate100, border: `1.5px solid ${C.slate200}`, borderRadius: 12, padding: 3, display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    background: viewMode === 'grid' ? C.white : 'transparent',
                    color: viewMode === 'grid' ? C.blue : C.slate600,
                    border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <LayoutGrid size={14} /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    background: viewMode === 'table' ? C.white : 'transparent',
                    color: viewMode === 'table' ? C.blue : C.slate600,
                    border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <List size={14} /> Table
                </button>
              </div>
            </div>
          </div>

          {/* Quotations Content */}
          {listLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: C.slate500, fontWeight: 700, fontSize: 13 }}>
              <div style={{ width: 40, height: 40, border: `4px solid ${C.blue}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
              Loading Quotations...
            </div>
          ) : quotations.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center', background: C.slate50, borderRadius: 16, border: `2px dashed ${C.slate200}` }}>
              <FileText size={36} style={{ color: C.slate400, margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 800, color: C.slate800, fontSize: 14, margin: 0 }}>No Quotations Found</p>
              <p style={{ color: C.slate500, fontSize: 12, marginTop: 4 }}>Click "➕ New Quotation" above to prepare your first price estimate.</p>
            </div>
          ) : viewMode === 'grid' ? (
            
            /* CARDS GRID VIEW */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 20 }}>
              {quotations.map(q => (
                <div 
                  key={q.id}
                  style={{
                    background: C.white, border: `2px solid ${C.slate200}`, borderRadius: 18, padding: 18,
                    display: 'flex', flexDirection: 'column', justifyBetween: 'space-between',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', paddingBottom: 12, borderBottom: `1.5px solid ${C.slate100}`, gap: 8 }}>
                      <div style={{ background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', fontWeight: 900 }}>
                        {q.quotation_number}
                      </div>
                      <span style={{ background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                        {q.status || 'QUOTATION'}
                      </span>
                    </div>

                    {/* Vehicle & Customer Info */}
                    <div style={{ margin: '14px 0', spaceY: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 900, color: C.slate900 }}>
                        <Car size={16} color={C.blue} />
                        <span style={{ fontFamily: 'monospace' }}>{q.vehicle_number}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.slate500, fontFamily: 'sans-serif' }}>({q.make_model})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: C.slate800, marginTop: 6 }}>
                        <User size={15} color={C.slate400} />
                        <span>{q.customer_name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.slate500, paddingLeft: 23, fontFamily: 'monospace' }}>
                        📞 {q.customer_phone}
                      </div>
                    </div>

                    {/* Total Amount Pill */}
                    <div style={{ background: C.blueLight, border: `1.5px solid ${C.blueBorder}`, borderRadius: 14, padding: '12px 14px', margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: C.slate700 }}>Estimated Total:</span>
                      <span style={{ fontSize: 17, fontWeight: 900, color: C.blue, fontFamily: '"Space Grotesk", sans-serif' }}>
                        {fmtLKR(parseFloat(q.total_amount))}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ paddingTop: 12, borderTop: `1.5px solid ${C.slate100}`, display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewQuotation) onViewQuotation(q);
                        else setSelectedQuotation(q);
                      }}
                      style={{ flex: 1, height: 40, background: C.blue, color: C.white, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Printer size={14} /> View / Print
                    </button>
                    {onConvertToJob && (
                      <button
                        type="button"
                        onClick={() => onConvertToJob(q)}
                        style={{ height: 40, padding: '0 14px', background: C.green, color: C.white, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Zap size={14} /> Convert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          ) : (

            /* TABLE VIEW */
            <div style={{ border: `2px solid ${C.slate200}`, borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.slate50, borderBottom: `2px solid ${C.slate200}`, color: C.slate700 }}>
                    {['Quotation Ref', 'Customer & Contact', 'Vehicle & Model', 'Total Amount', 'Status', 'Actions'].map((h, i) => (
                      <th key={i} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q, idx) => (
                    <tr key={q.id} style={{ borderBottom: `1px solid ${C.slate100}`, background: idx % 2 === 0 ? C.white : C.slate50 }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 900, color: C.blue }}>{q.quotation_number}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: C.slate900 }}>{q.customer_name}</div>
                        <div style={{ fontSize: 11, color: C.slate500, fontFamily: 'monospace', marginTop: 2 }}>📞 {q.customer_phone}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 900, color: C.slate900 }}>{q.vehicle_number}</div>
                        <div style={{ fontSize: 11, color: C.slate500 }}>{q.make_model}</div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, color: C.blue, fontSize: 14 }}>
                        {fmtLKR(parseFloat(q.total_amount))}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`, padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => {
                              if (onViewQuotation) onViewQuotation(q);
                              else setSelectedQuotation(q);
                            }}
                            style={{ padding: '6px 12px', background: C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Printer size={13} /> View
                          </button>
                          {onConvertToJob && (
                            <button
                              onClick={() => onConvertToJob(q)}
                              style={{ padding: '6px 12px', background: C.green, color: C.white, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Zap size={13} /> Convert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* NEW QUOTATION CREATE FORM                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'create' && (
        <form onSubmit={handleSubmit}>

          {/* Alerts */}
          {formError && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.yellowLight, border: `1.5px solid ${C.yellowBorder}`, borderRadius: 14, padding: '14px 20px', marginBottom: 20, color: C.yellowDark, fontSize: 13, fontWeight: 800 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><AlertCircle size={18} /><span>{formError}</span></div>
              <button onClick={() => setFormError('')} style={{ background: 'none', border: 'none', color: C.yellowDark, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>✕</button>
            </div>
          )}
          {formSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.greenLight, border: `1.5px solid ${C.greenBorder}`, borderRadius: 14, padding: '14px 20px', marginBottom: 20, color: C.greenDark, fontSize: 13, fontWeight: 800 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle2 size={18} /><span>{formSuccess}</span></div>
              <button onClick={() => setFormSuccess('')} style={{ background: 'none', border: 'none', color: C.greenDark, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>✕</button>
            </div>
          )}

          {/* ── TOP AUTO-FILL VEHICLE SEARCH ──────────────────────────────── */}
          <div style={{
            background: C.blueLight,
            border: `2px solid ${C.blueBorder}`, borderRadius: 20,
            padding: '20px 24px', marginBottom: 24,
            boxShadow: `0 4px 20px rgba(0,168,232,0.08)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, flexShrink: 0 }}>
                <Search size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase' }}>
                    Auto-Fill Customer via Vehicle Registration #
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: C.white, background: C.blue, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase' }}>
                    ⚡ AUTO-FILL
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: C.slate600, fontWeight: 500 }}>
                  Search any existing vehicle registration to load vehicle &amp; customer details automatically.
                </p>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Car size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.blue, pointerEvents: 'none' }} />
              <StyledInput
                value={vehicleSearchQuery}
                onChange={handleSearchVehicle}
                placeholder="Type Vehicle Reg No (e.g. WP KI-6003, CA-1234)..."
                style={{ paddingLeft: 44, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 800 }}
              />

              {vehicleSearchResults.length > 0 && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: 52, zIndex: 50, background: C.white, border: `2px solid ${C.blue}`, borderRadius: 16, boxShadow: '0 12px 36px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                  <div style={{ background: C.blueLight, padding: '10px 16px', borderBottom: `1px solid ${C.blueBorder}`, fontSize: 11, fontWeight: 900, color: C.blue, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                    <span>✓ {vehicleSearchResults.length} vehicle(s) found</span>
                    <span style={{ color: C.slate500, fontWeight: 600 }}>Click to auto-fill</span>
                  </div>
                  {vehicleSearchResults.map((v) => (
                    <div 
                      key={v.id} 
                      onClick={() => handleSelectVehicle(v)}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.slate100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, background: C.white }}
                      onMouseEnter={e => e.currentTarget.style.background = C.blueLight}
                      onMouseLeave={e => e.currentTarget.style.background = C.white}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Car size={16} color={C.blue} />
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 900, color: C.blue, fontFamily: 'monospace' }}>{v.vehicle_number}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, marginLeft: 8 }}>{v.make_model}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.slate900 }}>
                        👤 {v.customer ? v.customer.name : 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══ STEP 1: VEHICLE SPECIFICATIONS ═══════════════════ */}
          <div style={{ ...CARD, borderLeftWidth: 6, borderLeftColor: C.blue }}>
            <SectionHeader
              step={1} title="Vehicle Specifications"
              subtitle="Registration number, Peugeot model, and current vehicle mileage"
              iconGradient={`linear-gradient(135deg, ${C.blue} 0%, ${C.blueDark} 100%)`}
              icon={<Car size={20} strokeWidth={2.5} />}
              badgeColor={C.blue} badgeBg={C.blueLight} badgeBorder={C.blueBorder}
            />
            <Grid4>
              <Field label="Vehicle Registration No" required>
                <StyledInput 
                  value={vehicleNumber} 
                  onChange={(e) => setVehicleNumber(e.target.value)} 
                  placeholder="e.g. WP KI-6003" 
                  required
                  style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: '1.5px', borderColor: C.blue, background: C.blueLight, color: C.blue }} 
                />
              </Field>
              <Field label="Peugeot Model" required>
                <StyledSelect value={makeModel} onChange={(e) => setMakeModel(e.target.value)}>
                  <option value="Peugeot 407 P">Peugeot 407 P</option>
                  <option value="Peugeot 3008 SUV">Peugeot 3008 SUV</option>
                  <option value="Peugeot 5008 SUV">Peugeot 5008 SUV</option>
                  <option value="Peugeot 208 Hatch">Peugeot 208 Hatch</option>
                  <option value="Peugeot 508 Sedan">Peugeot 508 Sedan</option>
                  <option value="Peugeot Partner Van">Peugeot Partner Van</option>
                  <option value="Universal Peugeot">Universal Peugeot</option>
                </StyledSelect>
              </Field>
              <Field label="Current Mileage (Km)">
                <StyledInput type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 145000" style={{ fontFamily: 'monospace' }} />
              </Field>
            </Grid4>
          </div>

          {/* ══ STEP 2: CUSTOMER INFORMATION ═════════════════════ */}
          <div style={{ ...CARD, borderLeftWidth: 6, borderLeftColor: C.green }}>
            <SectionHeader
              step={2} title="Customer Information"
              subtitle="Vehicle owner name, contact phone number, and optional email"
              iconGradient={`linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`}
              icon={<User size={20} strokeWidth={2.5} />}
              badgeColor={C.green} badgeBg={C.greenLight} badgeBorder={C.greenBorder}
              right={
                <div style={{ position: 'relative', width: 280 }}>
                  <Search size={15} color={C.green} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input 
                    type="text" 
                    placeholder="Search customer directory..."
                    value={customerSearch} 
                    onChange={handleSearchCustomers}
                    style={{ ...INPUT_BASE, height: 42, paddingLeft: 40, fontSize: 12 }}
                  />
                  {customerOptions.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 46, zIndex: 30, background: C.white, border: `2px solid ${C.green}`, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto' }}>
                      {customerOptions.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => handleSelectCustomer(c)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, background: C.white }}
                          onMouseEnter={e => e.currentTarget.style.background = C.greenLight}
                          onMouseLeave={e => e.currentTarget.style.background = C.white}
                        >
                          <span style={{ fontWeight: 800, color: C.slate900 }}>{c.name}</span>
                          <span style={{ fontWeight: 800, color: C.slate600, fontFamily: 'monospace', fontSize: 11, background: C.slate100, padding: '2px 8px', borderRadius: 6 }}>📞 {c.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              }
            />
            <Grid4>
              <Field label="Customer Full Name" required>
                <StyledInput value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Nimal Fernando" required />
              </Field>
              <Field label="Mobile Phone Number" required>
                <StyledInput value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g. 0777123456" required style={{ fontFamily: 'monospace' }} />
              </Field>
              <Field label="Email Address (Optional)">
                <StyledInput type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@email.com" />
              </Field>
            </Grid4>
          </div>

          {/* ══ STEP 3: REPAIR & LABOUR + PARTS ══════════════════ */}
          <div style={{ ...CARD, borderLeftWidth: 6, borderLeftColor: C.yellow }}>
            <SectionHeader
              step={3} title="Repair & Spare Parts Estimate"
              subtitle="Detailed complaint, itemized labour, and spare parts estimate"
              iconGradient={`linear-gradient(135deg, ${C.yellow} 0%, ${C.yellowDark} 100%)`}
              icon={<Wrench size={20} strokeWidth={2.5} />}
              badgeColor={C.yellowDark} badgeBg={C.yellowLight} badgeBorder={C.yellowBorder}
            />

            {/* Repair description */}
            <Field label="Repair Description / Complaint" style={{ marginBottom: 20 }}>
              <StyledTextarea rows={2} value={repairDescription} onChange={(e) => setRepairDescription(e.target.value)}
                placeholder="e.g. Engine oil leak inspection, scanner diagnostic & front brake pad replacement estimate." />
            </Field>

            {/* Labour Items */}
            <div style={{ background: C.slate50, border: `1.5px solid ${C.slate200}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: C.slate800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Itemized Labour Charges</span>
                <button 
                  type="button" 
                  onClick={handleAddLabourRow} 
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', background: C.blue, color: C.white, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 3px 10px rgba(0,168,232,0.25)' }}
                >
                  <Plus size={15} strokeWidth={3} /> Add Labour
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {labourItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.white, border: `1.5px solid ${C.slate200}`, borderRadius: 12, padding: '10px 14px', flexWrap: 'wrap' }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, background: C.blue, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, fontFamily: 'monospace', flexShrink: 0 }}>{idx + 1}</span>
                    <input type="text" value={item.description} onChange={(e) => handleLabourChange(idx, 'description', e.target.value)}
                      placeholder="Labour description (e.g. Scanner Diagnostic & Inspection)"
                      style={{ ...INPUT_BASE, flex: 1, minWidth: 180, height: 40 }} />
                    <div style={{ position: 'relative', width: 160, flexShrink: 0 }}>
                      <span style={{ position: 'absolute', left: 12, top: 11, fontSize: 11, fontWeight: 800, color: C.slate400 }}>Rs.</span>
                      <input type="number" step="0.01" value={item.amount} onChange={(e) => handleLabourChange(idx, 'amount', e.target.value)}
                        placeholder="0.00"
                        style={{ ...INPUT_BASE, height: 40, paddingLeft: 40, paddingRight: 12, textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: C.blue }} />
                    </div>
                    {labourItems.length > 1 && (
                      <button type="button" onClick={() => handleRemoveLabourRow(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate400, padding: 4 }}
                      ><Trash2 size={15} /></button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: `1.5px solid ${C.slate200}` }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.slate800, textTransform: 'uppercase' }}>Total Labour Estimate:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: C.yellowDark, fontFamily: 'monospace' }}>{fmtLKR(totalLabour)}</span>
              </div>
            </div>

            {/* Spare Parts Section */}
            <div style={{ background: C.blueLight, border: `1.5px solid ${C.blueBorder}`, borderRadius: 16, padding: 18 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Package size={18} color={C.blue} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: C.slate900, textTransform: 'uppercase' }}>
                      Spare Parts Estimate ({filteredInventory.length} in catalog)
                    </span>
                  </div>
                </div>

                {/* Model Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.slate600, textTransform: 'uppercase' }}>
                    Model:
                  </span>
                  <StyledSelect
                    value={effectiveFilterModel}
                    onChange={(e) => setPartFilterModel(e.target.value)}
                    style={{ height: 38, fontSize: 12, minWidth: 160, background: C.white }}
                  >
                    <option value="All">🌐 All Models</option>
                    <option value="Peugeot 407 P">🚗 Peugeot 407</option>
                    <option value="Peugeot 3008 SUV">🚙 Peugeot 3008 SUV</option>
                    <option value="Peugeot 5008 SUV">🚙 Peugeot 5008 SUV</option>
                    <option value="Peugeot 208 Hatch">🚗 Peugeot 208 Hatch</option>
                    <option value="Peugeot 508 Sedan">🚗 Peugeot 508 Sedan</option>
                    <option value="Peugeot Partner Van">🚐 Peugeot Partner Van</option>
                    <option value="Universal Peugeot">✨ Universal Only</option>
                  </StyledSelect>
                </div>
              </div>

              {/* Part Selection Panel */}
              <div style={{ background: C.white, border: `1.5px solid ${C.blueBorder}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, alignItems: 'end', marginBottom: 14 }}>
                  
                  {/* Select Part */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={LABEL}>Select Spare Part</label>
                    <StyledSelect
                      value={selectedPartId}
                      onChange={(e) => { setSelectedPartId(e.target.value); setIssueQty(1); }}
                    >
                      <option value="">-- Select Spare Part --</option>
                      {filteredInventory.map(item => (
                        <option key={item.id} value={item.id}>
                          [{item.item_code}] {item.item_name} ({item.applicable_model || 'Universal'})
                        </option>
                      ))}
                    </StyledSelect>
                  </div>

                  {/* Stock */}
                  <div>
                    <label style={LABEL}>Stock</label>
                    {(() => {
                      const itm = inventoryCatalog.find(i => i.id === parseInt(selectedPartId));
                      const isIn = itm && itm.quantity_in_stock > 0;
                      return (
                        <div style={{
                          height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'monospace', fontWeight: 900, fontSize: 13,
                          border: `1.5px solid ${itm ? (isIn ? C.greenBorder : C.yellowBorder) : C.slate200}`,
                          background: itm ? (isIn ? C.greenLight : C.yellowLight) : C.white,
                          color: itm ? (isIn ? C.greenDark : C.yellowDark) : C.slate400,
                        }}>
                          {itm ? `${itm.quantity_in_stock} ${itm.unit_of_measure}` : '0 in stock'}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label style={LABEL}>Required Qty</label>
                    {(() => {
                      const itm = inventoryCatalog.find(i => i.id === parseInt(selectedPartId));
                      return (
                        <input
                          type="number" min="1" max={itm ? itm.quantity_in_stock : 999}
                          value={issueQty}
                          onChange={(e) => setIssueQty(e.target.value)}
                          disabled={!itm}
                          style={{ ...INPUT_BASE, textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: 16, opacity: itm ? 1 : 0.5 }}
                        />
                      );
                    })()}
                  </div>

                  {/* Estimated Price */}
                  <div>
                    <label style={LABEL}>Subtotal</label>
                    {(() => {
                      const itm = inventoryCatalog.find(i => i.id === parseInt(selectedPartId));
                      return (
                        <div style={{ height: 46, borderRadius: 12, border: `1.5px solid ${C.slate200}`, background: C.white, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', padding: '0 12px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: C.blue }}>
                            {itm ? fmtLKR(issueQty * parseFloat(itm.unit_price)) : 'Rs. 0.00'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Add Part Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {(() => {
                    const itm = inventoryCatalog.find(i => i.id === parseInt(selectedPartId));
                    const ok = itm && itm.quantity_in_stock >= 1;
                    return (
                      <button
                        type="button"
                        disabled={!ok}
                        onClick={handleAddPart}
                        style={{
                          height: 44, padding: '0 24px',
                          background: ok ? C.blue : C.slate200,
                          color: ok ? C.white : C.slate400,
                          border: 'none', borderRadius: 12,
                          fontSize: 12, fontWeight: 900,
                          cursor: ok ? 'pointer' : 'not-allowed',
                          textTransform: 'uppercase',
                          boxShadow: ok ? '0 4px 12px rgba(0,168,232,0.3)' : 'none',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Plus size={15} strokeWidth={3} />
                        {ok ? '+ Add Part to Estimate' : 'Select a Part First'}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Added Parts Table */}
              {selectedParts.length > 0 ? (
                <div style={{ border: `1.5px solid ${C.blueBorder}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.blue, color: C.white }}>
                        {['Part Name', 'Qty', 'Unit Price', 'Total', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', textAlign: i >= 1 ? 'center' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedParts.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${C.blueBorder}`, background: C.white }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: C.slate900 }}>
                            <span style={{ fontFamily: 'monospace', color: C.blue, fontWeight: 900, marginRight: 6 }}>[{p.item_code}]</span>{p.item_name}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 900 }}>{p.quantity}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'monospace', color: C.slate700 }}>{fmtLKR(p.unit_price)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, color: C.blue }}>{fmtLKR(p.total_price)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleRemovePart(idx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.slate400, fontSize: 16, fontWeight: 900 }}
                            >✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '18px', textAlign: 'center', border: `2px dashed ${C.blueBorder}`, borderRadius: 12, marginBottom: 12, background: C.white }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.slate400, margin: 0 }}>No spare parts added yet — select a part above and click "+ Add Part"</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1.5px solid ${C.blueBorder}` }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.slate800, textTransform: 'uppercase' }}>Total Parts Estimate:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: C.blue, fontFamily: 'monospace' }}>{fmtLKR(totalParts)}</span>
              </div>
            </div>
          </div>

          {/* ══ DISCOUNT / PROMOTIONAL OFFER SECTION ════════════════ */}
          <div style={{
            ...CARD,
            borderLeftWidth: 6,
            borderLeftColor: C.yellow,
            background: C.white,
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: `1.5px solid ${C.slate100}`, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.yellowDark }}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 16, fontWeight: 900, color: C.slate900, textTransform: 'uppercase' }}>
                    Discount / Promotional Offer
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.slate500, fontWeight: 500 }}>
                    Apply special customer discount, seasonal offer, or loyalty price deduction before final total
                  </p>
                </div>
              </div>

              {calculatedDiscount > 0 && (
                <span style={{
                  background: C.greenLight, color: C.greenDark, border: `1.5px solid ${C.greenBorder}`,
                  padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 900, textTransform: 'uppercase'
                }}>
                  ✓ Discount Applied ({fmtLKR(calculatedDiscount)})
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'center' }}>
              
              {/* 1. Discount Value Input */}
              <div>
                <label style={LABEL}>Discount Adjustment (LKR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 800, color: C.slate400, pointerEvents: 'none' }}>
                    Rs.
                  </span>
                  <StyledInput
                    type="number" step="0.01" min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="e.g. 1500.00"
                    style={{ paddingLeft: 42, fontFamily: 'monospace', fontWeight: 900, fontSize: 15, color: C.slate900 }}
                  />
                  {discountValue && (
                    <button
                      type="button"
                      onClick={() => setDiscountValue('')}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: C.slate100, border: 'none', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', color: C.slate500, fontSize: 12, fontWeight: 900 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Reason / Description Note */}
              <div>
                <label style={LABEL}>Promotional Offer / Reason (Optional)</label>
                <StyledInput
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Special Customer Discount / Loyalty Offer"
                />
              </div>

            </div>

            {/* Subtotal vs Discount Summary */}
            <div style={{
              marginTop: 16, paddingTop: 12, borderTop: `1.5px solid ${C.slate100}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              background: C.slate50, padding: '10px 16px', borderRadius: 14
            }}>
              <div style={{ fontSize: 12, color: C.slate600, fontWeight: 700 }}>
                Subtotal Before Discount: <strong style={{ color: C.slate900, fontFamily: 'monospace' }}>{fmtLKR(subtotalAmount)}</strong>
              </div>
              <div style={{ fontSize: 12, color: C.greenDark, fontWeight: 800 }}>
                Promotional Discount: <strong style={{ color: C.greenDark, fontFamily: 'monospace' }}>- {fmtLKR(calculatedDiscount)}</strong>
              </div>
            </div>
          </div>

          {/* ══ BOTTOM ACTION BAR ════════════════════════════════ */}
          <div style={{
            background: C.white,
            borderRadius: 20, padding: '24px 28px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: `2px solid ${C.blue}`,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.green, display: 'inline-block' }}></span>
                <span style={{ fontSize: 11, fontWeight: 900, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Estimated Grand Total (LKR)
                </span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", monospace', lineHeight: 1 }}>
                {fmtLKR(grandTotal)}
              </div>
              <div style={{ fontSize: 12, color: C.slate500, marginTop: 6, fontWeight: 600 }}>
                Labour: <strong style={{ color: C.yellowDark, fontFamily: 'monospace' }}>{fmtLKR(totalLabour)}</strong>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                Parts: <strong style={{ color: C.blue, fontFamily: 'monospace' }}>{fmtLKR(totalParts)}</strong>
                {calculatedDiscount > 0 && (
                  <>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    Discount: <strong style={{ color: C.greenDark, fontFamily: 'monospace' }}>- {fmtLKR(calculatedDiscount)}</strong>
                  </>
                )}
              </div>
            </div>

            <button type="submit" disabled={formSubmitting} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              height: 54, padding: '0 32px',
              background: formSubmitting ? C.slate400 : C.blue,
              color: C.white, border: 'none',
              borderRadius: 14, fontSize: 14, fontWeight: 900,
              cursor: formSubmitting ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              boxShadow: formSubmitting ? 'none' : '0 6px 20px rgba(0,168,232,0.35)',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap',
            }}>
              <FileText size={20} strokeWidth={2.5} />
              {formSubmitting ? 'Creating Quotation...' : '📄 Generate Official Quotation'}
            </button>
          </div>

        </form>
      )}

      {/* Quotation Detail Modal */}
      {selectedQuotation && (
        <QuotationDetailModal
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onConvertToJob={onConvertToJob}
        />
      )}

    </div>
  );
}
