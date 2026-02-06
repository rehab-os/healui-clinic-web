# HealUI Indian Market Billing - Implementation Plan

**Date:** February 5, 2026
**Focus:** India-first billing system that covers 95% of Indian physio clinics

---

## Current State Assessment

### Already Built (Backend + Frontend)

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Per-session billing (CHARGED) | Entity + Service + API | BillVisitModal | Working |
| Session pack create/track/deduct | Entity + Service + API | CreateSessionPackModal | Working |
| Payment recording (Cash/UPI/Card/Bank/Cheque) | Entity + Service + API | RecordPaymentModal | Working |
| Outstanding/Udhaari tracking | PatientAccount + API | OutstandingList + Billing page | Working |
| Advance payment tracking | PatientAccount + API | PatientBillingPanel | Working |
| Complimentary visits | VisitBilling entity | BillVisitModal | Working |
| Invoice generation with GST | Invoice + LineItem entities + API | Types only | Backend only |
| Daily summary report | API endpoint | Billing page cards | Working |
| Outstanding report | API endpoint | Billing page section | Working |
| Collection report | API endpoint | Not built | Backend only |
| Patient billing panel | N/A | PatientBillingPanel component | Working |
| Dashboard widgets | N/A | OutstandingList, SessionsEndingSoon | Working |

### What's Missing for Indian Market

| Priority | Feature | Why It Matters |
|----------|---------|----------------|
| P0 | Service Catalog (clinic-level pricing) | Clinics need to define their services and rates once |
| P0 | Clinic Billing Settings | Configure GST, default rates, enabled billing models |
| P1 | Session Pack Templates | Quick pack creation from pre-defined templates |
| P1 | Invoice Management Page | View, finalize, print, download invoices |
| P1 | Visit billing integrated into visit flow | Bill during visit completion, not separately |
| P2 | Reports Page | Collection reports, revenue analytics |
| P2 | Per-modality add-on pricing | Different charges for IFT, US, TENS, etc. |
| P2 | Home visit premium pricing | Auto-apply premium for home visits |
| P3 | Discount/Coupon system | Referral discounts, festival offers |
| P3 | Payment reminders (WhatsApp/SMS) | Automated outstanding reminders |
| P3 | Receipt/Invoice PDF generation | Print-ready receipts for patients |

---

## Indian Physio Clinic Billing Patterns

Understanding how Indian physios actually work:

### Pattern 1: Solo Practitioner (60% of market)
```
- Fixed per-session rate: INR 500-1,500
- Cash/UPI only
- No GST (below threshold)
- Maybe session packs for regulars
- Tracks udhaari in notebook
- Needs: Simple billing, session packs, outstanding tracking
```

### Pattern 2: Multi-Physio Clinic (30% of market)
```
- Different rates by service type (Ortho vs Neuro vs Sports)
- Multiple payment methods
- GST registered (above INR 20L threshold)
- Session packs with expiry
- Some corporate tie-ups
- Needs: Service catalog, GST invoicing, session packs, reports
```

### Pattern 3: Premium/Chain Clinic (10% of market)
```
- Modality-based pricing (IFT + US + Exercise = total)
- Home visit services at premium
- Corporate wellness contracts
- Insurance (post-surgery rehab)
- Needs: Full modality pricing, corporate billing, home visit rates
```

---

## Implementation Plan

### Phase 1: Service Catalog + Clinic Settings
*The foundation - clinics define what they charge*

#### 1A. Backend: Service Catalog Entity

```
service_catalog
├── id (uuid)
├── clinic_id (FK)
├── service_name (string) - "Physiotherapy Session", "IFT", "Ultrasound"
├── service_code (string, unique per clinic) - "PT-SESSION", "IFT", "US"
├── category (enum) - CONSULTATION | MODALITY | PACKAGE | HOME_VISIT | OTHER
├── description (string, optional)
├── base_price (decimal) - INR 800
├── duration_minutes (int, optional) - 45
├── is_addon (boolean) - false for main session, true for add-on modalities
├── hsn_sac_code (string, optional) - "999312" (physio SAC code)
├── gst_applicable (boolean) - true/false
├── display_order (int) - for UI ordering
├── is_active (boolean)
├── created_at, updated_at
└── metadata (jsonb) - future extensibility
```

**Key design decisions:**
- `is_addon` distinguishes between "base session" and "add-on modalities"
- A visit = 1 base service + 0-N add-on modalities
- Solo clinics might have just 1 service ("Physiotherapy Session" at INR 800)
- Multi-physio clinics have 5-10 services with add-ons
- `hsn_sac_code` for GST compliance (SAC 999312 = Physiotherapy services)

#### 1B. Backend: Clinic Billing Settings

Add to existing clinic entity (or new `clinic_settings` table):

```
clinic_billing_settings (jsonb on clinic OR separate entity)
├── billing_enabled (boolean) - master toggle
├── default_session_rate (decimal) - quick billing without catalog
├── gst_registered (boolean)
├── gstin (string) - GST number
├── gst_rate (decimal) - 18% standard for healthcare services
├── pan_number (string)
├── currency (string) - "INR" (default)
├── payment_methods_enabled (string[]) - ["CASH", "UPI", "CARD"]
├── session_packs_enabled (boolean) - true
├── modality_pricing_enabled (boolean) - false by default
├── home_visit_enabled (boolean)
├── home_visit_premium_percent (decimal) - 30-40%
├── auto_bill_on_visit_complete (boolean) - prompt to bill when visit ends
├── receipt_prefix (string) - "RCP"
├── invoice_prefix (string) - "INV"
├── billing_address (jsonb) - clinic's address for invoices
└── terms_and_conditions (string) - printed on invoices
```

**Smart defaults for Indian clinics:**
- `gst_registered: false` (most solo practices are below threshold)
- `payment_methods_enabled: ["CASH", "UPI"]` (most common in India)
- `session_packs_enabled: true`
- `modality_pricing_enabled: false` (keep it simple by default)
- `auto_bill_on_visit_complete: true`

#### 1C. Backend: Session Pack Templates

```
session_pack_template
├── id (uuid)
├── clinic_id (FK)
├── name (string) - "5 Session Pack", "10 Session Pack"
├── total_sessions (int) - 5, 10, 15, 20
├── amount (decimal) - INR 3,500
├── per_session_rate (decimal) - auto-calculated: INR 700
├── discount_percent (decimal) - compared to single session rate
├── validity_days (int, optional) - 90 days
├── description (string, optional)
├── is_popular (boolean) - highlight in UI
├── display_order (int)
├── is_active (boolean)
├── created_at, updated_at
```

**Why templates matter:**
- Physio doesn't have to type "5 sessions, INR 3500" every time
- One-click pack creation from template
- Easy to show patients available options
- Can mark popular packs

#### 1D. Frontend: Clinic Settings Page

**Route:** `/dashboard/settings/billing`

```
Billing Settings Page
├── Header: "Billing Configuration"
│
├── Section 1: Basic Setup
│   ├── Toggle: Enable Billing (master switch)
│   ├── Default Session Rate: [INR input]
│   └── Payment Methods: [Checkboxes: Cash, UPI, Card, Bank Transfer, Cheque]
│
├── Section 2: GST Configuration
│   ├── Toggle: GST Registered
│   ├── GSTIN: [Input] (shown only if GST enabled)
│   ├── GST Rate: [Dropdown: 5%, 12%, 18%] (default 18%)
│   ├── PAN: [Input]
│   └── HSN/SAC Code: [Input] (pre-filled: 999312)
│
├── Section 3: Features
│   ├── Toggle: Session Packs
│   ├── Toggle: Modality/Add-on Pricing
│   ├── Toggle: Home Visit Premium
│   │   └── Premium %: [Input] (shown if enabled)
│   └── Toggle: Auto-bill on Visit Complete
│
├── Section 4: Invoice Settings
│   ├── Receipt Prefix: [Input] (default: RCP)
│   ├── Invoice Prefix: [Input] (default: INV)
│   ├── Clinic Billing Address: [Auto-filled from clinic address]
│   └── Terms & Conditions: [Textarea]
│
└── Save Button
```

**Design:** Follow the established minimalist pattern - white bg, gray-50 cards, font-light headings, borderless inputs with gray-50 bg.

#### 1E. Frontend: Service Catalog Management

**Route:** `/dashboard/settings/services`

```
Service Catalog Page
├── Header: "Services & Pricing" + [Add Service] button
│
├── Section: Base Services (is_addon = false)
│   ├── Service Card: "Physiotherapy Session"
│   │   ├── INR 800 · 45 min
│   │   ├── SAC: 999312
│   │   └── [Edit] [Disable]
│   ├── Service Card: "Initial Consultation"
│   │   ├── INR 1,200 · 60 min
│   │   └── [Edit] [Disable]
│   └── ...
│
├── Section: Add-on Modalities (is_addon = true)
│   ├── Modality Card: "IFT (Interferential Therapy)"
│   │   ├── + INR 200 · 15 min
│   │   └── [Edit] [Disable]
│   ├── Modality Card: "Ultrasound Therapy"
│   │   ├── + INR 150 · 10 min
│   │   └── [Edit] [Disable]
│   └── ...
│
├── Section: Session Pack Templates
│   ├── Pack Template: "5 Sessions"
│   │   ├── INR 3,500 (INR 700/session) · 12% off
│   │   ├── Valid: 60 days
│   │   └── [Edit] [Disable]
│   ├── Pack Template: "10 Sessions" ⭐ Popular
│   │   ├── INR 6,500 (INR 650/session) · 19% off
│   │   ├── Valid: 90 days
│   │   └── [Edit] [Disable]
│   └── ...
│
└── Add Service Modal
    ├── Service Name: [Input]
    ├── Category: [Dropdown: Consultation, Modality, Home Visit, Other]
    ├── Is Add-on: [Toggle]
    ├── Price: [INR Input]
    ├── Duration: [Minutes Input]
    ├── SAC Code: [Input] (optional, for GST)
    └── [Save]
```

---

### Phase 2: Integrated Visit Billing Flow
*Bill at the point of care, not as a separate step*

#### 2A. Visit Completion Billing Prompt

When physio completes a visit → auto-show billing panel (if `auto_bill_on_visit_complete` is true).

**Flow:**
```
Visit Completed!
│
├── Does patient have active session pack?
│   ├── YES → "Deduct 1 session from [Pack Name]? (7 remaining)"
│   │         [Deduct Session] [Bill Differently]
│   └── NO → Show billing options
│
├── Billing Options (if no auto-deduct):
│   ├── Option 1: Charge Session Rate
│   │   ├── Service: [Pre-selected from catalog]
│   │   ├── Add-ons: [Checkboxes from catalog add-ons]
│   │   ├── Total: INR 1,000 (800 session + 200 IFT)
│   │   ├── Payment: [Full Pay] [Partial] [Udhaari]
│   │   └── Method: [Cash] [UPI] [Card]
│   │
│   ├── Option 2: Complimentary
│   │   └── Reason: [Input]
│   │
│   └── Option 3: Bill Later
│       └── (Creates unbilled visit entry)
│
└── After billing → Show receipt summary
    ├── Receipt #: RCP-ABCD-20260205-0001
    ├── Amount: INR 1,000
    ├── Method: UPI
    └── [Print Receipt] [Send to Patient] [Done]
```

#### 2B. Modify BillVisitModal

Update the existing `BillVisitModal` to:
1. Pull services from Service Catalog instead of manual amount entry
2. Show add-on modalities as checkboxes (if `modality_pricing_enabled`)
3. Auto-calculate total from selected services
4. Show session pack quick-deduct if available
5. Generate receipt after billing

#### 2C. Backend: Update Visit Billing

Add to `visit_billing` entity:
```
+ line_items (jsonb) - [{service_id, service_name, quantity, rate, amount}]
+ receipt_generated (boolean)
+ receipt_sent_to_patient (boolean)
```

Update `billVisit` service method to:
1. Accept `service_ids` array instead of flat `charge_amount`
2. Look up prices from service catalog
3. Calculate total with add-ons
4. Apply GST if clinic is registered
5. Auto-generate receipt number

---

### Phase 3: Invoice Management + Reports
*Print-ready invoices and financial insights*

#### 3A. Invoice Management Page

**Route:** `/dashboard/billing/invoices`

```
Invoices Page
├── Header: "Invoices" + [Create Invoice] button
├── Filters: [Date Range] [Patient Search] [Status: All/Draft/Finalized]
│
├── Invoice List (table)
│   ├── INV-ABCD-202602-0001 | Rahul Sharma | Feb 5 | INR 6,500 | Finalized
│   ├── INV-ABCD-202602-0002 | Priya Patel  | Feb 5 | INR 800   | Draft
│   └── ...
│
├── Invoice Detail View (slide-over or page)
│   ├── Clinic Header (name, address, GSTIN)
│   ├── Patient Details (name, address)
│   ├── Invoice Number, Date
│   ├── Line Items Table:
│   │   ├── Physiotherapy Session × 10 | INR 8,000
│   │   ├── IFT × 5                    | INR 1,000
│   │   ├── Subtotal                    | INR 9,000
│   │   ├── Discount (Pack discount)    | -INR 1,000
│   │   ├── GST (18%)                   | INR 1,440
│   │   └── Total                       | INR 9,440
│   ├── Amount Paid: INR 6,500
│   ├── Balance Due: INR 2,940
│   └── [Finalize] [Print] [Download PDF] [Send to Patient]
│
└── Create Invoice Modal
    ├── Patient: [Search]
    ├── Invoice Type: [Tax Invoice / Receipt / Estimate]
    ├── Auto-populate from: [Unbilled Visits] [Session Pack] [Manual]
    ├── Line Items: [Add/Remove rows]
    ├── Discount: [Amount or %]
    ├── GST: [Auto-calculated if registered]
    └── [Create Draft]
```

#### 3B. Reports Page

**Route:** `/dashboard/billing/reports`

```
Reports Page
├── Tab 1: Daily Summary
│   ├── Date Picker
│   ├── Collection Cards (Cash, UPI, Card, Total)
│   ├── Visits Billed count
│   ├── Session Packs Sold
│   └── Bar chart of daily collections (last 7/30 days)
│
├── Tab 2: Collections
│   ├── Date Range Picker
│   ├── Total Collections
│   ├── Breakdown by Method (pie chart)
│   ├── Breakdown by Purpose (visit, pack, outstanding, advance)
│   └── Daily breakdown table
│
├── Tab 3: Outstanding (Udhaari)
│   ├── Total Outstanding amount
│   ├── Patient count with dues
│   ├── Filter: Min amount, Days overdue
│   ├── Patient list with:
│   │   ├── Name, Phone, Amount, Days Since Visit
│   │   └── [Record Payment] [Send Reminder]
│   └── Export to CSV
│
└── Tab 4: Session Packs
    ├── Active Packs count, Total value
    ├── Packs expiring soon
    ├── Most popular pack (by sales)
    └── Pack utilization rate
```

---

### Phase 4: Receipt/Invoice PDF + WhatsApp
*Give patients something tangible*

#### 4A. Receipt PDF Generation

Simple thermal-printer-friendly receipt:
```
================================
       [Clinic Name]
   [Address Line 1]
   [Address Line 2]
   Ph: [Phone] | GSTIN: [GSTIN]
================================
RECEIPT: RCP-ABCD-20260205-0001
Date: 05-Feb-2026
Patient: Rahul Sharma
--------------------------------
Physiotherapy Session    ₹800.00
IFT (Add-on)            ₹200.00
--------------------------------
Subtotal               ₹1,000.00
GST (18%)                ₹180.00
--------------------------------
TOTAL                  ₹1,180.00
Paid (UPI)             ₹1,180.00
Balance                    ₹0.00
================================
   Thank you! Get well soon.
================================
```

For session pack deductions:
```
================================
RECEIPT: RCP-ABCD-20260205-0002
Date: 05-Feb-2026
Patient: Priya Patel
--------------------------------
Session Deducted from:
"10 Session Pack"
Sessions Used: 6/10
Sessions Remaining: 4
--------------------------------
No payment due.
================================
```

#### 4B. WhatsApp Integration (via API)

- Send receipt after billing
- Send outstanding reminder (configurable frequency)
- Send session pack expiry warning (7 days before)
- Send appointment + billing summary

---

### Phase 5: Corporate Billing (Future-Ready)
*For clinics with corporate tie-ups*

#### 5A. Corporate Account Entity

```
corporate_account
├── id, clinic_id
├── company_name - "TCS", "Infosys"
├── contact_person, contact_email, contact_phone
├── billing_email
├── rate_card (jsonb) - custom rates per service
├── session_limit_per_employee (int, optional)
├── payment_terms_days (int) - 30, 60, 90
├── billing_cycle (enum) - MONTHLY, QUARTERLY
├── is_active
└── created_at, updated_at
```

#### 5B. Patient-Corporate Link

```
patient.billing_type = 'CORPORATE'
patient.corporate_account_id = FK
```

#### 5C. Monthly Corporate Invoice

Auto-generate monthly invoice for corporate accounts:
- List all visits by employees
- Apply corporate rate card
- Group by employee
- Send to billing email

---

## Data Model Changes Summary

### New Entities to Create (Backend)

| Entity | Priority | Complexity |
|--------|----------|------------|
| `service_catalog` | P0 | Medium |
| `session_pack_template` | P1 | Simple |
| `clinic_billing_settings` | P0 | Simple (jsonb on clinic or new table) |
| `corporate_account` | P3 | Medium |

### Existing Entities to Modify

| Entity | Change | Priority |
|--------|--------|----------|
| `visit_billing` | Add `line_items` jsonb, receipt tracking | P1 |
| `patient` | Add `billing_type`, `corporate_account_id` (optional) | P3 |

### New API Endpoints

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | `/billing/clinic/:clinicId/settings` | Get billing settings | P0 |
| PUT | `/billing/clinic/:clinicId/settings` | Update billing settings | P0 |
| CRUD | `/billing/clinic/:clinicId/services` | Service catalog CRUD | P0 |
| CRUD | `/billing/clinic/:clinicId/pack-templates` | Pack template CRUD | P1 |
| GET | `/billing/invoices/:id/pdf` | Generate invoice PDF | P2 |
| POST | `/billing/invoices/:id/send` | Send invoice via WhatsApp/email | P3 |
| CRUD | `/billing/corporate-accounts` | Corporate account management | P3 |

### Existing Endpoints to Modify

| Endpoint | Change | Priority |
|----------|--------|----------|
| `POST /billing/visits/:visitId/bill` | Accept service_ids, calculate from catalog | P1 |
| `POST /billing/session-packs` | Accept template_id for quick creation | P1 |

---

## Frontend Pages to Build

| Page | Route | Priority | Complexity |
|------|-------|----------|------------|
| Billing Settings | `/dashboard/settings/billing` | P0 | Medium |
| Service Catalog | `/dashboard/settings/services` | P0 | Medium |
| Invoice Management | `/dashboard/billing/invoices` | P1 | High |
| Invoice Detail/Print | `/dashboard/billing/invoices/[id]` | P2 | Medium |
| Reports | `/dashboard/billing/reports` | P2 | Medium |

### Frontend Components to Build/Modify

| Component | Priority | Notes |
|-----------|----------|-------|
| BillingSettingsPage | P0 | New page |
| ServiceCatalogPage | P0 | New page with add/edit modals |
| PackTemplateManager | P1 | Section within ServiceCatalogPage |
| BillVisitModal (update) | P1 | Pull from service catalog, show add-ons |
| CreateSessionPackModal (update) | P1 | Add template quick-select |
| InvoiceListPage | P1 | New page |
| InvoiceDetailView | P2 | Slide-over or separate page |
| ReportsPage | P2 | New page with tabs |
| ReceiptPreview | P2 | Printable receipt component |

---

## Implementation Order (Recommended)

```
Step 1: Backend - Service Catalog entity + CRUD API
Step 2: Backend - Clinic Billing Settings API
Step 3: Frontend - Billing Settings page
Step 4: Frontend - Service Catalog management page
Step 5: Backend - Session Pack Templates entity + API
Step 6: Frontend - Update CreateSessionPackModal with templates
Step 7: Backend - Update billVisit to use service catalog
Step 8: Frontend - Update BillVisitModal with catalog integration
Step 9: Frontend - Invoice management page
Step 10: Backend - Invoice PDF generation
Step 11: Frontend - Reports page
Step 12: Backend - WhatsApp/receipt sending
```

---

## Indian Market Coverage

| Clinic Type | What We Already Have | What Phase 1 Adds | What Phase 2-3 Adds |
|-------------|---------------------|--------------------|--------------------|
| Solo practice | Per-session billing, Cash/UPI, Session packs, Udhaari | Service rates, Billing settings | Invoices, Reports |
| Multi-physio | Same as above | Service catalog, Multiple rates, GST | Modality pricing, PDF invoices |
| Premium clinic | Same as above | Full service catalog | Home visit premium, Corporate |

**After Phase 1-2: ~90% of Indian clinics are fully served.**
**After Phase 3: ~95% covered (adds corporate + reporting).**

---

## Key Principles

1. **Simple by default** - Solo practitioner sees only: session rate, session packs, cash/UPI. No GST forms, no modality pricing, no corporate tabs.

2. **Progressive disclosure** - Turn on features as clinic grows. Enable GST when they register. Enable modalities when they add equipment. Enable corporate when they get contracts.

3. **Indian payment-first** - Cash and UPI are primary. Card is secondary. No need for Stripe/PayPal integration right now.

4. **Udhaari is a feature, not a bug** - Outstanding balance tracking is core. Indian clinics rely on trust-based billing. Track it, don't fight it.

5. **WhatsApp > Email** - For receipts, reminders, everything patient-facing. India runs on WhatsApp.

6. **GST compliance ready** - Even if clinic isn't registered today, we store SAC codes and can generate GST invoices when they cross threshold.

7. **Thermal printer friendly** - Receipts should be simple text, printable on INR 3,000 thermal printers that every clinic has.

---

*Plan created: February 5, 2026*
