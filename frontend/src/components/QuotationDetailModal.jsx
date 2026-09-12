import React, { useState } from 'react';
import { 
  Printer, X, FileText, CheckCircle2, ShieldCheck, Share2, 
  Mail, Phone, MapPin, Calendar, Car, User, Zap, Clock, AlertCircle
} from 'lucide-react';
import logoImg from '../assets/peugeot_land_logo.png';

export default function QuotationDetailModal({ quotation, onClose, onConvertToJob }) {
  const [discount, setDiscount] = useState(0);

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const parseJsonSafe = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const labourItems = parseJsonSafe(quotation.labour_details);
  const partsItems = parseJsonSafe(quotation.parts_details);

  const totalLabour = labourItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalParts = partsItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  const subTotal = (totalLabour + totalParts) > 0 ? (totalLabour + totalParts) : parseFloat(quotation.total_amount || 0);
  const discountVal = parseFloat(discount || 0);
  const finalTotal = Math.max(0, subTotal - discountVal);

  const formattedDate = quotation.created_at
    ? new Date(quotation.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-GB');

  const handleShareWhatsApp = () => {
    const rawPhone = quotation.customer_phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? '94' + cleanPhone.slice(1) : cleanPhone;
    const text = `*PEUGEOT LAND (PVT) LTD*\n*OFFICIAL PRICE ESTIMATE / QUOTATION #${quotation.quotation_number}*\n\nVehicle: ${quotation.vehicle_number} (${quotation.make_model})\nCustomer: ${quotation.customer_name}\nDate: ${formattedDate}\nValidity: 14 Days\n\nTotal Estimated Amount: LKR ${subTotal.toFixed(2)}${discountVal > 0 ? `\nDiscount: - LKR ${discountVal.toFixed(2)}` : ''}\n*Final Amount: LKR ${finalTotal.toFixed(2)}*\n\nGenuine Peugeot Parts & Specialist Repair Services.\nHotline: 0775101292 / 0779980747\nThank you for choosing Peugeot Land!`;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const email = quotation.customer_email || '';
    const subject = `Peugeot Land Official Price Quotation #${quotation.quotation_number}`;
    const body = `PEUGEOT LAND (PVT) LTD\nOFFICIAL PRICE ESTIMATE / QUOTATION #${quotation.quotation_number}\n\nVehicle: ${quotation.vehicle_number} (${quotation.make_model})\nCustomer: ${quotation.customer_name}\nDate: ${formattedDate}\nValidity: 14 Days\n\nTotal Estimated Amount: LKR ${subTotal.toFixed(2)}${discountVal > 0 ? `\nDiscount: - LKR ${discountVal.toFixed(2)}` : ''}\nFinal Amount: LKR ${finalTotal.toFixed(2)}\n\nSpecialist Peugeot Service & Maintenance.\nHotline: 0775101292 / 0779980747\nTHANK YOU !`;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content-box">
        
        {/* ========================================================================= */}
        {/* EXECUTIVE TOP MODAL ACTION BAR (NO PRINT)                                 */}
        {/* ========================================================================= */}
        <div className="modal-header-bar no-print flex flex-col gap-3">
          
          {/* Row 1: Badges + Close Button */}
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-black text-[#00a8e8] bg-sky-50 px-3.5 py-1.5 rounded-lg border border-sky-200">
                QUOTATION #{quotation.quotation_number}
              </span>
              
              <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 border bg-sky-100 text-[#008cc9] border-sky-300">
                <FileText className="w-3.5 h-3.5" />
                PRICE ESTIMATE (VALID 14 DAYS)
              </span>

              <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 border bg-slate-100 text-slate-700 border-slate-300">
                <Clock className="w-3.5 h-3.5" />
                STATUS: {quotation.status || 'DRAFT'}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center font-bold text-lg cursor-pointer transition-all shrink-0 ml-3 border border-slate-300"
              title="Close Modal"
            >
              ✕
            </button>
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap w-full pt-3 border-t border-slate-200">
            <button
              onClick={handlePrint}
              className="flex-1 min-w-[150px] py-2.5 bg-[#00a8e8] hover:bg-[#008cc9] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#00a8e8]/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Quotation
            </button>

            {onConvertToJob && (
              <button
                onClick={() => onConvertToJob(quotation)}
                className="flex-1 min-w-[160px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Convert to Job Card
              </button>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 min-w-[150px] py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-green-600/30 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share via WhatsApp
            </button>

            <button
              onClick={handleShareEmail}
              className="flex-1 min-w-[150px] py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-sky-600/30 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" /> Share via Email
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* OPTIONAL DISCOUNT CONTROLS (NO PRINT)                                     */}
        {/* ========================================================================= */}
        <div className="modal-controls-card no-print bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#00a8e8]" />
            <span>Apply Promotional Discount to Estimate:</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Discount Amount (LKR)..."
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full sm:w-56 bg-white border border-slate-300 text-slate-900 text-xs font-black rounded-xl p-2.5 focus:outline-none focus:border-[#00a8e8]"
            />
            {discountVal > 0 && (
              <span className="font-mono text-xs font-black text-red-600 whitespace-nowrap">
                - LKR {discountVal.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL PEUGEOT LAND (PVT) LTD QUOTATION PAPER DOCUMENT                 */}
        {/* ========================================================================= */}
        <div id="printable-quotation" className="printable-invoice-paper">
          
          {/* Official Peugeot Land Cyan Top Banner Bar */}
          <div className="invoice-top-cyan-banner relative">
            PEUGEOT LAND (PVT) LTD
          </div>

          {/* Header Info, Official Logo Image & Quotation Stamp */}
          <div className="invoice-header-row">
            <div className="invoice-info-text">
              <div><strong>Address</strong> : 1/18, Sri Gnanasena mawatha , Gorakapola, panadura</div>
              <div><strong>Contact</strong> : 0775101292 / 0779980747</div>
              <div><strong>Hotline</strong> : 0775101292 / 0779980747</div>
              <div><strong>Email</strong> : peugeotlandsl@gmail.com</div>
            </div>

            {/* Official Peugeot Land Logo Image & Stamp */}
            <div className="text-right flex flex-col items-end gap-2">
              <img
                src={logoImg}
                alt="PEUGEOT LAND OFFICIAL LOGO"
                className="h-16 w-auto object-contain mix-blend-multiply"
              />

              {/* Official Quotation Badge Stamp */}
              <div className="inline-block px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider border-2 text-center border-sky-600 text-sky-800 bg-sky-50">
                ⚡ PRICE ESTIMATE / QUOTATION
              </div>
            </div>
          </div>

          {/* Document Title */}
          <h2 className="invoice-title">PRICE ESTIMATE / QUOTATION</h2>

          {/* 2-Column Metadata Grid */}
          <div className="invoice-meta-grid">
            <div>
              <div className="invoice-meta-item"><strong>Quotation No</strong> <span>: {quotation.quotation_number}</span></div>
              <div className="invoice-meta-item"><strong>Make / Model</strong> <span>: {quotation.make_model}</span></div>
              <div className="invoice-meta-item"><strong>Vehicle No</strong> <span>: {quotation.vehicle_number}</span></div>
              <div className="invoice-meta-item"><strong>Customer</strong> <span>: {quotation.customer_name} ({quotation.customer_phone})</span></div>
            </div>
            <div>
              <div className="invoice-meta-item"><strong>Date Issued</strong> <span>: {formattedDate}</span></div>
              <div className="invoice-meta-item"><strong>Validity</strong> <span>: 14 Days From Issue Date</span></div>
              <div className="invoice-meta-item"><strong>Mileage</strong> <span>: {quotation.mileage ? `${quotation.mileage.toLocaleString()} Km` : 'N/A'}</span></div>
              <div className="invoice-meta-item">
                <strong>Status</strong> 
                <span>: 
                  <strong className="ml-1 text-sky-700 font-black">
                    OFFICIAL PRICE ESTIMATE
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Customer Requested Fault / Complaint Box */}
          {quotation.repair_description && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', marginBottom: '4px', fontSize: '11px', letterSpacing: '0.5px' }}>
                🔧 Customer Complaint &amp; Requested Scope of Work:
              </div>
              <div style={{ color: '#334155', fontWeight: 600, lineHeight: 1.5 }}>
                {quotation.repair_description}
              </div>
            </div>
          )}

          {/* Main Grid Table - Separating Spare Parts & Labour */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                <th style={{ textAlign: 'left' }}>Description</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Unit Price (LKR)</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Total (LKR)</th>
              </tr>
            </thead>
            <tbody>
              
              {/* ── SECTION A: SPARE PARTS & MATERIALS ── */}
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                <td colSpan={5} style={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', padding: '6px 10px', color: '#0f172a', letterSpacing: '0.5px' }}>
                  📦 A. Estimated Spare Parts &amp; Consumables
                </td>
              </tr>

              {partsItems.length > 0 ? (
                partsItems.map((part, idx) => (
                  <tr key={`part-${idx}`}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ fontFamily: 'monospace', color: '#00a8e8', fontWeight: 800, marginRight: '6px' }}>
                        [{part.item_code || 'PART'}]
                      </span>
                      {part.item_name}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {part.quantity}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {parseFloat(part.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                      {parseFloat(part.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
                  <td colSpan={4} style={{ color: '#64748b', fontStyle: 'italic', fontSize: '11px' }}>
                    No spare parts specified in this estimate
                  </td>
                </tr>
              )}

              {/* Spare Parts Subtotal Row */}
              <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #cbd5e1', borderBottom: '2px solid #0f172a' }}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569' }}>
                  Sub Total — Spare Parts:
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#0f172a' }}>
                  {totalParts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* ── SECTION B: LABOUR & SERVICE CHARGES ── */}
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                <td colSpan={5} style={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', padding: '6px 10px', color: '#0f172a', letterSpacing: '0.5px' }}>
                  🔧 B. Estimated Labour &amp; Mechanical Service Charges
                </td>
              </tr>

              {labourItems.length > 0 ? (
                labourItems.map((lab, idx) => (
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
                  <td style={{ fontWeight: 600 }}>Estimated Diagnostic, Labour &amp; Repair Services</td>
                  <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
                  <td style={{ textAlign: 'right', color: '#94a3b8' }}>-</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                    {totalLabour.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {/* Labour Subtotal Row */}
              <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #cbd5e1', borderBottom: '2px solid #0f172a' }}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569' }}>
                  Sub Total — Labour Charges:
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#0f172a' }}>
                  {totalLabour.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>

            {/* ── ESTIMATE TOTALS & DISCOUNT BREAKDOWN ── */}
            <tfoot>
              {/* Total Row */}
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569' }}>
                  Total Estimated Amount
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#0f172a' }}>
                  {subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Discount Row */}
              {discountVal > 0 && (
                <tr style={{ background: '#ffffff', borderTop: '1px solid #cbd5e1' }}>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#dc2626' }}>
                    Discount / Promotional Offer
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', fontFamily: 'monospace', color: '#dc2626' }}>
                    - {discountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {/* Final Net Amount */}
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a' }}>
                <td colSpan={4} style={{ textAlign: 'center', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '1px' }}>
                  Estimated Grand Total (LKR)
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '17px', color: '#00a8e8', fontFamily: 'monospace' }}>
                  {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Terms & Conditions Box */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '11px',
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: '28px'
          }}>
            <strong style={{ color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Quotation Terms &amp; Conditions:
            </strong>
            <div>• This quotation is an estimate based on initial inspection and remains valid for <strong>14 days</strong> from the date of issue.</div>
            <div>• Genuine Peugeot replacement parts are subject to stock availability at the time of job confirmation.</div>
            <div>• Final invoice price may vary if additional defects or unseen damage are detected during vehicle dismantling.</div>
          </div>

          {/* Dotted Signatures Grid */}
          <div className="invoice-signatures">
            <div>
              <div className="invoice-sig-line"></div>
              <div style={{ fontWeight: 800, fontSize: '12px', color: '#0f172a' }}>Prepared By (Workshop Service Advisor)</div>
            </div>
            <div>
              <div className="invoice-sig-line"></div>
              <div style={{ fontWeight: 800, fontSize: '12px', color: '#0f172a' }}>Customer Acceptance &amp; Authorization Sign</div>
            </div>
          </div>

          {/* Cheque Notice & Thank You Footer */}
          <div className="invoice-footer-notice">
            <div style={{ marginBottom: '6px' }}>
              Please draw all cheques in favour of <strong style={{ color: '#0f172a', textDecoration: 'underline' }}>Peugeot Land (Pvt) Ltd</strong>
            </div>
            <div style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#0f172a' }}>
              THANK YOU FOR CHOOSING PEUGEOT LAND !
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
