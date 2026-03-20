'use client';

// DEV ONLY — Receipt design preview page
// Visit: /dashboard/billing/receipt-preview
// Delete this file before production deployment

import React, { useState } from 'react';
import { generateReceiptHTML, downloadReceiptPDF, printReceipt } from '@/lib/utils/receipt-pdf';
import type { ReceiptData } from '@/lib/utils/receipt-pdf';

const SAMPLE_VISIT: ReceiptData = {
  clinic: {
    name: 'HealUI Physiotherapy Clinic',
    address: '12, Wellness Plaza, Bandra West, Mumbai – 400050',
    phone: '+91 98765 43210',
  },
  receipt_number: 'RX-2526-0042',
  payment_date: new Date().toISOString(),
  patient: {
    name: 'Rahul Sharma',
    phone: '9876543210',
    patient_code: 'PT-0099',
  },
  line_items: [
    { name: 'Physiotherapy Session – Knee Rehabilitation', quantity: 1, rate: 800, amount: 800 },
    { name: 'Electrotherapy Add-on', quantity: 1, rate: 200, amount: 200 },
  ],
  subtotal: 1000,
  discount_amount: 100,
  discount_reason: 'Staff discount',
  total_amount: 900,
  amount_paid: 900,
  balance_due: 0,
  payment_method: 'UPI',
  transaction_ref: 'UPI4892736510',
};

const SAMPLE_PARTIAL: ReceiptData = {
  ...SAMPLE_VISIT,
  receipt_number: 'RX-2526-0043',
  amount_paid: 500,
  balance_due: 400,
  payment_method: 'CASH',
  transaction_ref: undefined,
  discount_amount: undefined,
  discount_reason: undefined,
  subtotal: 900,
  total_amount: 900,
};

const SAMPLE_PACK: ReceiptData = {
  clinic: SAMPLE_VISIT.clinic,
  receipt_number: 'PKT-A3F9C1',
  payment_date: new Date().toISOString(),
  patient: SAMPLE_VISIT.patient,
  line_items: [
    { name: '10-Session Physiotherapy Pack', quantity: 1, rate: 5000, amount: 5000 },
  ],
  pack_details: {
    total_sessions: 10,
    per_session_rate: 500,
    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  subtotal: 5000,
  total_amount: 5000,
  amount_paid: 3000,
  balance_due: 2000,
  payment_method: 'CARD',
  transaction_ref: '4242',
};

const SAMPLE_OUTSTANDING: ReceiptData = {
  clinic: SAMPLE_VISIT.clinic,
  receipt_number: 'RX-2526-0044',
  payment_date: new Date().toISOString(),
  patient: SAMPLE_VISIT.patient,
  description: 'Payment towards outstanding dues',
  subtotal: 300,
  total_amount: 300,
  amount_paid: 300,
  balance_due: 0,
  payment_method: 'CASH',
};

const SAMPLES = [
  { label: 'Full Payment (Visit)', data: SAMPLE_VISIT },
  { label: 'Partial Payment', data: SAMPLE_PARTIAL },
  { label: 'Pack Purchase', data: SAMPLE_PACK },
  { label: 'Outstanding Clearance', data: SAMPLE_OUTSTANDING },
];

export default function ReceiptPreviewPage() {
  const [selected, setSelected] = useState(0);
  const data = SAMPLES[selected].data;
  const html = generateReceiptHTML(data);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt Preview</span>
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">DEV ONLY</span>
          <div className="flex gap-1.5">
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selected === i
                    ? 'bg-brand-teal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => printReceipt(data)}
            className="px-3 py-1.5 text-xs text-gray-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Print
          </button>
          <button
            onClick={() => downloadReceiptPDF(data)}
            className="px-3 py-1.5 text-xs text-white bg-brand-teal rounded hover:bg-teal-700 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Receipt iframe preview */}
      <div className="flex justify-center py-8 px-4">
        <div className="w-full max-w-3xl shadow-lg rounded overflow-hidden bg-white">
          <iframe
            srcDoc={html}
            className="w-full"
            style={{ height: '900px', border: 'none' }}
            title="Receipt Preview"
          />
        </div>
      </div>
    </div>
  );
}
