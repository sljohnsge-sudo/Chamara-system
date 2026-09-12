import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, DollarSign, TrendingUp, AlertTriangle, 
  Layers, CheckCircle, RefreshCw, Calculator, ShieldCheck, Tag, Car, Edit3, X, Sparkles
} from 'lucide-react';
import { getInventoryItems, createInventoryItem, updateInventoryItem, getInventorySummary } from '../services/api';

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

// Complete List of Peugeot Vehicle Models Available in Market
export const PEUGEOT_MODELS = [
  "Universal / All Peugeot Models",
  "Peugeot 108",
  "Peugeot 206",
  "Peugeot 207",
  "Peugeot 208",
  "Peugeot 301",
  "Peugeot 307",
  "Peugeot 308",
  "Peugeot 405",
  "Peugeot 406",
  "Peugeot 406 Coupe",
  "Peugeot 407",
  "Peugeot 408",
  "Peugeot 508",
  "Peugeot 607",
  "Peugeot 2008 SUV",
  "Peugeot 3008 SUV",
  "Peugeot 4007",
  "Peugeot 4008",
  "Peugeot 5008 SUV",
  "Peugeot RCZ",
  "Peugeot Rifter / Partner",
  "Peugeot Expert / Traveller",
  "Peugeot Boxer"
];

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

const LABEL = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  color: C.slate600,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: 6,
};

export default function InventoryManager({ userRole = 'Workshop Manager' }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedModelFilter, setSelectedModelFilter] = useState('All Models');
  const [loading, setLoading] = useState(false);
  
  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [applicableModel, setApplicableModel] = useState('Universal / All Peugeot Models');
  const [quantityInStock, setQuantityInStock] = useState(10);
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');
  const [costPrice, setCostPrice] = useState('');
  const [markupType, setMarkupType] = useState('percentage'); // 'percentage' | 'amount'
  const [markupValue, setMarkupValue] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto calculate selling price when cost or markup changes
  useEffect(() => {
    const cost = parseFloat(costPrice) || 0;
    const markup = parseFloat(markupValue) || 0;
    if (cost > 0) {
      if (markupType === 'percentage') {
        const calculated = cost + (cost * markup / 100);
        setUnitPrice(calculated.toFixed(2));
      } else {
        const calculated = cost + markup;
        setUnitPrice(calculated.toFixed(2));
      }
    }
  }, [costPrice, markupType, markupValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, summaryRes] = await Promise.all([
        getInventoryItems(search, selectedModelFilter),
        getInventorySummary()
      ]);
      setItems(itemsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedModelFilter]);

  const handleOpenAddModal = () => {
    setEditingItemId(null);
    setItemCode('');
    setItemName('');
    setApplicableModel('Universal / All Peugeot Models');
    setQuantityInStock(10);
    setUnitOfMeasure('pcs');
    setCostPrice('');
    setMarkupType('percentage');
    setMarkupValue('');
    setUnitPrice('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItemId(item.id);
    setItemCode(item.item_code || '');
    setItemName(item.item_name || '');
    setApplicableModel(item.applicable_model || 'Universal / All Peugeot Models');
    setQuantityInStock(item.quantity_in_stock || 0);
    setUnitOfMeasure(item.unit_of_measure || 'pcs');
    setCostPrice(item.cost_price ? item.cost_price.toString() : '');
    setMarkupType(item.markup_type || 'percentage');
    setMarkupValue(item.markup_value ? item.markup_value.toString() : '');
    setUnitPrice(item.unit_price ? item.unit_price.toString() : '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemCode || !itemName) {
      setFormError('Please enter Item Code and Item Name.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const cost = parseFloat(costPrice) || 0;
    const markup = parseFloat(markupValue) || 0;
    let computedSelling = parseFloat(unitPrice) || 0;
    if (computedSelling === 0 && cost > 0) {
      computedSelling = markupType === 'percentage' ? cost + (cost * markup / 100) : cost + markup;
    }

    const payload = {
      item_code: itemCode.trim().toUpperCase(),
      item_name: itemName.trim(),
      applicable_model: applicableModel,
      quantity_in_stock: parseInt(quantityInStock) || 0,
      cost_price: cost,
      markup_type: markupType,
      markup_value: markup,
      unit_price: computedSelling,
      unit_of_measure: unitOfMeasure
    };

    try {
      if (editingItemId) {
        await updateInventoryItem(editingItemId, payload);
      } else {
        await createInventoryItem(payload);
      }

      setShowAddModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving inventory item:', err);
      setFormError(err.response?.data?.detail || 'Failed to save item. Check code uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatLKR = (val) => `LKR ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ width: '100%', paddingBottom: 80, fontFamily: 'Outfit, sans-serif' }}>
      
      {/* ── EXECUTIVE TOP HEADER BOX ─────────────────────────────────────── */}
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
            <ShieldCheck size={14} /> Inventory &amp; Stock Valuation
          </div>
          <h1 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 22, fontWeight: 900, color: C.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            PEUGEOT LAND INVENTORY MANAGEMENT
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.slate400, fontWeight: 500 }}>
            Model-wise spare parts catalog, cost rates, markup margin calculator, and live stock valuation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          style={{
            height: 48,
            padding: '0 24px',
            background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.cyanDark} 100%)`,
            color: C.white,
            border: 'none',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 18px rgba(0,168,232,0.4)',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={18} strokeWidth={3} />
          <span>+ Add New Spare Part</span>
        </button>
      </div>

      {/* ── 4 LUXURY TOTAL STOCK VALUE METRIC CARDS ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* Total Stock Cost Value */}
        <div style={{ ...CARD, marginBottom: 0, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            TOTAL STOCK COST VALUE
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.slate900, fontFamily: 'monospace' }}>
            {formatLKR(summary?.total_cost_value)}
          </div>
          <div style={{ fontSize: 11, color: C.slate500, fontWeight: 600, marginTop: 4 }}>
            Total purchasing cost rate
          </div>
        </div>

        {/* Total Retail Selling Value */}
        <div style={{ ...CARD, marginBottom: 0, padding: 20, borderColor: '#bae6fd', background: C.cyanLight }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.cyanDark, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            TOTAL RETAIL SELLING VALUE
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.cyanDark, fontFamily: 'monospace' }}>
            {formatLKR(summary?.total_retail_value)}
          </div>
          <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 700, marginTop: 4 }}>
            Total stock value at retail price
          </div>
        </div>

        {/* Potential Stock Profit */}
        <div style={{ ...CARD, marginBottom: 0, padding: 20, borderColor: '#6ee7b7', background: C.emeraldBg }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            POTENTIAL STOCK PROFIT
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.emerald, fontFamily: 'monospace' }}>
            {formatLKR(summary?.potential_profit)}
          </div>
          <div style={{ fontSize: 11, color: '#047857', fontWeight: 800, marginTop: 4 }}>
            Margin: {summary?.margin_percent || 0}% overall
          </div>
        </div>

        {/* Total Parts & Units */}
        <div style={{ ...CARD, marginBottom: 0, padding: 20, borderColor: '#ddd6fe', background: C.purpleBg }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            TOTAL CATALOG PARTS &amp; UNITS
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.purple, fontFamily: 'monospace' }}>
            {summary?.total_items_count || items.length} Parts
          </div>
          <div style={{ fontSize: 11, color: '#6d28d9', fontWeight: 800, marginTop: 4 }}>
            {summary?.total_stock_units || 0} Total Units in Stock
          </div>
        </div>

      </div>

      {/* ── FILTER & SEARCH BAR ──────────────────────────────────────────── */}
      <div style={{
        ...CARD,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 440 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 15, color: C.cyan, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by Part Code (e.g. 407, FLT) or Part Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...INPUT_BASE, paddingLeft: 40, height: 44 }}
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

        {/* Model Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.slate700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Vehicle Model:
          </span>
          <select
            value={selectedModelFilter}
            onChange={(e) => setSelectedModelFilter(e.target.value)}
            style={{ ...INPUT_BASE, height: 44, minWidth: 200, width: 'auto', fontWeight: 700 }}
          >
            <option value="All Models">🌐 All Peugeot Models</option>
            {PEUGEOT_MODELS.map((model, idx) => (
              <option key={idx} value={model}>{model}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh Inventory"
            style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${C.slate200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.slate700 }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── INVENTORY TABLE ──────────────────────────────────────────────── */}
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.slate900, color: C.white }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Part Code</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Name</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicable Model</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Qty</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cost Price (LKR)</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Markup</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selling Price (LKR)</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: C.slate400, fontWeight: 700 }}>
                    Loading Peugeot inventory stock catalog...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: C.slate400, fontWeight: 700 }}>
                    No spare parts found matching your criteria.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const inStock = item.quantity_in_stock > 0;
                  return (
                    <tr 
                      key={item.id || idx}
                      style={{ borderBottom: `1px solid ${C.slate100}`, background: idx % 2 === 0 ? C.white : C.slate50 }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 900, color: C.cyan }}>
                        [{item.item_code}]
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.slate900 }}>
                        {item.item_name}
                      </td>
                      <td style={{ padding: '12px 16px', color: C.slate600, fontWeight: 600 }}>
                        <span style={{ background: C.cyanLight, color: C.cyanDark, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          {item.applicable_model || 'Universal'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                          color: inStock ? C.emerald : C.red,
                          background: inStock ? C.emeraldBg : C.redBg,
                          border: `1px solid ${inStock ? '#6ee7b7' : '#fca5a5'}`
                        }}>
                          {item.quantity_in_stock} {item.unit_of_measure || 'pcs'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: C.slate600 }}>
                        {parseFloat(item.cost_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: C.purple }}>
                        {item.markup_type === 'percentage' ? `+${item.markup_value || 0}%` : `+LKR ${parseFloat(item.markup_value || 0).toFixed(0)}`}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: C.purple, fontSize: 14 }}>
                        {parseFloat(item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '6px 12px', background: C.slate100, border: `1px solid ${C.slate200}`,
                            borderRadius: 8, fontSize: 11, fontWeight: 800, color: C.slate800,
                            cursor: 'pointer', textTransform: 'uppercase'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.slate900; e.currentTarget.style.color = C.white; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = C.slate100; e.currentTarget.style.color = C.slate800; }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD / EDIT INVENTORY MODAL (POPUP DIALOG) ─────────────────────── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          overflowY: 'auto'
        }}>
          <div style={{
            background: C.white,
            borderRadius: 24,
            border: `2px solid ${C.slate200}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            width: '100%',
            maxWidth: 640,
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${C.slate900} 0%, ${C.slate800} 100%)`,
              padding: '20px 26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${C.slate700}`
            }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,168,232,0.2)', border: '1px solid rgba(0,168,232,0.4)',
                  color: C.cyan, padding: '2px 8px', borderRadius: 999,
                  fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4
                }}>
                  <Calculator size={12} /> {editingItemId ? 'Edit Part Details' : 'New Catalog Item'}
                </div>
                <h2 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 18, fontWeight: 900, color: C.white, textTransform: 'uppercase' }}>
                  {editingItemId ? 'Edit Peugeot Spare Part' : 'Add New Peugeot Spare Part'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: C.white, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
              {formError && (
                <div style={{
                  padding: '12px 16px', borderRadius: 12, background: C.redBg,
                  border: '1.5px solid #fca5a5', color: C.red, fontSize: 12, fontWeight: 700,
                  marginBottom: 18, textAlign: 'center'
                }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveItem}>
                
                {/* Part Code & Part Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={LABEL}>Part Item Code <span style={{ color: C.red }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PG-FILT-407"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      style={{ ...INPUT_BASE, fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 800 }}
                    />
                  </div>
                  <div>
                    <label style={LABEL}>Part Item Name <span style={{ color: C.red }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Peugeot 407 Oil Filter"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      style={INPUT_BASE}
                    />
                  </div>
                </div>

                {/* Applicable Model */}
                <div style={{ marginBottom: 16 }}>
                  <label style={LABEL}>Applicable Peugeot Vehicle Model <span style={{ color: C.red }}>*</span></label>
                  <select
                    value={applicableModel}
                    onChange={(e) => setApplicableModel(e.target.value)}
                    style={{ ...INPUT_BASE, fontWeight: 700 }}
                  >
                    {PEUGEOT_MODELS.map((model, idx) => (
                      <option key={idx} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity & Unit of Measure */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={LABEL}>Initial Stock Qty <span style={{ color: C.red }}>*</span></label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={quantityInStock}
                      onChange={(e) => setQuantityInStock(e.target.value)}
                      style={{ ...INPUT_BASE, fontFamily: 'monospace', fontWeight: 900, textAlign: 'center', fontSize: 16 }}
                    />
                  </div>
                  <div>
                    <label style={LABEL}>Unit of Measure</label>
                    <select
                      value={unitOfMeasure}
                      onChange={(e) => setUnitOfMeasure(e.target.value)}
                      style={{ ...INPUT_BASE, fontWeight: 700 }}
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="liters">Liters (L)</option>
                      <option value="sets">Sets (set)</option>
                      <option value="pairs">Pairs (pair)</option>
                      <option value="meters">Meters (m)</option>
                    </select>
                  </div>
                </div>

                {/* Pricing & Markup Box */}
                <div style={{
                  background: C.slate50, border: `1.5px solid ${C.slate200}`,
                  borderRadius: 16, padding: 18, marginBottom: 24
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: C.cyanDark, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 12 }}>
                    <Calculator size={14} /> Pricing &amp; Markup Calculator
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={LABEL}>Cost Rate (LKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 4000.00"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        style={{ ...INPUT_BASE, height: 42, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={LABEL}>Markup Mode</label>
                      <select
                        value={markupType}
                        onChange={(e) => setMarkupType(e.target.value)}
                        style={{ ...INPUT_BASE, height: 42, fontSize: 12, fontWeight: 700 }}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="amount">Fixed LKR</option>
                      </select>
                    </div>

                    <div>
                      <label style={LABEL}>Markup {markupType === 'percentage' ? '(%)' : '(LKR)'}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={markupType === 'percentage' ? 'e.g. 25' : 'e.g. 1000'}
                        value={markupValue}
                        onChange={(e) => setMarkupValue(e.target.value)}
                        style={{ ...INPUT_BASE, height: 42, fontSize: 13, fontWeight: 800, color: C.purple }}
                      />
                    </div>
                  </div>

                  {/* Computed Selling Price */}
                  <div>
                    <label style={LABEL}>Selling Retail Unit Price (LKR) <span style={{ color: C.red }}>*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Calculated automatically..."
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      style={{
                        ...INPUT_BASE,
                        height: 48,
                        background: C.cyanLight,
                        borderColor: '#bae6fd',
                        color: C.cyanDark,
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: 16
                      }}
                    />
                    <span style={{ fontSize: 10, color: C.slate500, marginTop: 4, display: 'block' }}>
                      Auto-calculated from cost &amp; markup. You can also manually fine-tune.
                    </span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      height: 48, padding: '0 24px', background: C.slate100, border: `1.5px solid ${C.slate200}`,
                      color: C.slate700, borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      height: 48, padding: '0 28px',
                      background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.cyanDark} 100%)`,
                      color: C.white, border: 'none', borderRadius: 12,
                      fontSize: 12, fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      boxShadow: '0 4px 14px rgba(0,168,232,0.35)'
                    }}
                  >
                    {submitting ? 'Saving...' : editingItemId ? 'Update Part Details' : 'Save Part to Stock'}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
