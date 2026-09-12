import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Search, Wrench, Car, Package,
  User, CheckCircle2, AlertCircle, Zap, Copy, Layers,
  FileSpreadsheet, Sparkles, Check, ArrowRight, ExternalLink, RefreshCw
} from 'lucide-react';
import { getCustomers, getVehicles, getInventoryItems, createJobCard } from '../services/api';

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

/* ─────────────────────────── REUSABLE STYLES ────────────────────────────── */
const CARD = {
  background: C.white,
  border: `2px solid ${C.slate200}`,
  borderRadius: 20,
  padding: '28px 32px',
  boxShadow: '0 4px 24px rgba(15,23,42,0.07)',
  marginBottom: 28,
  width: '100%',
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
  height: 48,
  border: `1.5px solid ${C.slate200}`,
  borderRadius: 12,
  padding: '0 16px',
  fontSize: 14,
  fontWeight: 600,
  color: C.slate900,
  background: C.white,
  outline: 'none',
  fontFamily: 'Outfit, sans-serif',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

const DIVIDER = {
  border: 'none',
  borderTop: `1.5px solid ${C.slate100}`,
  margin: '20px 0',
};

/* ─────────────────────────── ICON BOX ───────────────────────────────────── */
function IconBox({ gradient, children }) {
  return (
    <div style={{
      width: 48, height: 48,
      borderRadius: 14,
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.white,
      flexShrink: 0,
      boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────── SECTION HEADER ─────────────────────────────── */
function SectionHeader({ step, total, title, subtitle, iconGradient, icon, badgeColor, badgeBg, badgeBorder, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 20, borderBottom: `1.5px solid ${C.slate100}`, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <IconBox gradient={iconGradient}>{icon}</IconBox>
        <div>
          <h2 style={{ margin: 0, fontFamily: '"Space Grotesk", Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: C.slate900, letterSpacing: '0.2px' }}>
            {step ? `${step}. ` : ''}{title}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: C.slate600 }}>{subtitle}</p>
        </div>
      </div>
      {right || (step && total && (
        <span style={{
          fontSize: 11, fontWeight: 800, color: badgeColor,
          background: badgeBg, border: `1.5px solid ${badgeBorder}`,
          padding: '4px 14px', borderRadius: 999, whiteSpace: 'nowrap',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Step {step} of {total}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────── FORM FIELD ─────────────────────────────────── */
function Field({ label, required, children, style }) {
  return (
    <div style={style}>
      <label style={LABEL}>{label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}</label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = 'text', style = {}, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...INPUT_BASE,
        ...style,
        borderColor: focused ? C.cyan : C.slate200,
        boxShadow: focused ? `0 0 0 3px ${C.cyanLight}` : 'none',
      }}
      {...rest}
    />
  );
}

function StyledSelect({ value, onChange, children, style = {} }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...INPUT_BASE,
        cursor: 'pointer',
        ...style,
        borderColor: focused ? C.cyan : C.slate200,
        boxShadow: focused ? `0 0 0 3px ${C.cyanLight}` : 'none',
      }}
    >
      {children}
    </select>
  );
}

function StyledTextarea({ value, onChange, placeholder, rows = 3, style = {} }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...INPUT_BASE,
        height: 'auto',
        padding: '12px 16px',
        resize: 'vertical',
        ...style,
        borderColor: focused ? C.cyan : C.slate200,
        boxShadow: focused ? `0 0 0 3px ${C.cyanLight}` : 'none',
      }}
    />
  );
}

function Grid2({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      {children}
    </div>
  );
}

function Grid4({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
      {children}
    </div>
  );
}

const PEUGEOT_MODELS = [
  'Peugeot 407 P',
  'Peugeot 5008 P',
  'Peugeot 3008 P',
  'Peugeot 208 P',
  'Peugeot 508 P',
  'Peugeot Partner P',
  'Peugeot 406 P',
  'Peugeot 308 P',
  'Peugeot 2008 P',
  'Universal / Other'
];

const createEmptyJobState = (index = 1) => ({
  id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  tabLabel: `Job #${index}`,
  vehicleSearchQuery: '',
  vehicleSearchResults: [],
  customerSearch: '',
  customerOptions: [],
  selectedCustomer: null,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  postalAddress: '',
  vehicleNumber: '',
  vinChassis: '',
  makeModel: 'Peugeot 407 P',
  mileage: '',
  repairFault: '',
  labourItems: [
    { description: 'Comprehensive Diagnostic & Inspection', amount: '3500' }
  ],
  selectedPartId: '',
  issueQty: 1,
  selectedParts: [],
  partSearchQuery: '',
  showPartDropdown: false,
  partFilterModel: 'Peugeot 407 P',
  status: 'draft', // 'draft', 'ready', 'created'
  createdData: null,
  error: '',
  successMsg: ''
});

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN MULTI-JOB OPENING COMPONENT                                          */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function JobOpeningForm({ onJobCreated, initialData, onClearInitialData }) {
  const [mode, setMode] = useState('multi-tab'); // 'single', 'multi-tab', 'fast-grid'
  
  // Multi-Job Tabs State
  const [jobs, setJobs] = useState([createEmptyJobState(1)]);
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  
  // Shared inventory catalog
  const [inventoryCatalog, setInventoryCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Batch Result Modal
  const [batchResults, setBatchResults] = useState(null);

  // Fast Grid rows state
  const [gridRows, setGridRows] = useState([
    { id: 1, vehicleNumber: '', makeModel: 'Peugeot 407 P', mileage: '', customerName: '', customerPhone: '', fault: 'General Periodic Maintenance', labour: '3500' },
    { id: 2, vehicleNumber: '', makeModel: 'Peugeot 5008 P', mileage: '', customerName: '', customerPhone: '', fault: 'Full Brake Service & Fluid Change', labour: '4500' },
    { id: 3, vehicleNumber: '', makeModel: 'Peugeot 3008 P', mileage: '', customerName: '', customerPhone: '', fault: 'Engine Oil & Filter Service', labour: '3500' }
  ]);

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle conversion from Quotation or Re-opening existing Job Card
  useEffect(() => {
    if (initialData) {
      setJobs(prevJobs => {
        const updated = [...prevJobs];
        const activeJob = { ...updated[activeJobIndex] };

        const vehNum = initialData.vehicle?.vehicle_number || initialData.vehicle_number || '';
        const makeMod = initialData.vehicle?.make_model || initialData.make_model || 'Peugeot 407 P';
        const vin = initialData.vehicle?.vin_chassis || initialData.vin_chassis || '';
        const mile = initialData.mileage ? initialData.mileage.toString() : '';
        const custName = initialData.customer?.name || initialData.customer_name || '';
        const custPhone = initialData.customer?.phone || initialData.customer_phone || '';
        const custEmail = initialData.customer?.email || initialData.customer_email || '';
        const custAddr = initialData.customer?.address || initialData.customer_address || '';
        const fault = initialData.repair_fault || initialData.repair_description || '';

        if (vehNum) activeJob.vehicleNumber = vehNum;
        if (makeMod) {
          activeJob.makeModel = makeMod;
          activeJob.partFilterModel = makeMod;
        }
        if (vin) activeJob.vinChassis = vin;
        if (mile) activeJob.mileage = mile;
        if (custName) activeJob.customerName = custName;
        if (custPhone) activeJob.customerPhone = custPhone;
        if (custEmail) activeJob.customerEmail = custEmail;
        if (custAddr) activeJob.postalAddress = custAddr;
        if (fault) activeJob.repairFault = fault;

        // Populate labour items
        if (initialData.parsed_labour_items && Array.isArray(initialData.parsed_labour_items) && initialData.parsed_labour_items.length > 0) {
          activeJob.labourItems = initialData.parsed_labour_items.map(item => ({
            description: item.description || '',
            amount: item.amount ? item.amount.toString() : ''
          }));
        } else if (initialData.labour_details) {
          try {
            const parsed = typeof initialData.labour_details === 'string'
              ? JSON.parse(initialData.labour_details)
              : initialData.labour_details;
            if (Array.isArray(parsed) && parsed.length > 0) {
              activeJob.labourItems = parsed.map(item => ({
                description: item.description || '',
                amount: item.amount ? item.amount.toString() : ''
              }));
            }
          } catch (e) {
            console.error('Error parsing labour_details:', e);
          }
        } else if (initialData.labour_charge) {
          activeJob.labourItems = [{ description: 'Mechanical Labour & Service Charges', amount: initialData.labour_charge.toString() }];
        }

        // Populate parts from inventory_issues (existing job) or parts_details (quotation)
        if (initialData.inventory_issues && Array.isArray(initialData.inventory_issues) && initialData.inventory_issues.length > 0) {
          activeJob.selectedParts = initialData.inventory_issues.map(p => ({
            inventory_item_id: p.inventory_item_id || p.inventory_item?.id || p.id,
            item_code: p.inventory_item?.item_code || p.item_code || 'PART',
            item_name: p.inventory_item?.item_name || p.item_name || 'Spare Part',
            applicable_model: p.inventory_item?.applicable_model || makeMod,
            unit_price: parseFloat(p.unit_price || 0),
            quantity_issued: parseInt(p.quantity_issued || p.quantity || 1),
            total_price: parseFloat(p.total_price || (parseFloat(p.unit_price || 0) * parseInt(p.quantity_issued || 1)))
          }));
        } else if (initialData.parts_details) {
          try {
            const parsedParts = typeof initialData.parts_details === 'string'
              ? JSON.parse(initialData.parts_details)
              : initialData.parts_details;
            if (Array.isArray(parsedParts) && parsedParts.length > 0) {
              activeJob.selectedParts = parsedParts.map(p => ({
                inventory_item_id: p.inventory_item_id || p.id,
                item_code: p.item_code || 'PART',
                item_name: p.item_name || '',
                applicable_model: p.applicable_model || makeMod,
                unit_price: parseFloat(p.unit_price || 0),
                quantity_issued: parseInt(p.quantity || p.quantity_issued || 1),
                total_price: parseFloat(p.total_price || (parseFloat(p.unit_price || 0) * parseInt(p.quantity || p.quantity_issued || 1)))
              }));
            }
          } catch (e) {
            console.error('Error parsing quotation parts_details:', e);
          }
        }

        activeJob.tabLabel = vehNum || initialData.job_number || `Job #${activeJobIndex + 1}`;
        if (initialData.payment_status === 'paid') {
          activeJob.successMsg = `🔒 INVOICE #${initialData.job_number} (CASH SETTLED - VIEW ONLY): This job has already been paid in full and is locked from editing.`;
        } else if (initialData.job_number) {
          activeJob.successMsg = `🛠️ OPENED JOB CARD #${initialData.job_number}: Loaded into active workspace for diagnostic & repair execution!`;
        } else if (initialData.quotation_number) {
          activeJob.successMsg = `⚡ CONVERTED FROM QUOTATION #${initialData.quotation_number}: Vehicle, customer & spare parts loaded automatically!`;
        }
        
        updated[activeJobIndex] = activeJob;
        return updated;
      });
    }
  }, [initialData]);

  const fetchInventory = async () => {
    try {
      const res = await getInventoryItems();
      setInventoryCatalog(res.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  // Active Job helper getters and setters
  const currentJob = jobs[activeJobIndex] || jobs[0];

  const updateCurrentJob = (fields) => {
    setJobs(prev => {
      const copy = [...prev];
      copy[activeJobIndex] = { ...copy[activeJobIndex], ...fields };
      // Update tab label if vehicle number changes
      if (fields.vehicleNumber !== undefined) {
        copy[activeJobIndex].tabLabel = fields.vehicleNumber.trim() ? fields.vehicleNumber.toUpperCase() : `Job #${activeJobIndex + 1}`;
      }
      return copy;
    });
  };

  // Tab management
  const handleAddJobTab = () => {
    const nextIdx = jobs.length + 1;
    const newJob = createEmptyJobState(nextIdx);
    setJobs(prev => [...prev, newJob]);
    setActiveJobIndex(jobs.length);
  };

  const handleDuplicateJobTab = () => {
    const nextIdx = jobs.length + 1;
    const clone = {
      ...currentJob,
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tabLabel: `${currentJob.vehicleNumber ? currentJob.vehicleNumber + ' (Copy)' : 'Job #' + nextIdx}`,
      status: 'draft',
      createdData: null,
      error: '',
      successMsg: ''
    };
    setJobs(prev => [...prev, clone]);
    setActiveJobIndex(jobs.length);
    setGlobalSuccess(`📋 Duplicated ${currentJob.tabLabel} into a new tab!`);
  };

  const handleCloseJobTab = (idxToClose, e) => {
    if (e) e.stopPropagation();
    if (jobs.length === 1) {
      // Reset single job
      setJobs([createEmptyJobState(1)]);
      setActiveJobIndex(0);
      return;
    }
    const newJobs = jobs.filter((_, i) => i !== idxToClose);
    setJobs(newJobs);
    if (activeJobIndex >= newJobs.length) {
      setActiveJobIndex(newJobs.length - 1);
    } else if (activeJobIndex === idxToClose) {
      setActiveJobIndex(Math.max(0, idxToClose - 1));
    }
  };

  // Quick Routine Fleet Package
  const handleApplyFleetPackage = () => {
    const defaultLabour = [
      { description: 'Engine Oil & Filter Replacement Service', amount: '2500' },
      { description: 'Full Brake Inspection, Cleaning & Caliper Check', amount: '3000' },
      { description: 'Multi-Point Vehicle Safety & Diagnostic Scan', amount: '2500' }
    ];
    updateCurrentJob({
      labourItems: defaultLabour,
      repairFault: currentJob.repairFault ? currentJob.repairFault + ' | Scheduled Periodic Maintenance' : 'Periodic Scheduled Maintenance & Safety Inspection',
      successMsg: '⚡ Applied Standard Routine Fleet Service Package!'
    });
  };

  // Customer search for active job
  const handleSearchCustomers = async (e) => {
    const val = e.target.value;
    updateCurrentJob({ customerSearch: val });
    if (val.trim().length > 0) {
      try {
        const res = await getCustomers(val);
        updateCurrentJob({ customerOptions: res.data || [] });
      } catch (err) { console.error(err); }
    } else {
      updateCurrentJob({ customerOptions: [] });
    }
  };

  const handleSelectCustomer = (c) => {
    updateCurrentJob({
      selectedCustomer: c,
      customerName: c.name || '',
      customerPhone: c.phone || '',
      customerEmail: c.email || '',
      postalAddress: c.address || '',
      customerOptions: [],
      customerSearch: '',
      successMsg: `✓ Customer ${c.name} selected!`
    });
  };

  // Vehicle search for active job
  const handleSearchVehicle = async (e) => {
    const query = e.target.value;
    updateCurrentJob({ vehicleSearchQuery: query });
    if (query.trim().length >= 1) {
      try {
        const res = await getVehicles(query.trim());
        updateCurrentJob({ vehicleSearchResults: res.data || [] });
      } catch (err) { console.error(err); }
    } else {
      updateCurrentJob({ vehicleSearchResults: [] });
    }
  };

  const handleSelectVehicle = (veh) => {
    const updates = {
      vehicleNumber: veh.vehicle_number || '',
      vinChassis: veh.vin_chassis || '',
      vehicleSearchResults: [],
      vehicleSearchQuery: veh.vehicle_number,
      tabLabel: veh.vehicle_number || `Job #${activeJobIndex + 1}`,
      successMsg: `✓ Vehicle ${veh.vehicle_number} & Customer details loaded automatically!`
    };
    if (veh.make_model) {
      updates.makeModel = veh.make_model;
      updates.partFilterModel = veh.make_model;
    }
    if (veh.customer) {
      updates.selectedCustomer = veh.customer;
      updates.customerName = veh.customer.name || '';
      updates.customerPhone = veh.customer.phone || '';
      updates.customerEmail = veh.customer.email || '';
      updates.postalAddress = veh.customer.address || '';
    }
    updateCurrentJob(updates);
  };

  // Labour items management for active job
  const handleAddLabourRow = () => {
    updateCurrentJob({
      labourItems: [...currentJob.labourItems, { description: '', amount: '' }]
    });
  };

  const handleRemoveLabourRow = (idx) => {
    if (currentJob.labourItems.length === 1) {
      updateCurrentJob({ labourItems: [{ description: '', amount: '' }] });
      return;
    }
    updateCurrentJob({
      labourItems: currentJob.labourItems.filter((_, i) => i !== idx)
    });
  };

  const handleLabourItemChange = (idx, field, value) => {
    const updated = [...currentJob.labourItems];
    updated[idx][field] = value;
    updateCurrentJob({ labourItems: updated });
  };

  const totalLabourCharge = currentJob.labourItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const effectiveFilterModel = currentJob.partFilterModel || currentJob.makeModel || 'All';

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

    if (currentJob.partSearchQuery.trim()) {
      const query = currentJob.partSearchQuery.toLowerCase().trim();
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

  // Parts attachment for active job
  const handleAddPartToJob = () => {
    if (!currentJob.selectedPartId) return;
    const item = inventoryCatalog.find(i => i.id === parseInt(currentJob.selectedPartId));
    if (!item) return;
    if (item.quantity_in_stock < currentJob.issueQty) {
      alert(`Stock insufficient for ${item.item_name}. Available: ${item.quantity_in_stock}`);
      return;
    }
    const existingIndex = currentJob.selectedParts.findIndex(p => p.inventory_item_id === item.id);
    if (existingIndex >= 0) {
      const updated = [...currentJob.selectedParts];
      updated[existingIndex].quantity_issued += parseInt(currentJob.issueQty);
      updated[existingIndex].total_price = updated[existingIndex].quantity_issued * parseFloat(item.unit_price);
      updateCurrentJob({ selectedParts: updated, selectedPartId: '', issueQty: 1, showPartDropdown: false });
    } else {
      updateCurrentJob({
        selectedParts: [...currentJob.selectedParts, {
          inventory_item_id: item.id,
          item_code: item.item_code,
          item_name: item.item_name,
          applicable_model: item.applicable_model || 'Universal',
          unit_price: parseFloat(item.unit_price),
          quantity_issued: parseInt(currentJob.issueQty),
          total_price: parseInt(currentJob.issueQty) * parseFloat(item.unit_price),
        }],
        selectedPartId: '',
        issueQty: 1,
        showPartDropdown: false
      });
    }
  };

  const handleRemovePartFromJob = (idx) => {
    updateCurrentJob({
      selectedParts: currentJob.selectedParts.filter((_, i) => i !== idx)
    });
  };

  const partsTotal = currentJob.selectedParts.reduce((s, p) => s + p.total_price, 0);
  const grandEstimatedTotal = partsTotal + totalLabourCharge;

  // Single Job Submission
  const validateJob = (job) => {
    if (!job.vehicleNumber.trim()) return 'Vehicle Registration No is required.';
    if (!job.customerName.trim()) return 'Customer Full Name is required.';
    if (!job.customerPhone.trim()) return 'Mobile Phone Number is required.';
    if (!job.repairFault.trim()) return 'Customer Repair Fault / Complaint is required.';
    return null;
  };

  const buildPayloadForJob = (job) => {
    const validLabourItems = job.labourItems
      .filter(item => item.description.trim() && !isNaN(parseFloat(item.amount)))
      .map(item => ({ description: item.description.trim(), amount: parseFloat(item.amount) }));

    const labourTot = validLabourItems.reduce((s, i) => s + i.amount, 0);

    return {
      customer_id: job.selectedCustomer ? job.selectedCustomer.id : null,
      customer_name: job.customerName.trim(),
      customer_phone: job.customerPhone.trim(),
      customer_email: job.customerEmail || null,
      customer_address: job.postalAddress || null,
      vehicle_number: job.vehicleNumber.toUpperCase().trim(),
      make_model: job.makeModel,
      vin_chassis: job.vinChassis || null,
      mileage: job.mileage ? parseInt(job.mileage) : 0,
      repair_fault: job.repairFault,
      technician_notes: '',
      labour_charge: labourTot,
      labour_items: validLabourItems,
      initial_issued_items: job.selectedParts
        .filter(p => p && p.inventory_item_id && !isNaN(parseInt(p.inventory_item_id)))
        .map(p => ({
          inventory_item_id: parseInt(p.inventory_item_id),
          quantity_issued: parseInt(p.quantity_issued) || 1,
        })),
    };
  };

  const handleSubmitSingleJob = async (e) => {
    if (e) e.preventDefault();
    const err = validateJob(currentJob);
    if (err) {
      updateCurrentJob({ error: err, successMsg: '' });
      return;
    }

    setLoading(true);
    updateCurrentJob({ error: '', successMsg: '' });

    try {
      const payload = buildPayloadForJob(currentJob);
      const res = await createJobCard(payload);
      updateCurrentJob({
        status: 'created',
        createdData: res.data,
        successMsg: `✅ Job Card ${res.data.job_number} created successfully!`,
        error: ''
      });
      setLoading(false);
      if (onJobCreated) onJobCreated(res.data);
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail || err.message;
      updateCurrentJob({ error: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    }
  };

  // Submit All Active Tabs simultaneously
  const handleSubmitAllTabs = async () => {
    setGlobalError('');
    setGlobalSuccess('');
    
    // Check validation on all jobs
    const invalidJobs = [];
    jobs.forEach((j, idx) => {
      const vErr = validateJob(j);
      if (vErr && j.status !== 'created') {
        invalidJobs.push(`Job #${idx + 1} (${j.tabLabel}): ${vErr}`);
      }
    });

    if (invalidJobs.length > 0) {
      setGlobalError(`Please resolve validation errors before submitting:\n• ` + invalidJobs.join('\n• '));
      return;
    }

    const unsubmittedJobs = jobs.filter(j => j.status !== 'created');
    if (unsubmittedJobs.length === 0) {
      setGlobalSuccess('All active job cards in the workspace have already been created!');
      return;
    }

    setLoading(true);
    const createdResults = [];
    const errorsList = [];

    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i];
      if (j.status === 'created') {
        createdResults.push(j.createdData);
        continue;
      }

      try {
        const payload = buildPayloadForJob(j);
        const res = await createJobCard(payload);
        createdResults.push(res.data);
        
        // Update job status in state
        setJobs(prev => {
          const c = [...prev];
          c[i] = { ...c[i], status: 'created', createdData: res.data, successMsg: `✅ Created: ${res.data.job_number}` };
          return c;
        });
      } catch (err) {
        const d = err.response?.data?.detail || err.message;
        errorsList.push(`Job #${i + 1} (${j.tabLabel}): ${d}`);
      }
    }

    setLoading(false);
    if (createdResults.length > 0) {
      setBatchResults(createdResults);
      setGlobalSuccess(`🎉 Successfully created ${createdResults.length} Job Cards in batch!`);
      if (onJobCreated && createdResults[0]) onJobCreated(createdResults[0]);
    }
    if (errorsList.length > 0) {
      setGlobalError(`Some job cards encountered errors:\n• ` + errorsList.join('\n• '));
    }
  };

  // Fast Grid Row Management
  const handleAddGridRow = () => {
    setGridRows(prev => [
      ...prev,
      {
        id: Date.now(),
        vehicleNumber: '',
        makeModel: 'Peugeot 407 P',
        mileage: '',
        customerName: '',
        customerPhone: '',
        fault: 'Periodic Scheduled Maintenance',
        labour: '3500'
      }
    ]);
  };

  const handleRemoveGridRow = (id) => {
    if (gridRows.length === 1) return;
    setGridRows(prev => prev.filter(r => r.id !== id));
  };

  const handleGridRowChange = (id, field, val) => {
    setGridRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleSubmitFastGrid = async () => {
    setGlobalError('');
    setGlobalSuccess('');
    
    // Validate rows
    const validRows = gridRows.filter(r => r.vehicleNumber.trim() && r.customerName.trim() && r.customerPhone.trim());
    if (validRows.length === 0) {
      setGlobalError('Please fill in at least one row with Vehicle No, Customer Name & Phone Number.');
      return;
    }

    setLoading(true);
    const createdResults = [];
    const errorsList = [];

    for (let r of validRows) {
      try {
        const payload = {
          customer_name: r.customerName.trim(),
          customer_phone: r.customerPhone.trim(),
          vehicle_number: r.vehicleNumber.toUpperCase().trim(),
          make_model: r.makeModel,
          mileage: r.mileage ? parseInt(r.mileage) : 0,
          repair_fault: r.fault || 'General Service',
          technician_notes: 'Fast Batch Intake',
          labour_charge: parseFloat(r.labour) || 3500,
          labour_items: [{ description: r.fault || 'Routine Service', amount: parseFloat(r.labour) || 3500 }],
          initial_issued_items: []
        };
        const res = await createJobCard(payload);
        createdResults.push(res.data);
      } catch (err) {
        errorsList.push(`${r.vehicleNumber}: ${err.response?.data?.detail || err.message}`);
      }
    }

    setLoading(false);
    if (createdResults.length > 0) {
      setBatchResults(createdResults);
      setGlobalSuccess(`🎉 Successfully batch-created ${createdResults.length} Job Cards from the intake grid!`);
    }
    if (errorsList.length > 0) {
      setGlobalError(`Some rows had errors:\n• ` + errorsList.join('\n• '));
    }
  };

  const fmt = (val) => `LKR ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalAllJobsValue = jobs.reduce((sum, j) => {
    const lTot = j.labourItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const pTot = j.selectedParts.reduce((s, p) => s + p.total_price, 0);
    return sum + lTot + pTot;
  }, 0);

  /* ─────────────────── RENDER ─────────────────────────────────────────── */
  return (
    <div style={{ width: '100%', paddingBottom: 80, fontFamily: 'Outfit, sans-serif' }}>

      {/* ── TOP MULTI-JOB WORKSPACE CONTROLS & MODE SELECTOR (CLEAN LIGHT THEME) ───────────── */}
      <div style={{
        background: C.white,
        borderRadius: 22,
        padding: '24px 30px',
        marginBottom: 24,
        boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
        border: `2px solid ${C.slate200}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.cyanLight, color: C.cyanDark, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, border: `1.5px solid #bae6fd` }}>
              <Layers size={13} /> Workshop Multi-Job Workspace
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, fontFamily: '"Space Grotesk", Outfit, sans-serif', color: C.slate900, letterSpacing: -0.5 }}>
              Open Multiple Job Cards Simultaneously
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.slate600, fontWeight: 500 }}>
              Work on multiple customer vehicles in parallel and batch create job cards in one click.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', background: C.slate100, padding: 5, borderRadius: 14, border: `1px solid ${C.slate200}`, gap: 4 }}>
            <button
              type="button"
              onClick={() => setMode('multi-tab')}
              style={{
                background: mode === 'multi-tab' ? `linear-gradient(135deg, ${C.cyan} 0%, ${C.cyanDark} 100%)` : 'transparent',
                color: mode === 'multi-tab' ? C.white : C.slate700,
                border: 'none',
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: mode === 'multi-tab' ? '0 4px 12px rgba(0,168,232,0.3)' : 'none'
              }}
            >
              <Layers size={14} /> Multi-Job Tabs ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('fast-grid')}
              style={{
                background: mode === 'fast-grid' ? `linear-gradient(135deg, ${C.emerald} 0%, #047857 100%)` : 'transparent',
                color: mode === 'fast-grid' ? C.white : C.slate700,
                border: 'none',
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: mode === 'fast-grid' ? '0 4px 12px rgba(5,150,105,0.3)' : 'none'
              }}
            >
              <FileSpreadsheet size={14} /> Fast Batch Grid
            </button>
          </div>
        </div>

        {/* Dynamic Multi-Job Tab Bar */}
        {mode === 'multi-tab' && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1.5px solid ${C.slate100}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {jobs.map((j, idx) => {
                const isActive = idx === activeJobIndex;
                const isReady = !validateJob(j);
                const isCreated = j.status === 'created';

                return (
                  <div
                    key={j.id}
                    onClick={() => setActiveJobIndex(idx)}
                    style={{
                      background: isActive 
                        ? C.cyanLight 
                        : isCreated 
                          ? C.emeraldBg 
                          : C.slate50,
                      color: isActive ? C.slate900 : C.slate700,
                      border: isActive 
                        ? `2px solid ${C.cyan}` 
                        : isCreated 
                          ? `1.5px solid #a7f3d0` 
                          : `1.5px solid ${C.slate200}`,
                      padding: '8px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontWeight: 800,
                      fontSize: 13,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      boxShadow: isActive ? '0 4px 14px rgba(0,168,232,0.18)' : 'none',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Car size={15} color={isActive ? C.cyanDark : isCreated ? C.emerald : C.slate500} />
                      <span style={{ color: isActive ? C.cyanDark : C.slate900 }}>{j.tabLabel}</span>
                    </div>

                    <span style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: isCreated 
                        ? '#d1fae5' 
                        : isReady 
                          ? '#e0f2fe' 
                          : '#f1f5f9',
                      color: isCreated 
                        ? '#065f46' 
                        : isReady 
                          ? '#0369a1' 
                          : '#64748b',
                      fontWeight: 900
                    }}>
                      {isCreated ? 'Created' : isReady ? 'Ready' : 'Draft'}
                    </span>

                    {jobs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleCloseJobTab(idx, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 2,
                          fontSize: 13,
                          fontWeight: 900,
                          lineHeight: 1
                        }}
                        title="Close Tab"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add Job Tab Button */}
              <button
                type="button"
                onClick={handleAddJobTab}
                style={{
                  background: C.white,
                  border: `1.5px dashed ${C.cyan}`,
                  color: C.cyanDark,
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <Plus size={15} /> Add Job Card Tab
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── GLOBAL ALERTS ─────────────────────────────────────────────────── */}
      {globalError && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.redBg, border: `1.5px solid #fca5a5`, borderRadius: 14,
          padding: '14px 20px', marginBottom: 20, color: C.red, fontSize: 13, fontWeight: 700, whiteSpace: 'pre-line'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{globalError}</span>
          </div>
          <button onClick={() => setGlobalError('')} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>✕</button>
        </div>
      )}

      {globalSuccess && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.emeraldBg, border: `1.5px solid #6ee7b7`, borderRadius: 14,
          padding: '14px 20px', marginBottom: 20, color: C.emerald, fontSize: 14, fontWeight: 700,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} />
            <span>{globalSuccess}</span>
          </div>
          <button onClick={() => setGlobalSuccess('')} style={{ background: 'none', border: 'none', color: C.emerald, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>✕</button>
        </div>
      )}

      {/* ── TAB ACTIVE ALERTS ─────────────────────────────────────────────── */}
      {currentJob.error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.redBg, border: `1.5px solid #fca5a5`, borderRadius: 14,
          padding: '14px 20px', marginBottom: 20, color: C.red, fontSize: 14, fontWeight: 700,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} />
            <span>{currentJob.error}</span>
          </div>
          <button onClick={() => updateCurrentJob({ error: '' })} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>✕</button>
        </div>
      )}

      {currentJob.successMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.emeraldBg, border: `1.5px solid #6ee7b7`, borderRadius: 14,
          padding: '14px 20px', marginBottom: 20, color: C.emerald, fontSize: 14, fontWeight: 700,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} />
            <span>{currentJob.successMsg}</span>
          </div>
          <button onClick={() => updateCurrentJob({ successMsg: '' })} style={{ background: 'none', border: 'none', color: C.emerald, cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  VIEW A: FAST BATCH INTAKE GRID                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mode === 'fast-grid' ? (
        <div style={CARD}>
          <SectionHeader
            title="Fast Batch Vehicle Intake Grid"
            subtitle="Rapidly log multiple morning check-ins and fleet arrivals in a single table."
            iconGradient={`linear-gradient(135deg, ${C.emerald} 0%, #047857 100%)`}
            icon={<FileSpreadsheet size={24} />}
            right={
              <button
                type="button"
                onClick={handleAddGridRow}
                style={{
                  background: C.emeraldBg,
                  border: `1.5px solid ${C.emerald}`,
                  color: C.emerald,
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={14} /> Add Row
              </button>
            }
          />

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
              <thead>
                <tr style={{ background: C.slate800, color: C.white, textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', borderRadius: '10px 0 0 0' }}>#</th>
                  <th style={{ padding: '12px 14px' }}>Vehicle No *</th>
                  <th style={{ padding: '12px 14px' }}>Make / Model</th>
                  <th style={{ padding: '12px 14px' }}>Mileage (KM)</th>
                  <th style={{ padding: '12px 14px' }}>Customer Name *</th>
                  <th style={{ padding: '12px 14px' }}>Phone *</th>
                  <th style={{ padding: '12px 14px' }}>Fault / Service Package</th>
                  <th style={{ padding: '12px 14px' }}>Labour Fee (LKR)</th>
                  <th style={{ padding: '12px 14px', borderRadius: '0 10px 0 0', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${C.slate200}`, background: idx % 2 === 0 ? C.white : C.slate50 }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: C.slate400 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="text"
                        placeholder="e.g. WP CBJ-4599"
                        value={row.vehicleNumber}
                        onChange={(e) => handleGridRowChange(row.id, 'vehicleNumber', e.target.value.toUpperCase())}
                        style={{ ...INPUT_BASE, height: 38, fontSize: 13, textTransform: 'uppercase' }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <select
                        value={row.makeModel}
                        onChange={(e) => handleGridRowChange(row.id, 'makeModel', e.target.value)}
                        style={{ ...INPUT_BASE, height: 38, fontSize: 12, padding: '0 8px' }}
                      >
                        {PEUGEOT_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="number"
                        placeholder="KM"
                        value={row.mileage}
                        onChange={(e) => handleGridRowChange(row.id, 'mileage', e.target.value)}
                        style={{ ...INPUT_BASE, height: 38, fontSize: 13, width: 100 }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={row.customerName}
                        onChange={(e) => handleGridRowChange(row.id, 'customerName', e.target.value)}
                        style={{ ...INPUT_BASE, height: 38, fontSize: 13 }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="text"
                        placeholder="0771234567"
                        value={row.customerPhone}
                        onChange={(e) => handleGridRowChange(row.id, 'customerPhone', e.target.value)}
                        style={{ ...INPUT_BASE, height: 38, fontSize: 13 }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="text"
                        placeholder="Description of complaint"
                        value={row.fault}
                        onChange={(e) => handleGridRowChange(row.id, 'fault', e.target.value)}
                        style={{ ...INPUT_BASE, height: 38, fontSize: 13 }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="number"
                        placeholder="3500"
                        value={row.labour}
                        onChange={(e) => handleGridRowChange(row.id, 'labour', e.target.value)}
                        style={{ ...INPUT_BASE, height: 38, fontSize: 13, width: 110 }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {gridRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGridRow(row.id)}
                          style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <button
              type="button"
              onClick={handleAddGridRow}
              style={{
                background: C.slate100, border: `1.5px solid ${C.slate200}`,
                color: C.slate700, padding: '10px 20px', borderRadius: 12,
                fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <Plus size={16} /> Add Another Vehicle Row
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitFastGrid}
              style={{
                background: `linear-gradient(135deg, ${C.emerald} 0%, #047857 100%)`,
                color: C.white, border: 'none',
                padding: '14px 32px', borderRadius: 14,
                fontSize: 14, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(5,150,105,0.35)'
              }}
            >
              {loading ? 'Creating All Jobs...' : `🚀 Create All (${gridRows.filter(r => r.vehicleNumber.trim()).length}) Job Cards at Once`}
            </button>
          </div>
        </div>
      ) : (

        /* ═════════════════════════════════════════════════════════════════ */
        /*  VIEW B: MULTI-JOB TABS WORKSPACE (DETAILED FORM)                */
        /* ═════════════════════════════════════════════════════════════════ */
        <form onSubmit={handleSubmitSingleJob}>

          {/* ── TOP AUTO-FILL SEARCH BAR ─────────────────────────────────── */}
          <div style={{
            background: `linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0f9ff 100%)`,
            border: `2px solid ${C.cyan}`,
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: 28,
            boxShadow: `0 4px 20px rgba(0,168,232,0.12)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.cyanDark} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.white, flexShrink: 0,
              }}>
                <Zap size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontFamily: '"Space Grotesk", Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: C.slate900 }}>
                  Active Tab #{activeJobIndex + 1}: Instant Auto-Lookup
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: C.slate600 }}>
                  Search any registration or customer to auto-fill vehicle chassis, owner & service history.
                </p>
              </div>
            </div>

            <Grid2>
              {/* Vehicle Number Auto-Search */}
              <div style={{ position: 'relative' }}>
                <label style={{ ...LABEL, color: C.cyanDark, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Car size={13} /> Auto-Search by Vehicle Registration No
                </label>
                <div style={{ position: 'relative' }}>
                  <StyledInput
                    placeholder="Type vehicle no (e.g. WP CBJ-4599, CAD-1234)..."
                    value={currentJob.vehicleSearchQuery}
                    onChange={handleSearchVehicle}
                    style={{ paddingRight: 40, borderColor: C.cyan }}
                  />
                  <Search size={18} color={C.cyan} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                {/* Vehicle Dropdown */}
                {currentJob.vehicleSearchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: C.white, border: `2px solid ${C.cyan}`, borderRadius: 14,
                    marginTop: 4, boxShadow: '0 12px 36px rgba(0,0,0,0.18)', maxHeight: 220, overflowY: 'auto',
                  }}>
                    {currentJob.vehicleSearchResults.map((veh) => (
                      <div
                        key={veh.id}
                        onClick={() => handleSelectVehicle(veh)}
                        style={{
                          padding: '12px 16px', borderBottom: `1px solid ${C.slate100}`,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = C.cyanLight}
                        onMouseLeave={(e) => e.currentTarget.style.background = C.white}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: C.slate900 }}>{veh.vehicle_number}</div>
                          <div style={{ fontSize: 12, color: C.slate600 }}>{veh.make_model || 'Peugeot'} {veh.vin_chassis ? `| VIN: ${veh.vin_chassis}` : ''}</div>
                        </div>
                        {veh.customer && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.cyanDark, background: C.cyanLight, padding: '3px 8px', borderRadius: 6 }}>
                            {veh.customer.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Auto-Search */}
              <div style={{ position: 'relative' }}>
                <label style={{ ...LABEL, color: C.cyanDark, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <User size={13} /> Auto-Search by Customer Name / Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <StyledInput
                    placeholder="Type name or phone (e.g. Sanka, 077...)..."
                    value={currentJob.customerSearch}
                    onChange={handleSearchCustomers}
                    style={{ paddingRight: 40, borderColor: C.cyan }}
                  />
                  <Search size={18} color={C.cyan} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                {/* Customer Dropdown */}
                {currentJob.customerOptions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: C.white, border: `2px solid ${C.cyan}`, borderRadius: 14,
                    marginTop: 4, boxShadow: '0 12px 36px rgba(0,0,0,0.18)', maxHeight: 220, overflowY: 'auto',
                  }}>
                    {currentJob.customerOptions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        style={{
                          padding: '12px 16px', borderBottom: `1px solid ${C.slate100}`,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = C.cyanLight}
                        onMouseLeave={(e) => e.currentTarget.style.background = C.white}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: C.slate900 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: C.slate600 }}>{c.phone} {c.email ? `• ${c.email}` : ''}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald, background: C.emeraldBg, padding: '3px 8px', borderRadius: 6 }}>
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Grid2>
          </div>

          {/* ── STEP 1: VEHICLE INFORMATION ──────────────────────────────── */}
          <div style={CARD}>
            <SectionHeader
              step={1} total={4}
              title="Vehicle Specifications & Intake Metrics"
              subtitle="Vehicle registration, make/model, VIN chassis identifier, and active odometer mileage"
              iconGradient={`linear-gradient(135deg, ${C.cyan} 0%, ${C.cyanDark} 100%)`}
              icon={<Car size={24} />}
              badgeColor={C.cyanDark} badgeBg={C.cyanLight} badgeBorder={C.cyan}
            />

            <Grid4>
              <Field label="Vehicle Registration No" required>
                <StyledInput
                  placeholder="e.g. WP CBJ-4599"
                  value={currentJob.vehicleNumber}
                  onChange={(e) => updateCurrentJob({ vehicleNumber: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}
                />
              </Field>

              <Field label="Make & Model" required>
                <StyledSelect
                  value={currentJob.makeModel}
                  onChange={(e) => updateCurrentJob({ makeModel: e.target.value, partFilterModel: e.target.value })}
                >
                  {PEUGEOT_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </StyledSelect>
              </Field>

              <Field label="VIN / Chassis Number">
                <StyledInput
                  placeholder="e.g. VF30U9HZH..."
                  value={currentJob.vinChassis}
                  onChange={(e) => updateCurrentJob({ vinChassis: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                />
              </Field>

              <Field label="Current Odometer (KM)" required>
                <StyledInput
                  type="number"
                  placeholder="e.g. 115000"
                  value={currentJob.mileage}
                  onChange={(e) => updateCurrentJob({ mileage: e.target.value })}
                />
              </Field>
            </Grid4>
          </div>

          {/* ── STEP 2: CUSTOMER / OWNER PROFILE ─────────────────────────── */}
          <div style={CARD}>
            <SectionHeader
              step={2} total={4}
              title="Customer & Contact Details"
              subtitle="Vehicle registered owner, billing information, and verified contact phone"
              iconGradient={`linear-gradient(135deg, ${C.emerald} 0%, #047857 100%)`}
              icon={<User size={24} />}
              badgeColor={C.emerald} badgeBg={C.emeraldBg} badgeBorder="#6ee7b7"
            />

            <Grid2>
              <Field label="Customer Full Name" required>
                <StyledInput
                  placeholder="e.g. Sanka Fernando"
                  value={currentJob.customerName}
                  onChange={(e) => updateCurrentJob({ customerName: e.target.value })}
                />
              </Field>

              <Field label="Mobile Phone Number" required>
                <StyledInput
                  placeholder="e.g. 0771234567"
                  value={currentJob.customerPhone}
                  onChange={(e) => updateCurrentJob({ customerPhone: e.target.value })}
                />
              </Field>

              <Field label="Email Address">
                <StyledInput
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={currentJob.customerEmail}
                  onChange={(e) => updateCurrentJob({ customerEmail: e.target.value })}
                />
              </Field>

              <Field label="Postal / Billing Address">
                <StyledInput
                  placeholder="e.g. 121/3 Galle Road, Colombo"
                  value={currentJob.postalAddress}
                  onChange={(e) => updateCurrentJob({ postalAddress: e.target.value })}
                />
              </Field>
            </Grid2>
          </div>

          {/* ── STEP 3: REPAIR FAULT & ITEMIZED LABOUR CHARGES ─────────────── */}
          <div style={CARD}>
            <SectionHeader
              step={3} total={4}
              title="Reported Repair Fault & Itemized Labour Charges"
              subtitle="Customer diagnosis complaint and individual itemized technician labour operations"
              iconGradient={`linear-gradient(135deg, ${C.purple} 0%, #6d28d9 100%)`}
              icon={<Wrench size={24} />}
              badgeColor={C.purple} badgeBg={C.purpleBg} badgeBorder="#c4b5fd"
            />

            <Field label="Customer Repair Fault / Complaint Description" required style={{ marginBottom: 24 }}>
              <StyledTextarea
                placeholder="Describe reported issues e.g. Engine check light on, power steering noise, oil leak from tappet cover..."
                value={currentJob.repairFault}
                onChange={(e) => updateCurrentJob({ repairFault: e.target.value })}
                rows={3}
              />
            </Field>

            {/* Itemized Labour Rows */}
            <div style={{ background: C.slate50, borderRadius: 16, padding: '20px 24px', border: `1.5px solid ${C.slate200}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.slate700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Itemized Workshop Labour Operations
                </span>
                <button
                  type="button"
                  onClick={handleAddLabourRow}
                  style={{
                    background: `linear-gradient(135deg, ${C.purple} 0%, #6d28d9 100%)`,
                    color: C.white, border: 'none', borderRadius: 8,
                    padding: '6px 14px', fontSize: 12, fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={14} /> Add Labour Operation
                </button>
              </div>

              {currentJob.labourItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 3 }}>
                    <StyledInput
                      placeholder="Labour Operation (e.g. Remove & Refix Power Steering Pump)..."
                      value={item.description}
                      onChange={(e) => handleLabourItemChange(idx, 'description', e.target.value)}
                      style={{ height: 42, fontSize: 13 }}
                    />
                  </div>
                  <div style={{ flex: 1.5, minWidth: 140 }}>
                    <StyledInput
                      type="number"
                      placeholder="Amount (LKR)"
                      value={item.amount}
                      onChange={(e) => handleLabourItemChange(idx, 'amount', e.target.value)}
                      style={{ height: 42, fontSize: 13, textAlign: 'right' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLabourRow(idx)}
                    style={{
                      width: 40, height: 42, borderRadius: 10,
                      background: C.redBg, border: '1px solid #fca5a5',
                      color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                    title="Remove Operation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, paddingTop: 14, borderTop: `1.5px dashed ${C.slate200}` }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.slate600, marginRight: 12 }}>Total Labour Charges:</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: C.purple }}>{fmt(totalLabourCharge)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 4: SPARE PARTS ATTACHMENT ───────────────────────────── */}
          <div style={CARD}>
            <SectionHeader
              step={4} total={4}
              title="Issue Initial Spare Parts from Inventory"
              subtitle="Attach cataloged OEM & replacement spare parts with real-time stock allocation"
              iconGradient={`linear-gradient(135deg, ${C.amber} 0%, #b45309 100%)`}
              icon={<Package size={24} />}
              badgeColor={C.amber} badgeBg={C.amberBg} badgeBorder="#fcd34d"
            />

            {/* Part Selection Form */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ flex: 2, minWidth: 260, position: 'relative' }}>
                <label style={LABEL}>Search & Select Spare Part</label>
                <div style={{ position: 'relative' }}>
                  <StyledInput
                    placeholder="Search by part code or name (e.g. Brake Pad, Filter, Oil)..."
                    value={currentJob.partSearchQuery}
                    onChange={(e) => updateCurrentJob({ partSearchQuery: e.target.value, showPartDropdown: true })}
                    onFocus={() => updateCurrentJob({ showPartDropdown: true })}
                    style={{ paddingRight: 36 }}
                  />
                  <Search size={16} color={C.slate400} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                {/* Dropdown Options */}
                {currentJob.showPartDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: C.white, border: `2px solid ${C.amber}`, borderRadius: 14,
                    marginTop: 4, boxShadow: '0 12px 36px rgba(0,0,0,0.18)', maxHeight: 240, overflowY: 'auto',
                  }}>
                    {filteredInventory.slice(0, 30).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => updateCurrentJob({ selectedPartId: item.id.toString(), partSearchQuery: `${item.item_name} (${item.item_code})`, showPartDropdown: false })}
                        style={{
                          padding: '10px 14px', borderBottom: `1px solid ${C.slate100}`,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: currentJob.selectedPartId === item.id.toString() ? C.amberBg : C.white,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = C.amberBg}
                        onMouseLeave={(e) => e.currentTarget.style.background = currentJob.selectedPartId === item.id.toString() ? C.amberBg : C.white}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: C.slate900 }}>{item.item_name}</div>
                          <div style={{ fontSize: 11, color: C.slate600 }}>Code: {item.item_code} | For: {item.applicable_model || 'Universal'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: C.amber, fontSize: 13 }}>{fmt(item.unit_price)}</div>
                          <div style={{ fontSize: 10, color: item.quantity_in_stock > 5 ? C.emerald : C.red, fontWeight: 700 }}>
                            Stock: {item.quantity_in_stock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ width: 110 }}>
                <Field label="Qty">
                  <StyledInput
                    type="number"
                    min="1"
                    value={currentJob.issueQty}
                    onChange={(e) => updateCurrentJob({ issueQty: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ textAlign: 'center', fontWeight: 800 }}
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={handleAddPartToJob}
                style={{
                  height: 48, background: `linear-gradient(135deg, ${C.amber} 0%, #b45309 100%)`,
                  color: C.white, border: 'none', borderRadius: 12, padding: '0 24px',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
                }}
              >
                <Plus size={16} /> Attach Part
              </button>
            </div>

            {/* Selected Parts Table */}
            {currentJob.selectedParts.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.slate800, color: C.white, textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', borderRadius: '10px 0 0 0' }}>Code</th>
                      <th style={{ padding: '10px 14px' }}>Spare Part Description</th>
                      <th style={{ padding: '10px 14px' }}>For Model</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Unit Rate</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total (LKR)</th>
                      <th style={{ padding: '10px 14px', borderRadius: '0 10px 0 0', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentJob.selectedParts.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.slate200}`, background: idx % 2 === 0 ? C.white : C.slate50 }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: C.slate600 }}>{p.item_code}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: C.slate900 }}>{p.item_name}</td>
                        <td style={{ padding: '10px 14px', color: C.slate600 }}>{p.applicable_model}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800 }}>{p.quantity_issued}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{fmt(p.unit_price)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: C.amber }}>{fmt(p.total_price)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemovePartFromJob(idx)}
                            style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 16px', background: C.slate50, borderRadius: 14, border: `1.5px dashed ${C.slate200}`, color: C.slate400, fontSize: 13, fontWeight: 600 }}>
                No spare parts attached yet for this job card.
              </div>
            )}
          </div>

          {/* ── SUMMARY & MULTI-JOB SUBMIT ACTION BAR ────────────────────── */}
          <div style={{
            background: `linear-gradient(135deg, ${C.slate900} 0%, #1e293b 100%)`,
            borderRadius: 20,
            padding: '24px 32px',
            color: C.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            boxShadow: '0 12px 36px rgba(15,23,42,0.3)',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.cyanLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Active Job #{activeJobIndex + 1} ({currentJob.tabLabel}) Estimated Grand Total
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.white, fontFamily: '"Space Grotesk", Outfit, sans-serif' }}>
                {fmt(grandEstimatedTotal)}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Parts: {fmt(partsTotal)} + Labour: {fmt(totalLabourCharge)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Submit Active Tab Only */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.cyanDark} 100%)`,
                  color: C.white,
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(0,168,232,0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Opening Job Card...' : `🚀 Open Job Card & Proceed to Work Stage (${currentJob.tabLabel})`}
              </button>

              {/* Submit ALL Open Job Tabs */}
              {jobs.length > 1 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmitAllTabs}
                  style={{
                    background: `linear-gradient(135deg, ${C.emerald} 0%, #047857 100%)`,
                    color: C.white,
                    border: 'none',
                    padding: '14px 30px',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 6px 20px rgba(5,150,105,0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Sparkles size={16} /> Submit All ({jobs.length}) Job Cards
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ── BATCH CREATION RESULTS MODAL ──────────────────────────────────── */}
      {batchResults && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: C.white, borderRadius: 24, padding: '32px 36px',
            maxWidth: 680, width: '100%', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: `2px solid ${C.emerald}`
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: C.emeraldBg,
                color: C.emerald, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, border: `2px solid #6ee7b7`
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.slate900, fontFamily: '"Space Grotesk", Outfit, sans-serif' }}>
                Batch Job Cards Created Successfully!
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.slate600 }}>
                {batchResults.length} new official workshop job cards have been opened and registered in MySQL.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {batchResults.map((job, idx) => (
                <div
                  key={job.id || idx}
                  style={{
                    background: C.slate50, border: `1.5px solid ${C.slate200}`,
                    borderRadius: 14, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 900, fontSize: 14, color: C.cyanDark }}>{job.job_number}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.slate900 }}>• {job.vehicle?.vehicle_number || job.vehicle_number || 'PEUGEOT'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.slate600, marginTop: 2 }}>
                      Owner: {job.customer?.name || job.customer_name || 'Customer'} | Labour: {fmt(job.labour_charge)}
                    </div>
                  </div>

                  <span style={{
                    fontSize: 11, fontWeight: 800, color: C.emerald,
                    background: C.emeraldBg, padding: '4px 10px', borderRadius: 8,
                    border: '1px solid #a7f3d0'
                  }}>
                    Active / Open
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setBatchResults(null);
                  setJobs([createEmptyJobState(1)]);
                  setActiveJobIndex(0);
                }}
                style={{
                  background: `linear-gradient(135deg, ${C.slate900} 0%, #1e293b 100%)`,
                  color: C.white, border: 'none',
                  padding: '12px 28px', borderRadius: 12,
                  fontSize: 13, fontWeight: 800, cursor: 'pointer'
                }}
              >
                Close & Start New Batch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
