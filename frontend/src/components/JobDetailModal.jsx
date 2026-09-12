import React, { useState, useEffect } from 'react';
import {
  Printer, Share2, Mail, CheckCircle, Clock, ShieldCheck,
  Car, CreditCard, Wrench, AlertCircle, Plus, Trash2,
  ArrowRight, FileText, CheckCircle2, ChevronRight, User, Package
} from 'lucide-react';
import {
  getJobCardById, updateJobPayment, releaseJobVehicle,
  updateJobStatus, issueInventoryToJob, getInventoryItems
} from '../services/api';
import logoImg from '../assets/peugeot_land_logo.png';

export default function JobDetailModal({ jobId, initialStage = 'work-stage', onClose, onRefresh }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Workflow Stage: 'work-stage' (Job Card / Work Order) vs 'invoice-stage' (Official Invoice)
  const [stage, setStage] = useState(initialStage);

  const [selectedPayMethod, setSelectedPayMethod] = useState('Cash');
  const [updatingPay, setUpdatingPay] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [discount, setDiscount] = useState(0);

  // Quick Issue Extra Part state
  const [inventoryList, setInventoryList] = useState([]);
  const [showAddPart, setShowAddPart] = useState(false);
  const [selectedAddPartId, setSelectedAddPartId] = useState('');
  const [addPartQty, setAddPartQty] = useState(1);
  const [issuingPart, setIssuingPart] = useState(false);

  const fetchJobDetails = async () => {
    try {
      const res = await getJobCardById(jobId);
      setJob(res.data);
      if (res.data.payment_method) {
        setSelectedPayMethod(res.data.payment_method);
      }
      if (initialStage) {
        setStage(initialStage);
      } else if (res.data.status === 'Completed' || res.data.status === 'Delivered') {
        setStage('invoice-stage');
      } else {
        setStage('work-stage');
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await getInventoryItems();
      setInventoryList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    fetchInventory();
  }, [jobId]);

  const handlePrint = () => {
    window.print();
  };

  // Status progression
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await updateJobStatus(jobId, { status: newStatus });
      setUpdatingStatus(false);
      fetchJobDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      setUpdatingStatus(false);
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Issue Extra Part to Active Job
  const handleIssueExtraPart = async () => {
    if (!selectedAddPartId) return;
    setIssuingPart(true);
    try {
      await issueInventoryToJob(jobId, {
        inventory_item_id: parseInt(selectedAddPartId),
        quantity_issued: parseInt(addPartQty) || 1
      });
      setIssuingPart(false);
      setSelectedAddPartId('');
      setAddPartQty(1);
      setShowAddPart(false);
      fetchJobDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      setIssuingPart(false);
      alert('Error issuing part: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Calculate totals
  const partsTotal = job?.inventory_issues?.reduce((sum, item) => sum + parseFloat(item.total_price), 0) || 0;
  const labourTotal = (job?.parsed_labour_items && job.parsed_labour_items.length > 0)
    ? job.parsed_labour_items.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    : parseFloat(job?.labour_charge || 0);
  const subTotal = partsTotal + labourTotal;
  const discountVal = parseFloat(discount || 0);
  const finalTotal = Math.max(0, subTotal - discountVal);

  const handleShareWhatsApp = () => {
    if (!job) return;
    const rawPhone = job.customer?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? '94' + cleanPhone.slice(1) : cleanPhone;
    const text = `*PEUGEOT LAND (PVT) LTD*\n*OFFICIAL INVOICE #${job.job_number}*\n\nVehicle: ${job.vehicle?.vehicle_number} (${job.vehicle?.make_model})\nCustomer: ${job.customer?.name}\nInvoice Date: ${new Date(job.created_at).toLocaleDateString('en-GB')}\n\nTotal Amount: LKR ${subTotal.toFixed(2)}${discountVal > 0 ? `\nDiscount: - LKR ${discountVal.toFixed(2)}` : ''}\n*Final Amount: LKR ${finalTotal.toFixed(2)}*\n*Payment Status: ${job.payment_status === 'paid' ? `PAID / CASH RECEIVED (${job.payment_method || 'Cash'})` : 'UNPAID / PENDING PAYMENT'}*\n\nPlease draw all cheques in favour of Peugeot Land (Pvt) Ltd.\nThank you for choosing Peugeot Land!`;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    if (!job) return;
    const email = job.customer?.email || '';
    const subject = `Peugeot Land Official Invoice #${job.job_number}`;
    const body = `PEUGEOT LAND (PVT) LTD\nOFFICIAL INVOICE #${job.job_number}\n\nVehicle: ${job.vehicle?.vehicle_number} (${job.vehicle?.make_model})\nCustomer: ${job.customer?.name}\nInvoice Date: ${new Date(job.created_at).toLocaleDateString('en-GB')}\n\nTotal Amount: LKR ${subTotal.toFixed(2)}${discountVal > 0 ? `\nDiscount: - LKR ${discountVal.toFixed(2)}` : ''}\nFinal Amount: LKR ${finalTotal.toFixed(2)}\nPayment Status: ${job.payment_status === 'paid' ? `PAID / CASH RECEIVED (${job.payment_method || 'Cash'})` : 'UNPAID / PENDING PAYMENT'}\n\nPlease draw all cheques in favour of Peugeot Land (Pvt) Ltd.\nTHANK YOU !`;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handleTogglePayment = async (newStatus) => {
    setUpdatingPay(true);
    try {
      await updateJobPayment(jobId, newStatus, selectedPayMethod);
      setUpdatingPay(false);
      fetchJobDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      setUpdatingPay(false);
      alert('Error updating payment status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleToggleRelease = async (releaseState) => {
    setReleasing(true);
    try {
      await releaseJobVehicle(jobId, releaseState);
      setReleasing(false);
      fetchJobDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      setReleasing(false);
      alert('Error updating car release status: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (!jobId) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content-box" style={{ maxWidth: '980px' }}>
        
        {/* ── WORKFLOW STAGE SELECTOR (NO PRINT) ─────────────────────────── */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-2xl mb-5 border-t-4 border-[#00a8e8] border-x border-b border-slate-800 shadow-xl">
          {/* Header Row 1: Vehicle & Job Info + Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="font-mono text-xs font-black text-[#00a8e8] bg-sky-950 px-3 py-1.5 rounded-lg border border-sky-800">
                {job?.job_number}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 900, fontSize: '14px' }}>
                <Car className="w-4 h-4 text-[#00a8e8]" />
                <span>{job?.vehicle?.vehicle_number}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>({job?.vehicle?.make_model})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Close Modal"
            >
              ✕
            </button>
          </div>

          {/* Header Row 2: Workflow Stage Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#020617', padding: '6px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <button
              type="button"
              onClick={() => setStage('work-stage')}
              style={{
                padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease',
                background: stage === 'work-stage' ? '#00a8e8' : 'transparent',
                color: stage === 'work-stage' ? '#ffffff' : '#94a3b8',
                border: 'none',
                boxShadow: stage === 'work-stage' ? '0 4px 14px rgba(0,168,232,0.4)' : 'none'
              }}
            >
              <Wrench className="w-4 h-4" /> Stage 1: Active Work Order
            </button>

            <button
              type="button"
              onClick={() => setStage('invoice-stage')}
              style={{
                padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease',
                background: stage === 'invoice-stage' ? '#059669' : 'transparent',
                color: stage === 'invoice-stage' ? '#ffffff' : '#94a3b8',
                border: 'none',
                boxShadow: stage === 'invoice-stage' ? '0 4px 14px rgba(5,150,105,0.4)' : 'none'
              }}
            >
              <FileText className="w-4 h-4" /> Stage 2: Final Invoice & Settlement
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-bold">
            Loading Job Card Details...
          </div>
        ) : stage === 'work-stage' ? (

          /* ═════════════════════════════════════════════════════════════════ */
          /*  STAGE 1: OPEN JOB CARD & WORK-IN-PROGRESS STAGE                  */
          /* ═════════════════════════════════════════════════════════════════ */
          <div className="space-y-6">

            {/* Top Stage 1 Action Bar */}
            <div className="bg-sky-50 border-2 border-sky-200 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#00a8e8] text-white font-black text-[10px] uppercase tracking-wider mb-1.5">
                  <Wrench className="w-3 h-3" /> Workshop Active Execution Stage
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Job Card #{job.job_number} — Work in Progress
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Technical diagnostic, mechanic operations, and active spare parts allocation.
                </p>
              </div>

              {/* Advance to Invoicing Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4 text-slate-600" /> Print Work Sheet
                </button>

                <button
                  type="button"
                  onClick={() => setStage('invoice-stage')}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Proceed to Invoicing <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Workflow Progress Tracker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                Workshop Job Lifecycle Status
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { status: 'Open', label: '1. Open', color: 'amber' },
                  { status: 'In-Progress', label: '2. In-Progress', color: 'sky' },
                  { status: 'Pending Parts', label: '3. Pending Parts', color: 'purple' },
                  { status: 'Completed', label: '4. Work Completed', color: 'emerald' },
                ].map((st) => (
                  <button
                    key={st.status}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(st.status)}
                    className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider border text-center transition-all cursor-pointer ${
                      job.status === st.status
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-sky-400'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle & Customer Intake Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="text-xs font-black text-[#00a8e8] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Car className="w-4 h-4" /> Vehicle & Intake Specs
                </div>
                <div className="text-sm font-black text-slate-900">{job.vehicle?.vehicle_number}</div>
                <div className="text-xs text-slate-600 font-bold">Model: {job.vehicle?.make_model}</div>
                <div className="text-xs text-slate-600 font-bold">Chassis (VIN): {job.vehicle?.vin_chassis || 'N/A'}</div>
                <div className="text-xs text-slate-600 font-bold">Odometer: {job.mileage ? `${job.mileage.toLocaleString()} KM` : 'N/A'}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4" /> Registered Owner
                </div>
                <div className="text-sm font-black text-slate-900">{job.customer?.name}</div>
                <div className="text-xs text-slate-600 font-bold">Phone: {job.customer?.phone}</div>
                <div className="text-xs text-slate-600 font-bold">Email: {job.customer?.email || 'N/A'}</div>
                <div className="text-xs text-slate-600 font-bold">Address: {job.customer?.address || 'Colombo, Sri Lanka'}</div>
              </div>
            </div>

            {/* Customer Complaint & Diagnostic Checklist */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-3">
                <AlertCircle className="w-4 h-4" /> Reported Faults & Diagnostic Diagnosis
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 font-bold text-sm leading-relaxed">
                {job.repair_fault || 'General scheduled maintenance and safety inspection.'}
              </div>
            </div>

            {/* Assigned Labour Operations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-purple-600" /> Mechanic Labour Operations
                </div>
                <span className="text-xs font-black text-purple-700">
                  Total Labour: LKR {labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2">
                {job.parsed_labour_items && job.parsed_labour_items.length > 0 ? (
                  job.parsed_labour_items.map((l, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-[10px]">
                          {i + 1}
                        </span>
                        <span className="text-slate-800">{l.description}</span>
                      </div>
                      <span className="font-mono font-black text-slate-900">
                        LKR {parseFloat(l.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold flex justify-between">
                    <span>General Mechanical Labour</span>
                    <span>LKR {labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Issued Spare Parts from Inventory */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" /> Issued Spare Parts ({job.inventory_issues?.length || 0})
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowAddPart(!showAddPart)}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Issue Extra Part
                </button>
              </div>

              {/* Add Extra Part Dropdown Box */}
              {showAddPart && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 mb-4 flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">Select Inventory Item</label>
                    <select
                      value={selectedAddPartId}
                      onChange={(e) => setSelectedAddPartId(e.target.value)}
                      className="w-full bg-white border border-amber-300 text-slate-900 text-xs font-bold rounded-xl p-2.5"
                    >
                      <option value="">-- Choose Spare Part from Catalog --</option>
                      {inventoryList.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.item_name} ({item.item_code}) - Stock: {item.quantity_in_stock} - LKR {item.unit_price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-[11px] font-black text-amber-900 uppercase mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={addPartQty}
                      onChange={(e) => setAddPartQty(e.target.value)}
                      className="w-full bg-white border border-amber-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 text-center"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={issuingPart || !selectedAddPartId}
                    onClick={handleIssueExtraPart}
                    className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer shadow-md"
                  >
                    {issuingPart ? 'Issuing...' : '+ Issue Part'}
                  </button>
                </div>
              )}

              {job.inventory_issues && job.inventory_issues.length > 0 ? (
                <div className="space-y-2">
                  {job.inventory_issues.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-black">
                          {p.inventory_item?.item_code || 'PART'}
                        </span>
                        <span className="text-slate-800">{p.inventory_item?.item_name || 'Spare Part'} (Qty: {p.quantity_issued})</span>
                      </div>
                      <span className="font-mono font-black text-slate-900">
                        LKR {parseFloat(p.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="text-right pt-2 font-black text-xs text-amber-800">
                    Parts Total: LKR {partsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs font-bold">
                  No spare parts issued yet for this job.
                </div>
              )}
            </div>

            {/* Bottom Work Order Footer Summary */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Estimated Total Value</div>
                <div className="text-2xl font-black font-mono">
                  LKR {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Parts: LKR {partsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Labour: LKR {labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStage('invoice-stage')}
                className="py-3 px-8 bg-[#00a8e8] hover:bg-[#008cc9] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00a8e8]/40 transition-all"
              >
                Proceed to Invoice & Billing Stage <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        ) : (

          /* ═════════════════════════════════════════════════════════════════ */
          /*  STAGE 2: FINAL OFFICIAL INVOICE & SETTLEMENT STAGE               */
          /* ═════════════════════════════════════════════════════════════════ */
          <div>

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginTop: '20px', marginBottom: '20px', clear: 'both' }} className="no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{ padding: '10px 18px', background: '#00a8e8', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,168,232,0.25)' }}
                >
                  <Printer className="w-4 h-4" /> Print Official Invoice
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  style={{ padding: '10px 18px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(5,150,105,0.25)' }}
                >
                  <Share2 className="w-4 h-4" /> Share via WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleShareEmail}
                  style={{ padding: '10px 18px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2,132,199,0.25)' }}
                >
                  <Mail className="w-4 h-4" /> Share via Email
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStage('work-stage')}
                style={{ padding: '10px 16px', background: '#f1f5f9', color: '#334155', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ← Back to Work Order Stage
              </button>
            </div>

            {/* WORKSHOP MANAGEMENT & CONTROLS BAR (NO PRINT) */}
            <div className="no-print" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', marginBottom: '16px', borderBottom: '1.5px solid #e2e8f0' }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#00a8e8', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck className="w-4 h-4 text-[#00a8e8]" /> Discount & Vehicle Gate Pass Controls
                </div>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', background: '#e2e8f0', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Workshop Management
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                
                {/* Box 1: Professional Discount Control Card */}
                <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      🏷️ Discount Adjustment (LKR)
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900, color: '#dc2626', background: '#fef2f2', padding: '4px 10px', borderRadius: '8px', border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>
                      {discountVal > 0 ? `- LKR ${discountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'LKR 0.00'}
                    </span>
                  </div>

                  {/* Integrated LKR Input Group Box */}
                  <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc' }}>
                    <span style={{ padding: '10px 14px', background: '#e2e8f0', borderRight: '1.5px solid #cbd5e1', fontSize: '12px', fontWeight: 900, color: '#1e293b', fontFamily: 'monospace', userSelect: 'none', display: 'flex', alignItems: 'center', shrink: 0 }}>
                      LKR
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={subTotal}
                      step="100"
                      placeholder="Enter discount amount..."
                      value={discount || ''}
                      onChange={(e) => setDiscount(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', padding: '10px 14px', fontSize: '13px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', border: 'none', outline: 'none' }}
                    />
                    {discountVal > 0 && (
                      <button
                        type="button"
                        onClick={() => setDiscount(0)}
                        style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderLeft: '1.5px solid #cbd5e1', fontSize: '12px', fontWeight: 900, cursor: 'pointer', borderTop: 'none', borderRight: 'none', borderBottom: 'none', whiteSpace: 'nowrap' }}
                        title="Clear discount"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Box 2: Car Release Gate Pass Control Card */}
                <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Car className="w-4 h-4 text-[#00a8e8]" /> Vehicle Gate Pass
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                      background: job.car_released ? '#ecfdf5' : '#fffbeb',
                      color: job.car_released ? '#047857' : '#b45309',
                      border: job.car_released ? '1px solid #a7f3d0' : '1px solid #fde68a'
                    }}>
                      {job.car_released ? 'RELEASE AUTHORIZED' : 'IN WORKSHOP'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: job.car_released ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                      {job.car_released ? 'Vehicle ready for exit' : 'Exit gate lock active'}
                    </div>

                    {job.car_released ? (
                      <span style={{ padding: '8px 14px', background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Released
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleRelease(true)}
                        disabled={releasing}
                        style={{ padding: '10px 18px', background: '#00a8e8', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,168,232,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {releasing ? 'Authorizing...' : 'Authorize Gate Pass'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================================================= */}
            {/* OFFICIAL PEUGEOT LAND (PVT) LTD INVOICE (EXACT PDF FORMAT & LOGO MATCH)  */}
            {/* ========================================================================= */}
            <div id="printable-invoice" className="printable-invoice-paper">
              
              {/* Official Peugeot Land Cyan Top Banner Bar */}
              <div className="invoice-top-cyan-banner relative">
                PEUGEOT LAND (PVT) LTD
              </div>

              {/* Header Info, Official Logo Image & Payment Status Stamp */}
              <div className="invoice-header-row">
                <div className="invoice-info-text">
                  <div><strong>Address</strong> : 1/18, Sri Gnanasena mawatha , Gorakapola, panadura</div>
                  <div><strong>Contact</strong> : 0775101292 / 0779980747</div>
                  <div><strong>Hotline</strong> : 0775101292 / 0779980747</div>
                  <div><strong>Email</strong> : peugeotlandsl@gmail.com</div>
                </div>

                {/* Official Peugeot Land Logo Image & Payment Stamp */}
                <div className="text-right flex flex-col items-end gap-2">
                  <img
                    src={logoImg}
                    alt="PEUGEOT LAND OFFICIAL LOGO"
                    className="h-16 w-auto object-contain mix-blend-multiply"
                  />

                  {/* Payment Status Official Stamp Badge */}
                  <div className={`inline-block px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider border-2 text-center ${
                    job.payment_status === 'paid'
                      ? 'border-emerald-700 text-emerald-800 bg-emerald-50'
                      : 'border-red-600 text-red-700 bg-red-50'
                  }`}>
                    {job.payment_status === 'paid' 
                      ? `✓ PAID - CASH RECEIVED (${job.payment_method || 'Cash'})` 
                      : '⚠ UNPAID / PENDING PAYMENT'}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="invoice-title">INVOICE</h2>

              {/* 2-Column Metadata Grid */}
              <div className="invoice-meta-grid">
                <div>
                  <div className="invoice-meta-item"><strong>Invoice No</strong> <span>: {job.job_number}</span></div>
                  <div className="invoice-meta-item"><strong>Make / Model</strong> <span>: {job.vehicle?.make_model}</span></div>
                  <div className="invoice-meta-item"><strong>Vehicle No</strong> <span>: {job.vehicle?.vehicle_number}</span></div>
                  <div className="invoice-meta-item"><strong>Customer</strong> <span>: {job.customer?.name} ({job.customer?.phone})</span></div>
                </div>
                <div>
                  <div className="invoice-meta-item"><strong>Invoice Date</strong> <span>: {new Date(job.created_at).toLocaleDateString('en-GB')}</span></div>
                  <div className="invoice-meta-item"><strong>Chassis No</strong> <span>: {job.vehicle?.vin_chassis || ''}</span></div>
                  <div className="invoice-meta-item"><strong>Mileage</strong> <span>: {job.mileage?.toLocaleString()} Km</span></div>
                  <div className="invoice-meta-item">
                    <strong>Payment Status</strong> 
                    <span>: 
                      <strong className={`ml-1 ${job.payment_status === 'paid' ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}`}>
                        {job.payment_status === 'paid' 
                          ? `PAID / CASH RECEIVED (${job.payment_method || 'Cash'})` 
                          : 'UNPAID / PENDING PAYMENT'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Grid Invoice Table - Separating Spare Parts & Labour */}
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                    <th style={{ textAlign: 'left' }}>Description</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Unit Price (LKR)</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Total (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ── SECTION A: SPARE PARTS & MATERIALS ── */}
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                    <td colSpan={5} style={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', padding: '6px 10px', color: '#0f172a', letterSpacing: '0.5px' }}>
                      📦 A. Spare Parts & Consumables
                    </td>
                  </tr>

                  {job.inventory_issues && job.inventory_issues.length > 0 ? (
                    job.inventory_issues.map((issue, idx) => (
                      <tr key={`part-${issue.id || idx}`}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ fontFamily: 'monospace', color: '#00a8e8', fontWeight: 800, marginRight: '6px' }}>
                            [{issue.inventory_item?.item_code || 'PART'}]
                          </span>
                          {issue.inventory_item?.item_name || 'Spare Part'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {issue.quantity_issued} {issue.inventory_item?.unit_of_measure !== 'pcs' ? issue.inventory_item?.unit_of_measure : ''}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                          {parseFloat(issue.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                          {parseFloat(issue.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
                      <td colSpan={4} style={{ color: '#64748b', fontStyle: 'italic', fontSize: '11px' }}>
                        No spare parts issued for this job
                      </td>
                    </tr>
                  )}

                  {/* Spare Parts Subtotal Row */}
                  <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #cbd5e1', borderBottom: '2px solid #0f172a' }}>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569' }}>
                      Sub Total — Spare Parts:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#0f172a' }}>
                      {partsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* ── SECTION B: LABOUR & SERVICE CHARGES ── */}
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                    <td colSpan={5} style={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', padding: '6px 10px', color: '#0f172a', letterSpacing: '0.5px' }}>
                      🔧 B. Labour & Service Charges
                    </td>
                  </tr>

                  {job.parsed_labour_items && job.parsed_labour_items.length > 0 ? (
                    job.parsed_labour_items.map((lab, idx) => (
                      <tr key={`labour-${idx}`}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{lab.description}</td>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
                        <td style={{ textAlign: 'right', color: '#94a3b8' }}>-</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                          {parseFloat(lab.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>1</td>
                      <td style={{ fontWeight: 600 }}>Labour Charges & Mechanical Repair Services</td>
                      <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
                      <td style={{ textAlign: 'right', color: '#94a3b8' }}>-</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                        {labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {/* Labour Subtotal Row */}
                  <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #cbd5e1', borderBottom: '2px solid #0f172a' }}>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569' }}>
                      Sub Total — Labour Charges:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#0f172a' }}>
                      {labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>

                {/* ── OFFICIAL INVOICE TOTAL, DISCOUNT & FINAL AMOUNT ── */}
                <tfoot>
                  {/* Total Row */}
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569' }}>
                      Total
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#0f172a' }}>
                      {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Discount Row */}
                  <tr style={{ background: '#ffffff', borderTop: '1px solid #cbd5e1' }}>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#dc2626' }}>
                      Discount
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#dc2626' }}>
                      {discountVal > 0 ? `- ${discountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
                    </td>
                  </tr>

                  {/* Final Net Amount */}
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a' }}>
                    <td colSpan={4} style={{ textAlign: 'center', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '1px' }}>
                      Final Amount
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '16px', color: '#0f172a', fontFamily: 'monospace' }}>
                      {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Dotted Signatures Grid */}
              <div className="invoice-signatures">
                <div>
                  <div className="invoice-sig-line"></div>
                  <div style={{ fontWeight: 700 }}>Approved By</div>
                </div>
                <div>
                  <div className="invoice-sig-line"></div>
                  <div style={{ fontWeight: 700 }}>Customer Signature</div>
                </div>
              </div>

              {/* Cheque Notice & Thank You Footer */}
              <div className="invoice-footer-notice">
                <div style={{ marginBottom: '6px' }}>Please draw all the cheques in favour to <strong style={{ color: '#0f172a', textDecoration: 'underline' }}>Peugeot Land (Pvt) Ltd</strong></div>
                <div style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#0f172a' }}>THANK YOU !</div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
