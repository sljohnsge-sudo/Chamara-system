import React, { useState } from 'react';
import {
  CreditCard, CheckCircle2, X, Banknote, Landmark,
  FileCheck2, User, Car, ShieldCheck, ArrowRight
} from 'lucide-react';
import { updateJobPayment } from '../services/api';

export default function PaymentConfirmModal({ job, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  
  const partsTotal = job?.inventory_issues?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) || 0;
  const labourTotal = parseFloat(job?.labour_charge || 0);
  const grandTotal = partsTotal + labourTotal;

  const [amountReceived, setAmountReceived] = useState(grandTotal.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateJobPayment(job.id, 'paid', paymentMethod);
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError('Failed to record payment: ' + (err.response?.data?.detail || err.message));
    }
  };

  const paymentMethods = [
    { id: 'Cash', label: 'Cash Payment', icon: Banknote, desc: 'Direct physical cash' },
    { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'POS card terminal' },
    { id: 'Online Bank Transfer', label: 'Bank Transfer', icon: Landmark, desc: 'Online deposit / EFT' },
    { id: 'Cheque', label: 'Cheque Payment', icon: FileCheck2, desc: 'Company / Bank cheque' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'Outfit, sans-serif'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          maxWidth: 540,
          width: '100%',
          padding: '28px 32px',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #a7f3d0',
                boxShadow: '0 4px 12px rgba(5,150,105,0.12)'
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', fontFamily: '"Space Grotesk", Outfit, sans-serif' }}>
                  Record Payment Settlement
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#0284c7',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid #bae6fd'
                  }}
                >
                  #{job.job_number}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                Confirm and close out the invoice for this vehicle
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 10,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderRadius: 12,
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Customer & Vehicle Info Pill Grid */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 16,
              padding: '14px 18px',
              border: '1.5px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>
                Customer
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={13} color="#00a8e8" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.customer?.name || 'Customer'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginLeft: 19 }}>
                {job.customer?.phone || 'No phone'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>
                Vehicle
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#00a8e8', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
                <Car size={13} color="#00a8e8" />
                <span>{job.vehicle?.vehicle_number || 'PEUGEOT'}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginLeft: 19 }}>
                {job.vehicle?.make_model || 'Peugeot'}
              </div>
            </div>
          </div>

          {/* Invoice Total Highlight Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: 16,
              padding: '16px 20px',
              border: '1.5px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Total Invoice Balance
              </div>
              <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                Parts: LKR {partsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Labour: LKR {labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: '#15803d', fontFamily: '"Space Grotesk", Outfit, sans-serif' }}>
              LKR {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              Select Payment Method *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {paymentMethods.map((m) => {
                const isSelected = paymentMethod === m.id;
                const Icon = m.icon;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      border: isSelected ? '2px solid #059669' : '1.5px solid #e2e8f0',
                      borderRadius: 14,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 12px rgba(5,150,105,0.15)' : 'none'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: isSelected ? '#059669' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: isSelected ? '#065f46' : '#1e293b' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 10, color: isSelected ? '#047857' : '#94a3b8' }}>
                        {m.desc}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="#059669" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Received Input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              Amount Received (LKR) *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 16, fontSize: 14, fontWeight: 900, color: '#059669' }}>
                LKR
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                style={{
                  width: '100%',
                  height: 48,
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 12,
                  paddingLeft: 56,
                  paddingRight: 16,
                  fontSize: 16,
                  fontWeight: 900,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: '"Space Grotesk", Outfit, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '13px 18px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '13px 22px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                border: 'none',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 900,
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
                transition: 'all 0.2s'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Recording...' : 'Confirm & Settle Payment'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
