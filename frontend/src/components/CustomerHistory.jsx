import React, { useState, useEffect } from 'react';
import { 
  User, Search, Phone, Mail, MapPin, Calendar, Car, Wrench, Package, 
  FileText, ShieldCheck, CheckCircle2, Clock, DollarSign, ChevronRight, 
  Printer, Plus, Zap, AlertCircle, Share2, Sparkles, ExternalLink,
  Edit3, Save, X, PlusCircle
} from 'lucide-react';
import { 
  searchCustomerHistory, getCustomerHistory, 
  updateCustomer, updateVehicle, createVehicle 
} from '../services/api';

/* ─────────────────────────── DESIGN TOKENS ─────────────────────────────── */
const C = {
  cyan:       '#00a8e8',
  cyanDark:   '#0087bc',
  cyanLight:  '#e0f5fd',
  emerald:    '#059669',
  emeraldBg:  '#ecfdf5',
  amber:      '#d97706',
  amberBg:    '#fffbeb',
  purple:     '#7c3aed',
  purpleBg:   '#f5f3ff',
  slate900:   '#0f172a',
  slate800:   '#1e293b',
  slate700:   '#334155',
  slate600:   '#475569',
  slate400:   '#94a3b8',
  slate200:   '#e2e8f0',
  slate100:   '#f1f5f9',
  slate50:    '#f8fafc',
  white:      '#ffffff',
  red:        '#dc2626',
  redBg:      '#fef2f2',
};

const CARD = {
  background: C.white,
  border: `2px solid ${C.slate200}`,
  borderRadius: 20,
  padding: '24px 28px',
  boxShadow: '0 4px 24px rgba(15,23,42,0.07)',
  marginBottom: 24,
  width: '100%',
};

const INPUT_BASE = {
  width: '100%',
  height: 46,
  border: `1.5px solid ${C.slate200}`,
  borderRadius: 12,
  padding: '0 14px',
  fontSize: 14,
  fontWeight: 600,
  color: C.slate900,
  background: C.white,
  outline: 'none',
  fontFamily: 'Outfit, sans-serif',
  boxSizing: 'border-box',
};

const fmt = (val) => `LKR ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerHistory({ onViewJob, onViewQuotation, onConvertToJob, onOpenNewJobForCustomer }) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  
  const [loadingList, setLoadingList] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'quotations' | 'vehicles'

  // Customer Edit State
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [customerEditForm, setCustomerEditForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerEditError, setCustomerEditError] = useState(null);

  // Vehicle Edit & Add State
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [vehicleEditForm, setVehicleEditForm] = useState({ id: null, vehicle_number: '', make_model: '', vin_chassis: '' });
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleEditError, setVehicleEditError] = useState(null);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [vehicleAddForm, setVehicleAddForm] = useState({ vehicle_number: '', make_model: 'Peugeot 407', vin_chassis: '' });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicleAddError, setVehicleAddError] = useState(null);

  // Fetch customer list
  useEffect(() => {
    fetchCustomersList();
  }, [search]);

  // Fetch full detailed history when selected customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetailedData(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const fetchCustomersList = async () => {
    setLoadingList(true);
    try {
      const res = await searchCustomerHistory(search);
      setCustomers(res.data || []);
      // Auto select first customer if none selected
      if (!selectedCustomerId && res.data && res.data.length > 0) {
        setSelectedCustomerId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchCustomerDetailedData = async (id) => {
    setLoadingHistory(true);
    try {
      const res = await getCustomerHistory(id);
      setHistoryData(res.data);
    } catch (err) {
      console.error('Error fetching customer history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenEditCustomer = () => {
    if (!historyData?.customer) return;
    setCustomerEditForm({
      name: historyData.customer.name || '',
      phone: historyData.customer.phone || '',
      email: historyData.customer.email || '',
      address: historyData.customer.address || ''
    });
    setCustomerEditError(null);
    setIsEditCustomerOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerEditForm.name.trim() || !customerEditForm.phone.trim()) {
      setCustomerEditError('Customer Name and Phone Number are required.');
      return;
    }
    setSavingCustomer(true);
    setCustomerEditError(null);
    try {
      await updateCustomer(selectedCustomerId, customerEditForm);
      setIsEditCustomerOpen(false);
      await fetchCustomerDetailedData(selectedCustomerId);
      await fetchCustomersList();
    } catch (err) {
      setCustomerEditError(err.response?.data?.detail || err.message || 'Failed to update customer details');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleOpenEditVehicle = (veh) => {
    setVehicleEditForm({
      id: veh.id,
      vehicle_number: veh.vehicle_number || '',
      make_model: veh.make_model || '',
      vin_chassis: veh.vin_chassis || ''
    });
    setVehicleEditError(null);
    setIsEditVehicleOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleEditForm.vehicle_number.trim() || !vehicleEditForm.make_model.trim()) {
      setVehicleEditError('Vehicle Number and Model are required.');
      return;
    }
    setSavingVehicle(true);
    setVehicleEditError(null);
    try {
      await updateVehicle(vehicleEditForm.id, {
        vehicle_number: vehicleEditForm.vehicle_number.trim(),
        make_model: vehicleEditForm.make_model.trim(),
        vin_chassis: vehicleEditForm.vin_chassis.trim()
      });
      setIsEditVehicleOpen(false);
      await fetchCustomerDetailedData(selectedCustomerId);
      await fetchCustomersList();
    } catch (err) {
      setVehicleEditError(err.response?.data?.detail || err.message || 'Failed to update vehicle details');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleOpenAddVehicle = () => {
    setVehicleAddForm({
      vehicle_number: '',
      make_model: 'Peugeot 407',
      vin_chassis: ''
    });
    setVehicleAddError(null);
    setIsAddVehicleOpen(true);
  };

  const handleSaveNewVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleAddForm.vehicle_number.trim() || !vehicleAddForm.make_model.trim()) {
      setVehicleAddError('Vehicle Number and Model are required.');
      return;
    }
    setAddingVehicle(true);
    setVehicleAddError(null);
    try {
      await createVehicle({
        customer_id: selectedCustomerId,
        vehicle_number: vehicleAddForm.vehicle_number.trim(),
        make_model: vehicleAddForm.make_model.trim(),
        vin_chassis: vehicleAddForm.vin_chassis.trim()
      });
      setIsAddVehicleOpen(false);
      await fetchCustomerDetailedData(selectedCustomerId);
      await fetchCustomersList();
    } catch (err) {
      setVehicleAddError(err.response?.data?.detail || err.message || 'Failed to add new vehicle');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!historyData?.customer?.phone) return;
    const rawPhone = historyData.customer.phone;
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? '94' + cleanPhone.slice(1) : cleanPhone;
    const text = `*PEUGEOT LAND (PVT) LTD*\nDear ${historyData.customer.name},\nThank you for trusting Peugeot Land with your Peugeot vehicle service & repairs.\nHotline: 0775101292 / 0779980747\nPanadura Workshop`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ width: '100%', paddingBottom: 80, fontFamily: 'Outfit, sans-serif' }}>
      
      {/* ── TOP EXECUTIVE BANNER ─────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.slate900} 0%, ${C.slate800} 100%)`,
        border: `2px solid ${C.slate700}`,
        borderRadius: 20,
        padding: '24px 30px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,168,232,0.18)', border: '1px solid rgba(0,168,232,0.4)',
            color: C.cyan, padding: '3px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8
          }}>
            <ShieldCheck size={14} /> Complete Customer Dossier &amp; Service History
          </div>
          <h1 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 22, fontWeight: 900, color: C.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            CUSTOMER INDIVIDUAL SERVICE &amp; REPAIR HISTORY
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.slate400, fontWeight: 500 }}>
            Inspect complete vehicle maintenance records, past job cards, replaced spare parts, and invoices by customer.
          </p>
        </div>

        {/* Global Search across Name, Phone, Vehicle Reg No */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 15, color: C.cyan, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by Name, Phone, or Vehicle No (e.g. 407, KI 6003)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...INPUT_BASE,
              paddingLeft: 42,
              paddingRight: search ? 36 : 14,
              height: 46,
              background: '#ffffff',
              borderColor: search ? C.cyan : C.slate700,
              color: C.slate900,
              fontWeight: 700
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', color: C.slate400, cursor: 'pointer', fontWeight: 900 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN WORKSPACE: LEFT DIRECTORY + RIGHT FULL DOSSIER ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* ── LEFT COLUMN: CUSTOMER DIRECTORY LIST ────────────────────────── */}
        <div style={{ ...CARD, padding: 18, marginBottom: 0, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1.5px solid ${C.slate100}`, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} style={{ color: C.cyan }} />
              <span style={{ fontSize: 12, fontWeight: 900, color: C.slate900, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Customer Directory
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, background: C.cyanLight, padding: '2px 8px', borderRadius: 999 }}>
              {customers.length} Found
            </span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingList ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: C.slate400, fontSize: 12, fontWeight: 600 }}>
                Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: C.slate400, fontSize: 12, fontWeight: 600 }}>
                No customers found matching "{search}"
              </div>
            ) : (
              customers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: `1.5px solid ${isSelected ? C.cyan : C.slate200}`,
                      background: isSelected ? C.cyanLight : C.white,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 4px 14px rgba(0,168,232,0.15)' : 'none'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = C.slate50; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = C.white; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: isSelected ? C.cyanDark : C.slate900 }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isSelected ? C.cyanDark : C.slate500, background: isSelected ? '#ffffff' : C.slate100, padding: '2px 6px', borderRadius: 6 }}>
                        {c.total_jobs} Job{c.total_jobs !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.slate600, fontFamily: 'monospace', fontWeight: 700, marginBottom: 6 }}>
                      <Phone size={12} style={{ color: C.slate400 }} />
                      <span>{c.phone}</span>
                    </div>

                    {c.vehicles && c.vehicles.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {c.vehicles.map((v, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10, fontWeight: 800, fontFamily: 'monospace',
                              background: isSelected ? '#ffffff' : C.slate100,
                              color: isSelected ? C.cyanDark : C.slate700,
                              padding: '2px 6px', borderRadius: 4,
                              border: `1px solid ${isSelected ? '#bae6fd' : C.slate200}`
                            }}
                          >
                            🚗 {v.vehicle_number}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: FULL CUSTOMER DOSSIER & HISTORY ───────────────── */}
        <div>
          {loadingHistory ? (
            <div style={{ ...CARD, textAlign: 'center', padding: '60px 20px', color: C.slate400, fontWeight: 700 }}>
              Loading complete customer profile and service history...
            </div>
          ) : !historyData ? (
            <div style={{ ...CARD, textAlign: 'center', padding: '60px 20px', color: C.slate400, fontWeight: 700 }}>
              Select a customer from the left directory to view full service history.
            </div>
          ) : (
            <div>
              
              {/* ── 1. CUSTOMER EXECUTIVE PROFILE CARD ────────────────────── */}
              <div style={{
                ...CARD,
                borderLeftWidth: 6,
                borderLeftColor: C.cyan,
                padding: '24px 28px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Customer Initials Avatar */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 18,
                      background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.cyanDark} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.white, fontWeight: 900, fontSize: 22, fontFamily: '"Space Grotesk", sans-serif',
                      boxShadow: '0 6px 18px rgba(0,168,232,0.35)', flexShrink: 0
                    }}>
                      {historyData.customer.name ? historyData.customer.name.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 22, fontWeight: 900, color: C.slate900 }}>
                          {historyData.customer.name}
                        </h2>
                        <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, background: C.cyanLight, padding: '2px 8px', borderRadius: 999 }}>
                          ID: #{historyData.customer.id}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap', fontSize: 13, color: C.slate600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontFamily: 'monospace', color: C.slate900 }}>
                          <Phone size={14} style={{ color: C.cyan }} />
                          <span>{historyData.customer.phone}</span>
                        </div>
                        {historyData.customer.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <Mail size={14} style={{ color: C.cyan }} />
                            <span>{historyData.customer.email}</span>
                          </div>
                        )}
                        {historyData.customer.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <MapPin size={14} style={{ color: C.cyan }} />
                            <span>{historyData.customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Quick Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleOpenEditCustomer}
                      style={{
                        padding: '8px 14px', background: C.slate900, color: C.white,
                        border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        textTransform: 'uppercase', boxShadow: '0 3px 10px rgba(15,23,42,0.2)'
                      }}
                    >
                      <Edit3 size={13} /> Edit Customer
                    </button>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      style={{
                        padding: '8px 14px', background: C.emerald, color: C.white,
                        border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        textTransform: 'uppercase', boxShadow: '0 3px 10px rgba(5,150,105,0.25)'
                      }}
                    >
                      <Share2 size={13} /> WhatsApp
                    </button>
                    
                    {onOpenNewJobForCustomer && (
                      <button
                        type="button"
                        onClick={() => onOpenNewJobForCustomer(historyData.customer)}
                        style={{
                          padding: '8px 14px', background: C.cyan, color: C.white,
                          border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          textTransform: 'uppercase', boxShadow: '0 3px 10px rgba(0,168,232,0.25)'
                        }}
                      >
                        <Plus size={14} strokeWidth={3} /> Open Job Card
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Financial & Activity Metric Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  
                  {/* Lifetime Spend */}
                  <div style={{ background: C.slate50, border: `1.5px solid ${C.slate200}`, borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
                      Total Lifetime Spent
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.slate900, fontFamily: 'monospace' }}>
                      {fmt(historyData.stats.total_spent)}
                    </div>
                  </div>

                  {/* Registered Vehicles */}
                  <div style={{ background: C.cyanLight, border: `1.5px solid #bae6fd`, borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: C.cyanDark, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
                      Registered Vehicles
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.cyanDark, fontFamily: 'monospace' }}>
                      {historyData.stats.total_vehicles} Vehicle{historyData.stats.total_vehicles !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Total Job Cards */}
                  <div style={{ background: C.emeraldBg, border: `1.5px solid #6ee7b7`, borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
                      Service Jobs
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.emerald, fontFamily: 'monospace' }}>
                      {historyData.stats.total_jobs} Total ({historyData.stats.completed_jobs} Done)
                    </div>
                  </div>

                  {/* Quotations */}
                  <div style={{ background: C.purpleBg, border: `1.5px solid #ddd6fe`, borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
                      Quotations Given
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.purple, fontFamily: 'monospace' }}>
                      {historyData.stats.total_quotations} Estimate{historyData.stats.total_quotations !== 1 ? 's' : ''}
                    </div>
                  </div>

                </div>
              </div>

              {/* ── 2. HISTORY TABS (JOB CARDS / QUOTATIONS / VEHICLES) ───── */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: `2px solid ${C.slate200}`, paddingBottom: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('jobs')}
                    style={{
                      padding: '8px 18px', borderRadius: 12, border: 'none',
                      background: activeTab === 'jobs' ? C.slate900 : C.slate100,
                      color: activeTab === 'jobs' ? C.white : C.slate700,
                      fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                    }}
                  >
                    <Wrench size={14} />
                    <span>Job Cards &amp; Service Invoices ({historyData.job_cards.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('quotations')}
                    style={{
                      padding: '8px 18px', borderRadius: 12, border: 'none',
                      background: activeTab === 'quotations' ? C.slate900 : C.slate100,
                      color: activeTab === 'quotations' ? C.white : C.slate700,
                      fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                    }}
                  >
                    <FileText size={14} />
                    <span>Price Estimates &amp; Quotations ({historyData.quotations.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('vehicles')}
                    style={{
                      padding: '8px 18px', borderRadius: 12, border: 'none',
                      background: activeTab === 'vehicles' ? C.slate900 : C.slate100,
                      color: activeTab === 'vehicles' ? C.white : C.slate700,
                      fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                    }}
                  >
                    <Car size={14} />
                    <span>Vehicles Profile ({historyData.vehicles.length})</span>
                  </button>
                </div>

                {activeTab === 'vehicles' && (
                  <button
                    type="button"
                    onClick={handleOpenAddVehicle}
                    style={{
                      padding: '8px 16px', background: C.cyan, color: C.white,
                      border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      textTransform: 'uppercase', boxShadow: '0 3px 10px rgba(0,168,232,0.25)'
                    }}
                  >
                    <PlusCircle size={14} /> + Register New Vehicle
                  </button>
                )}
              </div>

              {/* ── TAB 1: JOB CARDS & SERVICE TIMELINE ─────────────────────── */}
              {activeTab === 'jobs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {historyData.job_cards.length === 0 ? (
                    <div style={{ ...CARD, textAlign: 'center', padding: '40px', color: C.slate400, fontWeight: 700 }}>
                      No service job cards opened for this customer yet.
                    </div>
                  ) : (
                    historyData.job_cards.map((job) => {
                      const isPaid = job.payment_status === 'paid';
                      const isCompleted = job.status === 'Completed' || job.status === 'Delivered';
                      return (
                        <div
                          key={job.id}
                          style={{
                            ...CARD,
                            padding: 22,
                            marginBottom: 0,
                            borderLeftWidth: 5,
                            borderLeftColor: isPaid ? C.emerald : C.amber
                          }}
                        >
                          {/* Job Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: `1.5px solid ${C.slate100}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color: C.cyan, background: C.cyanLight, padding: '3px 10px', borderRadius: 8, border: `1px solid #bae6fd` }}>
                                #{job.job_number}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 900, color: C.slate900, display: 'flex', alignItems: 'center', gap: 4 }}>
                                🚗 {job.vehicle_number} <span style={{ color: C.slate500, fontWeight: 600 }}>({job.make_model})</span>
                              </span>
                              <span style={{ fontSize: 11, color: C.slate500, fontWeight: 700 }}>
                                📍 {job.mileage ? `${job.mileage.toLocaleString()} Km` : 'N/A'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {/* Date */}
                              <span style={{ fontSize: 11, color: C.slate400, fontWeight: 700 }}>
                                {new Date(job.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>

                              {/* Status Badge */}
                              <span style={{
                                fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                color: isCompleted ? C.emerald : C.amber,
                                background: isCompleted ? C.emeraldBg : C.amberBg,
                                border: `1px solid ${isCompleted ? '#6ee7b7' : '#fde68a'}`,
                                padding: '2px 8px', borderRadius: 6
                              }}>
                                {job.status}
                              </span>

                              {/* Payment Badge */}
                              <span style={{
                                fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                color: isPaid ? C.emerald : C.red,
                                background: isPaid ? C.emeraldBg : C.redBg,
                                border: `1px solid ${isPaid ? '#6ee7b7' : '#fca5a5'}`,
                                padding: '2px 8px', borderRadius: 6
                              }}>
                                {isPaid ? `PAID (${job.payment_method || 'Cash'})` : 'UNPAID'}
                              </span>
                            </div>
                          </div>

                          {/* Repair Fault & Work description */}
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: C.slate400, textTransform: 'uppercase', marginBottom: 2 }}>
                              Reported Fault / Requested Service:
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: C.slate900, fontWeight: 600 }}>
                              {job.repair_fault}
                            </p>
                          </div>

                          {/* Technician Notes */}
                          {job.technician_notes && (
                            <div style={{ background: C.slate50, border: `1px solid ${C.slate200}`, borderRadius: 10, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: C.slate700 }}>
                              <strong>Technician Work Performed:</strong> {job.technician_notes}
                            </div>
                          )}

                          {/* Financial Summary & Action Button */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTop: `1.5px solid ${C.slate100}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div>
                                <span style={{ fontSize: 10, color: C.slate400, fontWeight: 800, textTransform: 'uppercase' }}>Spare Parts Cost: </span>
                                <strong style={{ fontSize: 13, color: C.slate800, fontFamily: 'monospace' }}>{fmt(job.spare_parts_cost)}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: C.slate400, fontWeight: 800, textTransform: 'uppercase' }}>Labour Fee: </span>
                                <strong style={{ fontSize: 13, color: C.slate800, fontFamily: 'monospace' }}>{fmt(job.labour_charge)}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: C.slate400, fontWeight: 800, textTransform: 'uppercase' }}>Total Amount: </span>
                                <strong style={{ fontSize: 15, color: C.slate900, fontFamily: 'monospace', fontWeight: 900 }}>{fmt(job.total_amount)}</strong>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onViewJob(job.id, 'invoice-stage')}
                              style={{
                                padding: '6px 14px', background: C.slate900, color: C.white,
                                border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(15,23,42,0.15)'
                              }}
                            >
                              🖨 Official Invoice
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── TAB 2: ESTIMATES & QUOTATIONS ───────────────────────────── */}
              {activeTab === 'quotations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {historyData.quotations.length === 0 ? (
                    <div style={{ ...CARD, textAlign: 'center', padding: '40px', color: C.slate400, fontWeight: 700 }}>
                      No quotations issued for this customer yet.
                    </div>
                  ) : (
                    historyData.quotations.map((quo) => (
                      <div
                        key={quo.id}
                        style={{
                          ...CARD,
                          padding: 22,
                          marginBottom: 0,
                          borderLeftWidth: 5,
                          borderLeftColor: C.purple
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color: C.purple, background: C.purpleBg, padding: '3px 10px', borderRadius: 8, border: `1px solid #ddd6fe` }}>
                                #{quo.quotation_number}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 900, color: C.slate900 }}>
                                🚗 {quo.vehicle_number} ({quo.make_model})
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: C.slate600, fontWeight: 500 }}>
                              {quo.repair_description || 'Price estimate for diagnostic & maintenance'}
                            </p>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 10, color: C.slate400, fontWeight: 800, textTransform: 'uppercase' }}>
                                {new Date(quo.created_at).toLocaleDateString('en-GB')}
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 900, color: C.slate900, fontFamily: 'monospace' }}>
                                {fmt(quo.total_amount)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onViewQuotation(quo)}
                              style={{
                                padding: '6px 14px', background: C.slate900, color: C.white,
                                border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800,
                                cursor: 'pointer', textTransform: 'uppercase'
                              }}
                            >
                              🖨 View Quotation
                            </button>

                            {onConvertToJob && (
                              <button
                                type="button"
                                onClick={() => onConvertToJob(quo)}
                                style={{
                                  padding: '6px 14px', background: C.emerald, color: C.white,
                                  border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800,
                                  cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Zap size={12} /> Convert
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── TAB 3: REGISTERED VEHICLES PROFILE ─────────────────────── */}
              {activeTab === 'vehicles' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {historyData.vehicles.length === 0 ? (
                    <div style={{ ...CARD, gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: C.slate400, fontWeight: 700 }}>
                      No vehicles registered for this customer.
                    </div>
                  ) : (
                    historyData.vehicles.map((veh) => (
                      <div
                        key={veh.id}
                        style={{
                          ...CARD,
                          padding: 20,
                          marginBottom: 0,
                          borderLeftWidth: 5,
                          borderLeftColor: C.cyan,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.cyanLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                🚗
                              </div>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: C.cyan, fontFamily: 'monospace' }}>
                                  {veh.vehicle_number}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: C.slate800 }}>
                                  {veh.make_model}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEditVehicle(veh)}
                              style={{
                                padding: '5px 10px', background: C.slate100, color: C.slate700,
                                border: `1px solid ${C.slate200}`, borderRadius: 8, fontSize: 11, fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                              title="Edit Vehicle Details"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                          </div>

                          {veh.vin_chassis && (
                            <div style={{ fontSize: 11, color: C.slate500, fontFamily: 'monospace', marginBottom: 4 }}>
                              VIN: <strong>{veh.vin_chassis}</strong>
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: 11, color: C.slate400, marginTop: 12, paddingTop: 8, borderTop: `1px solid ${C.slate100}` }}>
                          Registered on: {new Date(veh.created_at).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: EDIT CUSTOMER DETAILS                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isEditCustomerOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-box" style={{ maxWidth: 520, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid ${C.slate200}`, paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: C.cyanLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", sans-serif' }}>
                    Edit Customer Details
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: C.slate500 }}>
                    Update contact info for ID #{selectedCustomerId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditCustomerOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: C.slate100, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate600 }}
              >
                <X size={16} />
              </button>
            </div>

            {customerEditError && (
              <div style={{ padding: '10px 14px', background: C.redBg, border: `1px solid #fca5a5`, borderRadius: 10, color: C.red, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                {customerEditError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerEditForm.name}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, name: e.target.value })}
                  placeholder="e.g. Mr. Sanka Rajapaksha"
                  style={INPUT_BASE}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Primary Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={customerEditForm.phone}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, phone: e.target.value })}
                  placeholder="e.g. 0775101292"
                  style={INPUT_BASE}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEditForm.email}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, email: e.target.value })}
                  placeholder="e.g. customer@example.com"
                  style={INPUT_BASE}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Residential / Business Address
                </label>
                <textarea
                  rows={3}
                  value={customerEditForm.address}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, address: e.target.value })}
                  placeholder="e.g. 124 Main Street, Panadura"
                  style={{ ...INPUT_BASE, height: 'auto', padding: '10px 14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsEditCustomerOpen(false)}
                  style={{ padding: '10px 18px', background: C.slate100, border: `1px solid ${C.slate200}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.slate700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  style={{ padding: '10px 22px', background: C.cyan, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,168,232,0.3)' }}
                >
                  <Save size={14} />
                  <span>{savingCustomer ? 'Saving Changes...' : 'Save Customer Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: EDIT VEHICLE DETAILS                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isEditVehicleOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-box" style={{ maxWidth: 500, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid ${C.slate200}`, paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: C.cyanLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
                  <Car size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", sans-serif' }}>
                    Edit Vehicle Details
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: C.slate500 }}>
                    Update registration, model & VIN
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditVehicleOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: C.slate100, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate600 }}
              >
                <X size={16} />
              </button>
            </div>

            {vehicleEditError && (
              <div style={{ padding: '10px 14px', background: C.redBg, border: `1px solid #fca5a5`, borderRadius: 10, color: C.red, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                {vehicleEditError}
              </div>
            )}

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Vehicle Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleEditForm.vehicle_number}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, vehicle_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. WP CAA-4321 / 407"
                  style={INPUT_BASE}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Peugeot Make & Model *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleEditForm.make_model}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, make_model: e.target.value })}
                  placeholder="e.g. Peugeot 407 2.0 HDi / Peugeot 3008 Allure"
                  style={INPUT_BASE}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  VIN / Chassis Number
                </label>
                <input
                  type="text"
                  value={vehicleEditForm.vin_chassis}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, vin_chassis: e.target.value.toUpperCase() })}
                  placeholder="e.g. VF36DRHRJ21456789"
                  style={INPUT_BASE}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsEditVehicleOpen(false)}
                  style={{ padding: '10px 18px', background: C.slate100, border: `1px solid ${C.slate200}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.slate700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  style={{ padding: '10px 22px', background: C.cyan, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,168,232,0.3)' }}
                >
                  <Save size={14} />
                  <span>{savingVehicle ? 'Saving...' : 'Save Vehicle Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: REGISTER NEW VEHICLE FOR THIS CUSTOMER                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isAddVehicleOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-box" style={{ maxWidth: 500, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid ${C.slate200}`, paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: C.cyanLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", sans-serif' }}>
                    Register Additional Vehicle
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: C.slate500 }}>
                    Add new vehicle for {historyData.customer.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: C.slate100, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate600 }}
              >
                <X size={16} />
              </button>
            </div>

            {vehicleAddError && (
              <div style={{ padding: '10px 14px', background: C.redBg, border: `1px solid #fca5a5`, borderRadius: 10, color: C.red, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                {vehicleAddError}
              </div>
            )}

            <form onSubmit={handleSaveNewVehicle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Vehicle Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleAddForm.vehicle_number}
                  onChange={(e) => setVehicleAddForm({ ...vehicleAddForm, vehicle_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. WP KI-6003 / 508"
                  style={INPUT_BASE}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  Peugeot Make & Model *
                </label>
                <select
                  value={vehicleAddForm.make_model}
                  onChange={(e) => setVehicleAddForm({ ...vehicleAddForm, make_model: e.target.value })}
                  style={INPUT_BASE}
                >
                  <option value="Peugeot 407">Peugeot 407</option>
                  <option value="Peugeot 3008">Peugeot 3008</option>
                  <option value="Peugeot 508">Peugeot 508</option>
                  <option value="Peugeot 206">Peugeot 206</option>
                  <option value="Peugeot 207">Peugeot 207</option>
                  <option value="Peugeot 208">Peugeot 208</option>
                  <option value="Peugeot 308">Peugeot 308</option>
                  <option value="Peugeot 408">Peugeot 408</option>
                  <option value="Peugeot 5008">Peugeot 5008</option>
                  <option value="Universal / Other Model">Universal / Other Model</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.slate700, marginBottom: 6 }}>
                  VIN / Chassis Number (Optional)
                </label>
                <input
                  type="text"
                  value={vehicleAddForm.vin_chassis}
                  onChange={(e) => setVehicleAddForm({ ...vehicleAddForm, vin_chassis: e.target.value.toUpperCase() })}
                  placeholder="e.g. VF36DRHRJ21456789"
                  style={INPUT_BASE}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  style={{ padding: '10px 18px', background: C.slate100, border: `1px solid ${C.slate200}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.slate700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingVehicle}
                  style={{ padding: '10px 22px', background: C.cyan, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,168,232,0.3)' }}
                >
                  <PlusCircle size={14} />
                  <span>{addingVehicle ? 'Registering...' : 'Register Vehicle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
