// Receipt PDF Generator — client-side using html2pdf.js

export interface ReceiptLineItem {
  name: string
  quantity: number
  rate: number
  amount: number
}

export interface ReceiptData {
  clinic: {
    name: string
    address?: string
    phone?: string
  }
  receipt_number: string
  payment_date: string          // ISO string — date payment was made

  patient: {
    name: string
    phone?: string
    patient_code?: string       // UID
    age?: number
    gender?: string
  }

  // Show visit/appointment date for CHARGED, CATALOG, MANUAL billing
  appointment_date?: string
  therapist_name?: string    // treating physiotherapist

  // Service line items — for CHARGED/CATALOG/MANUAL visit billing
  line_items?: ReceiptLineItem[]

  // Single-line description — for OUTSTANDING, ADVANCE, VISIT clearance
  description?: string

  // Session pack details — for pack purchase receipts
  pack_details?: {
    total_sessions: number
    per_session_rate: number
    sessions_used?: number
    sessions_remaining?: number
    valid_until?: string
  }

  subtotal: number
  discount_amount?: number
  discount_reason?: string
  total_amount: number
  amount_paid: number
  balance_due: number

  payment_method: string
  transaction_ref?: string
}

// ─── Utilities ───────────────────────────────────────────────────────────────

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function numToWords(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ONES[n % 10] : '')
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numToWords(n % 100) : '')
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '')
  if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '')
  return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '')
}

export function amountToWords(amount: number): string {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  let result = 'Rupees ' + (rupees === 0 ? 'Zero' : numToWords(rupees))
  if (paise > 0) result += ' and ' + numToWords(paise) + ' Paise'
  return result + ' Only'
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function formatTime(dateStr: string): string | null {
  try {
    const d = new Date(dateStr)
    // Don't show time if midnight (likely date-only field)
    if (d.getHours() === 0 && d.getMinutes() === 0) return null
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch { return null }
}

function formatMethod(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Cash', UPI: 'UPI', CARD: 'Card',
    BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque', OTHER: 'Other',
  }
  return labels[method] ?? method
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

function formatGender(g: string): string {
  const map: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other', M: 'Male', F: 'Female' }
  return map[g?.toUpperCase()] ?? g ?? '—'
}

// ─── HTML Generator ──────────────────────────────────────────────────────────

export function generateReceiptHTML(data: ReceiptData): string {
  const hasLineItems = data.line_items && data.line_items.length > 0
  const hasDiscount  = !!data.discount_amount && data.discount_amount > 0
  const isPartial    = data.balance_due > 0
  const hasPack      = !!data.pack_details

  // ── Patient row HTML ──
  const patientHTML = `
    <div class="patient-section">
      <div class="patient-grid">
        <div class="pfield">
          <div class="flabel">Patient Name</div>
          <div class="fvalue">${data.patient.name}</div>
        </div>
        <div class="pfield">
          <div class="flabel">Patient ID (UID)</div>
          <div class="fvalue">${data.patient.patient_code || '—'}</div>
        </div>
        ${(data.patient.age != null || data.patient.gender) ? `
        <div class="pfield">
          <div class="flabel">Age</div>
          <div class="fvalue">${data.patient.age != null ? data.patient.age + ' yrs' : '—'}</div>
        </div>
        <div class="pfield">
          <div class="flabel">Gender</div>
          <div class="fvalue">${data.patient.gender ? formatGender(data.patient.gender) : '—'}</div>
        </div>` : ''}
      </div>
    </div>`

  // ── Appointment section (only for visit billing) ──
  const apptTime = data.appointment_date ? formatTime(data.appointment_date) : null
  const appointmentHTML = (data.appointment_date || data.therapist_name) ? `
    <div class="appt-section">
      <div class="appt-label">Appointment Details</div>
      <div class="appt-grid">
        ${data.appointment_date ? `
        <div class="appt-item">
          <span class="flabel">Date of Service</span>
          <span class="appt-val">${formatDate(data.appointment_date)}${apptTime ? ', ' + apptTime : ''}</span>
        </div>` : ''}
        ${data.therapist_name ? `
        <div class="appt-item">
          <span class="flabel">Consultant</span>
          <span class="appt-val">${data.therapist_name}</span>
        </div>` : ''}
      </div>
    </div>` : ''

  // ── Services / description section ──
  let servicesHTML = ''
  if (hasLineItems) {
    servicesHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Description / Service</th>
              <th class="th-num">Qty</th>
              <th class="th-num">Rate</th>
              <th class="th-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.line_items!.map(item => `
              <tr>
                <td class="td-desc">${item.name}</td>
                <td class="td-num">${item.quantity}</td>
                <td class="td-num">${formatINR(item.rate)}</td>
                <td class="td-num">${formatINR(item.amount)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`
  } else if (data.description) {
    servicesHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="th-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-desc">${data.description}</td>
              <td class="td-num">${formatINR(data.subtotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>`
  }

  // ── Pack details box ──
  const packHTML = hasPack ? `
    <div class="pack-box">
      <div class="pack-title">Session Pack Details</div>
      <div class="pack-grid">
        <div class="pack-item">
          <div class="flabel">Total Sessions</div>
          <div class="pack-val">${data.pack_details!.total_sessions} sessions</div>
        </div>
        <div class="pack-item">
          <div class="flabel">Per Session Rate</div>
          <div class="pack-val">${formatINR(data.pack_details!.per_session_rate)}</div>
        </div>
        ${data.pack_details!.sessions_used != null ? `
        <div class="pack-item">
          <div class="flabel">Sessions Used</div>
          <div class="pack-val">${data.pack_details!.sessions_used}</div>
        </div>` : ''}
        ${data.pack_details!.sessions_remaining != null ? `
        <div class="pack-item">
          <div class="flabel">Sessions Remaining</div>
          <div class="pack-val" style="color:#0d9488;font-weight:700;">${data.pack_details!.sessions_remaining}</div>
        </div>` : ''}
        ${data.pack_details!.valid_until ? `
        <div class="pack-item">
          <div class="flabel">Valid Until</div>
          <div class="pack-val">${formatDate(data.pack_details!.valid_until)}</div>
        </div>` : ''}
      </div>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Receipt – ${data.receipt_number}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:12.5px;color:#1a1a1a;
         background:#fff;max-width:700px;margin:0 auto;padding:0;}

    /* ── Outer wrapper ── */
    .page{padding:32px 36px;width:794px;box-sizing:border-box;}

    /* ── Header band ── */
    .header{display:flex;justify-content:space-between;align-items:flex-start;
            padding-bottom:16px;margin-bottom:0;}
    .clinic-name{font-size:21px;font-weight:800;color:#0d9488;letter-spacing:-0.3px;
                 margin-bottom:3px;}
    .clinic-sub{font-size:10.5px;color:#9ca3af;line-height:1.8;}
    .receipt-block{text-align:right;}
    .receipt-title{font-size:17px;font-weight:800;letter-spacing:2px;
                   color:#111827;text-transform:uppercase;margin-bottom:7px;}
    .receipt-no{font-size:11.5px;color:#374151;margin-bottom:2px;}
    .receipt-no strong{color:#0d9488;font-size:12px;}
    .receipt-date{font-size:11px;color:#6b7280;}

    /* ── Teal rule ── */
    .rule{height:2.5px;background:linear-gradient(to right,#0d9488,#5eead4);
          margin:14px 0 20px;}

    /* ── Bill To ── */
    .bill-to-label{font-size:9.5px;font-weight:700;color:#0d9488;text-transform:uppercase;
                   letter-spacing:.1em;margin-bottom:6px;}
    .patient-box{border:1px solid #e5e7eb;border-radius:5px;overflow:hidden;
                 margin-bottom:14px;}
    .patient-grid{display:grid;grid-template-columns:1fr 1fr;}
    .pfield{padding:10px 14px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;}
    .pfield:nth-child(even){border-right:none;}
    .pfield:last-child,.pfield:nth-last-child(2):nth-child(odd){border-bottom:none;}
    .flabel{font-size:9px;color:#9ca3af;text-transform:uppercase;
            letter-spacing:.08em;margin-bottom:3px;}
    .fvalue{font-size:13px;font-weight:700;color:#111827;}

    /* ── Appointment details ── */
    .appt-section{background:#f0fdf9;border:1px solid #ccfbf1;border-radius:5px;
                  padding:9px 14px;margin-bottom:14px;display:flex;gap:36px;
                  flex-wrap:wrap;align-items:flex-start;}
    .appt-item{display:flex;flex-direction:column;gap:2px;}
    .appt-val{font-size:12.5px;font-weight:600;color:#0f766e;}

    /* ── Services table ── */
    .table-wrap{margin-bottom:4px;}
    table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;}
    thead tr{background:#0d9488;}
    thead th{font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;
             letter-spacing:.06em;padding:8px 12px;text-align:left;}
    th.th-num,td.td-num{text-align:right;}
    tbody tr{background:#fff;}
    tbody tr:nth-child(even){background:#f9fafb;}
    .td-desc{padding:9px 12px;color:#374151;font-size:12.5px;
             border-bottom:1px solid #f0f0f0;}
    .td-num{padding:9px 12px;color:#374151;font-size:12.5px;
            border-bottom:1px solid #f0f0f0;white-space:nowrap;}

    /* ── Pack box ── */
    .pack-box{background:#f0fdfa;border:1px solid #99f6e4;border-radius:5px;
              padding:10px 14px;margin-bottom:6px;}
    .pack-title{font-size:9.5px;font-weight:700;color:#0d9488;text-transform:uppercase;
                letter-spacing:.08em;margin-bottom:8px;}
    .pack-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;}
    .pack-item{}
    .pack-val{font-size:12.5px;font-weight:600;color:#111827;margin-top:2px;}

    /* ── Totals layout ── */
    .totals-outer{display:flex;justify-content:flex-end;margin:14px 0 16px;}
    .totals-box{width:275px;border:1px solid #e5e7eb;border-radius:5px;overflow:hidden;}
    .t-row{display:flex;justify-content:space-between;align-items:center;
           padding:7px 14px;font-size:12px;color:#374151;
           border-bottom:1px solid #f0f0f0;}
    .t-row:last-child{border-bottom:none;}
    .t-row.subtotal{background:#f9fafb;font-size:11.5px;color:#6b7280;}
    .t-row.discount{color:#059669;background:#f0fdf4;}
    .t-row.grand{background:#f3f4f6;font-size:14px;font-weight:800;color:#111827;
                 border-top:2px solid #e5e7eb;}
    .t-row.paid-row{background:#0d9488;color:#fff;font-size:13px;font-weight:700;}
    .t-row.balance-row{font-size:12px;color:${isPartial ? '#dc2626' : '#6b7280'};
                       font-weight:${isPartial ? '700' : '400'};}

    /* ── PAID stamp ── */
    .paid-wrap{display:flex;justify-content:flex-end;margin-bottom:14px;}
    .paid-stamp{border:2px solid #059669;color:#059669;font-size:11px;font-weight:800;
                letter-spacing:3px;padding:3px 14px;border-radius:3px;
                text-transform:uppercase;transform:rotate(-2deg);display:inline-block;}

    /* ── Outstanding banner ── */
    .balance-banner{background:#fef2f2;border:1px solid #fecaca;border-radius:5px;
                    padding:9px 14px;margin-bottom:14px;font-size:12px;
                    color:#dc2626;display:flex;justify-content:space-between;align-items:center;}
    .balance-banner strong{font-size:14px;}

    /* ── Words + payment method ── */
    .words-box{background:#fafafa;border-left:3px solid #0d9488;padding:8px 12px;
               margin-bottom:12px;font-size:12px;color:#374151;font-style:italic;}
    .words-label{font-size:9px;color:#9ca3af;text-transform:uppercase;
                 letter-spacing:.07em;margin-bottom:3px;font-style:normal;}
    .pay-meta{display:flex;gap:32px;margin-bottom:20px;}
    .pay-meta .pi{}
    .pay-meta .flabel{margin-bottom:3px;}
    .pay-meta .pval{font-size:13px;font-weight:700;color:#111827;}

    /* ── Footer ── */
    .footer-rule{border-top:1px solid #e5e7eb;margin-bottom:10px;margin-top:4px;}
    .esign-note{font-size:9.5px;color:#9ca3af;margin-bottom:28px;line-height:1.7;}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;}
    .sig-box{padding-top:36px;border-top:1px solid #9ca3af;text-align:center;}
    .sig-label{font-size:11px;color:#6b7280;}

    @media print{body{padding:0;}.page{border:none;padding:28px 32px;}.no-print{display:none;}}
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="clinic-name">${data.clinic.name}</div>
      <div class="clinic-sub">
        ${data.clinic.address ? data.clinic.address + '<br>' : ''}
        ${data.clinic.phone ? 'Ph: ' + data.clinic.phone : ''}
      </div>
    </div>
    <div class="receipt-block">
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-no">Receipt No: <strong>${data.receipt_number}</strong></div>
      <div class="receipt-date">Date: ${formatDate(data.payment_date)}</div>
    </div>
  </div>

  <div class="rule"></div>

  <!-- Bill To -->
  <div class="bill-to-label">Bill To</div>
  ${patientHTML}

  <!-- Appointment details (visit billing only) -->
  ${appointmentHTML}

  <!-- Services / Description -->
  ${servicesHTML}

  <!-- Pack details -->
  ${packHTML}

  <!-- Totals box -->
  <div class="totals-outer">
    <div class="totals-box">
      <div class="t-row subtotal">
        <span>Subtotal</span><span>${formatINR(data.subtotal)}</span>
      </div>
      ${hasDiscount ? `
      <div class="t-row discount">
        <span>Discount${data.discount_reason ? ' — ' + data.discount_reason : ''}</span>
        <span>− ${formatINR(data.discount_amount!)}</span>
      </div>` : ''}
      <div class="t-row grand">
        <span>Total</span><span>${formatINR(data.total_amount)}</span>
      </div>
      <div class="t-row paid-row">
        <span>Amount Paid</span><span>${formatINR(data.amount_paid)}</span>
      </div>
      <div class="t-row balance-row">
        <span>Balance Due</span><span>${formatINR(data.balance_due)}</span>
      </div>
    </div>
  </div>

  <!-- PAID stamp (full payment only) -->
  ${!isPartial ? `<div class="paid-wrap"><div class="paid-stamp">✓ Paid in Full</div></div>` : ''}

  <!-- Outstanding banner -->
  ${isPartial ? `
  <div class="balance-banner">
    <span>Outstanding balance remaining on this bill</span>
    <strong>${formatINR(data.balance_due)}</strong>
  </div>` : ''}

  <!-- Amount in words -->
  <div class="words-box">
    <div class="words-label">Amount Paid in Words</div>
    <div>${amountToWords(data.amount_paid)}</div>
  </div>

  <!-- Payment method + transaction ref -->
  <div class="pay-meta">
    <div class="pi">
      <div class="flabel">Mode of Payment</div>
      <div class="pval">${formatMethod(data.payment_method)}</div>
    </div>
    ${data.transaction_ref ? `
    <div class="pi">
      <div class="flabel">Transaction Ref / ID</div>
      <div class="pval" style="font-family:monospace;">${data.transaction_ref}</div>
    </div>` : ''}
  </div>

  <!-- Footer -->
  <div class="footer-rule"></div>
  <div class="esign-note">
    This is a computer-generated receipt and is valid without a physical signature.
    Please retain this receipt for your records.
  </div>
  <div class="signatures">
    <div class="sig-box"><div class="sig-label">Recipient Signature</div></div>
    <div class="sig-box"><div class="sig-label">Authorised Signatory</div></div>
  </div>

</div>
</body>
</html>`
}

// ─── Download PDF ─────────────────────────────────────────────────────────────

export async function downloadReceiptPDF(data: ReceiptData): Promise<void> {
  // Inject the receipt into a hidden off-screen container so html2canvas can
  // measure real dimensions. The full HTML string (with <style> tags) is parsed
  // by the browser and the styles are temporarily active while we capture.
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;top:-9999px;left:0;width:794px;pointer-events:none;z-index:-9999;'
  container.innerHTML = generateReceiptHTML(data)
  document.body.appendChild(container)

  try {
    const html2pdf = (await import('html2pdf.js')).default

    // Target the .page wrapper so we get exactly the receipt content
    const el: HTMLElement = container.querySelector('.page') ?? container

    // Brief settle for any font/style resolution
    await new Promise(r => setTimeout(r, 150))

    await html2pdf().set({
      margin: 0,
      filename: `Receipt_${data.receipt_number}_${data.patient.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        width: 794,
        windowWidth: 794,
      },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait', compress: true },
    }).from(el).save()
  } catch (err) {
    console.error('Receipt PDF failed:', err)
    printReceipt(data)
  } finally {
    document.body.removeChild(container)
  }
}

// ─── Print ────────────────────────────────────────────────────────────────────

export function printReceipt(data: ReceiptData): void {
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(generateReceiptHTML(data))
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }
}
