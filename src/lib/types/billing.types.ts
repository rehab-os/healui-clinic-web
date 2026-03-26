// Billing Types - Mirror backend DTOs

// Enums
export type SessionPackStatus = 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'CANCELLED'
export type SessionPackPaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID'
export type BillingType = 'SESSION_DEDUCT' | 'CHARGED' | 'COMPLIMENTARY' | 'MANUAL' | 'CATALOG' | 'CORPORATE'
export type VisitBillingStatus = 'PAID' | 'PARTIAL' | 'OWED'
export type VisitBillingStatusEnum = 'UNBILLED' | 'BILLED' | 'PACK_DEDUCTED' | 'COMPLIMENTARY' | 'CORPORATE_BILLED'
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'
export type PaymentFor = 'VISIT' | 'SESSION_PACK' | 'OUTSTANDING' | 'ADVANCE' | 'CORPORATE' | 'REFUND'
export type RefundType = 'ADVANCE' | 'SESSION_PACK' | 'VISIT'
export type InvoiceType = 'TAX_INVOICE' | 'RECEIPT' | 'ESTIMATE'
export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED'
export type LineItemType = 'CONSULTATION' | 'SESSION' | 'SESSION_PACK' | 'OTHER'
export type ServiceType = 'consultation' | 'session' | 'addon'

// ============ Patient Account ============
export interface PatientAccountDto {
  id: string
  patient_id: string
  clinic_id: string
  outstanding_balance: number
  advance_balance: number
  last_payment_date?: string
  last_visit_billed_date?: string
  created_at: string
  patient?: {
    id: string
    full_name: string
    phone?: string
  }
  active_session_packs?: SessionPackDto[]
  recent_payments?: PaymentDto[]
  unbilled_visits_count?: number
}

export interface PatientBalanceDto {
  outstanding: number
  advance: number
  sessions_available: number
}

// ============ Session Pack ============
export interface SessionPackDto {
  id: string
  patient_id: string
  clinic_id: string
  name: string
  description?: string
  total_sessions: number
  sessions_used: number
  sessions_remaining: number
  amount: number
  amount_paid: number
  condition_id?: string
  valid_until?: string
  status: SessionPackStatus
  payment_status: SessionPackPaymentStatus
  created_at: string
  patient?: {
    id: string
    full_name: string
  }
  condition?: {
    id: string
    condition_name: string
  }
  creator?: {
    id: string
    full_name: string
  }
}

export interface CreateSessionPackDto {
  patient_id: string
  clinic_id: string
  name: string
  description?: string
  total_sessions: number
  amount: number
  condition_id?: string
  valid_until?: string
  notes?: string
  initial_payment?: number
  payment_method?: PaymentMethod
}

export interface AddSessionsDto {
  sessions_to_add: number
  additional_amount?: number
  payment_method?: PaymentMethod
  notes?: string
}

export interface SessionPackQueryParams {
  clinic_id: string
  patient_id?: string
  status?: SessionPackStatus
  payment_status?: SessionPackPaymentStatus
  has_remaining?: boolean
  page?: number
  limit?: number
}

// ============ Visit Billing ============
export interface BillingServiceLineItem {
  service_id?: string
  name: string
  price: number
  quantity: number
}

export interface VisitBillingDto {
  id: string
  visit_id: string
  patient_id: string
  clinic_id: string
  billing_type: BillingType
  session_pack_id?: string
  charge_amount?: number
  amount_paid: number
  amount_owed: number
  status: VisitBillingStatus
  notes?: string
  complimentary_reason?: string
  services?: BillingServiceLineItem[]
  discount_amount?: number
  discount_percent?: number
  discount_reason?: string
  corporate_company?: string
  visit_ids?: string[]
  created_at: string
  visit?: any
  sessionPack?: SessionPackDto
  billedByUser?: any
}

export interface BillVisitDto {
  billing_type: BillingType
  session_pack_id?: string
  charge_amount?: number
  payment_amount?: number
  payment_method?: PaymentMethod
  payment_reference?: string
  complimentary_reason?: string
  notes?: string
  services?: BillingServiceLineItem[]
  discount_amount?: number
  discount_percent?: number
  discount_reason?: string
  corporate_company?: string
  visit_ids?: string[]
}

export interface UpdateVisitBillingDto {
  payment_amount?: number
  payment_method?: PaymentMethod
  payment_reference?: string
  notes?: string
}

// ============ Payment ============
export interface PaymentDto {
  id: string
  patient_id: string
  clinic_id: string
  amount: number
  method: PaymentMethod
  payment_for: PaymentFor
  receipt_number: string
  reference_number?: string
  notes?: string
  visit_billing_id?: string
  billing_type?: BillingType
  services_summary?: string
  refund_reason?: string
  refund_type?: RefundType
  refunded_payment_id?: string
  cancellation_fee?: number
  created_at: string
  patient?: any
  receivedByUser?: any
}

export interface RecordPaymentDto {
  amount: number
  method: PaymentMethod
  payment_for: PaymentFor
  visit_billing_id?: string
  session_pack_id?: string
  reference_number?: string
  notes?: string
  metadata?: {
    upi_id?: string
    card_last_four?: string
    cheque_number?: string
    cheque_date?: string
    bank_name?: string
  }
}

// ============ Refund ============
export interface ProcessRefundDto {
  refund_type: RefundType
  amount: number
  reason: string
  method: PaymentMethod
  payment_id?: string
  session_pack_id?: string
  cancellation_fee?: number
  reference_number?: string
  notes?: string
}

// ============ Invoice ============
export interface InvoiceLineItemDto {
  id?: string
  item_type: LineItemType
  description: string
  quantity: number
  rate: number
  amount: number
  visit_billing_id?: string
  session_pack_id?: string
  service_date?: string
  hsn_sac_code?: string
}

export interface InvoiceDto {
  id: string
  patient_id: string
  clinic_id: string
  invoice_number: string
  invoice_type: InvoiceType
  invoice_date: string
  subtotal: number
  discount_amount?: number
  gst_percent?: number
  gst_amount?: number
  total_amount: number
  amount_paid: number
  balance_due: number
  status: InvoiceStatus
  notes?: string
  clinic_gstin?: string
  patient_gstin?: string
  billing_address?: {
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
  }
  created_at: string
  patient?: any
  clinic?: any
  lineItems?: InvoiceLineItemDto[]
}

export interface CreateInvoiceDto {
  patient_id: string
  clinic_id: string
  invoice_type: InvoiceType
  invoice_date?: string
  discount_amount?: number
  gst_percent?: number
  clinic_gstin?: string
  patient_gstin?: string
  billing_address?: {
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
  }
  notes?: string
  line_items: CreateInvoiceLineItemDto[]
}

export interface CreateInvoiceLineItemDto {
  item_type: LineItemType
  description: string
  quantity: number
  rate: number
  visit_billing_id?: string
  session_pack_id?: string
  service_date?: string
  hsn_sac_code?: string
}

export interface InvoiceQueryParams {
  clinic_id: string
  patient_id?: string
  invoice_type?: InvoiceType
  status?: InvoiceStatus
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  limit?: number
}

// ============ Reports ============
export interface DailySummaryDto {
  date: string
  total_collections: number
  cash_collections: number
  upi_collections: number
  card_collections: number
  other_collections: number
  visits_billed: number
  sessions_from_packs: number
  session_packs_sold: number
  session_packs_revenue: number
  outstanding_added: number
  outstanding_collected: number
}

export interface OutstandingPatientDto {
  patient_id: string
  patient_name: string
  patient_phone: string
  outstanding_amount: number
  last_visit_date?: string
  last_payment_date?: string
  days_since_last_visit: number
}

export interface OutstandingReportDto {
  total_outstanding: number
  patients_with_dues: number
  patients: OutstandingPatientDto[]
}

export interface OutstandingReportParams {
  clinic_id: string
  min_amount?: number
  days_overdue?: number
  page?: number
  limit?: number
}

export interface CollectionReportDto {
  date_from: string
  date_to: string
  total_collections: number
  by_method: {
    CASH: number
    UPI: number
    CARD: number
    BANK_TRANSFER: number
    CHEQUE: number
    OTHER: number
  }
  by_purpose: {
    VISIT: number
    SESSION_PACK: number
    OUTSTANDING: number
    ADVANCE: number
  }
  payment_count: number
  daily_breakdown?: Array<{
    date: string
    amount: number
    count: number
  }>
}

export interface CollectionReportParams {
  clinic_id: string
  date_from: string
  date_to: string
  received_by?: string
  method?: PaymentMethod
}

// ============ Clinic Billing Settings ============
export interface ClinicBillingSettingsDto {
  id: string
  clinic_id: string
  enabled_payment_methods: PaymentMethod[]
  gst_registered: boolean
  gstin?: string
  gst_rate: number
  receipt_prefix?: string
  discount_reasons: string[]
  referral_sources: string[]
  corporate_companies: string[]
  auto_bill_on_visit_complete: boolean
  created_at: string
  updated_at: string
}

export interface UpdateClinicBillingSettingsDto {
  enabled_payment_methods?: PaymentMethod[]
  gst_registered?: boolean
  gstin?: string
  gst_rate?: number
  receipt_prefix?: string
  discount_reasons?: string[]
  referral_sources?: string[]
  corporate_companies?: string[]
  auto_bill_on_visit_complete?: boolean
}

// ============ Clinic Services (Charges Table) ============
export interface ClinicServiceDto {
  id: string
  clinic_id: string
  name: string
  price: number
  home_visit_price?: number
  service_type: ServiceType
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateClinicServiceDto {
  clinic_id?: string
  name: string
  price: number
  home_visit_price?: number
  service_type: ServiceType
  is_active?: boolean
}

export interface UpdateClinicServiceDto {
  name?: string
  price?: number
  home_visit_price?: number
  service_type?: ServiceType
  is_active?: boolean
}

export interface ReorderClinicServicesDto {
  items: { id: string; display_order: number }[]
}

// ============ Session Pack Templates ============
export interface SessionPackTemplateDto {
  id: string
  clinic_id: string
  name: string
  service_id?: string
  total_sessions: number
  amount: number
  per_session_rate: number
  validity_days?: number
  is_popular: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  service?: ClinicServiceDto
}

export interface CreateSessionPackTemplateDto {
  clinic_id?: string
  name: string
  service_id?: string
  total_sessions: number
  amount: number
  validity_days?: number
  is_popular?: boolean
  is_active?: boolean
}

export interface UpdateSessionPackTemplateDto {
  name?: string
  service_id?: string
  total_sessions?: number
  amount?: number
  validity_days?: number
  is_popular?: boolean
  is_active?: boolean
}

// ============ Multi-Visit Billing ============
export interface BillMultipleVisitsDto {
  visit_ids: string[]
  clinic_id: string
  billing_type: BillingType
  charge_amount?: number
  payment_amount?: number
  payment_method?: PaymentMethod
  payment_reference?: string
  notes?: string
  services?: BillingServiceLineItem[]
  discount_amount?: number
  discount_percent?: number
  discount_reason?: string
  corporate_company?: string
}

// ============ Corporate Outstanding ============
export interface CorporateOutstandingParams {
  clinic_id: string
  company?: string
}

export interface CorporateOutstandingDto {
  companies: CorporateCompanyOutstanding[]
  total_outstanding: number
}

export interface CorporateCompanyOutstanding {
  company: string
  total_billed: number
  total_paid: number
  outstanding: number
  visit_count: number
  patient_count: number
}

// ============ Receipt Data ============
export interface ReceiptDataDto {
  receipt_number: string
  billing_id: string
  date: string
  visit_date?: string | null       // appointment date from visit.scheduled_date
  therapist_name?: string | null   // treating physiotherapist full name
  patient: {
    name: string
    phone?: string
    patient_code?: string | null
    age?: number | null
    gender?: string | null
  }
  clinic: {
    name: string
    address?: string
    phone?: string
    gstin?: string
  }
  billing_type: BillingType
  services?: BillingServiceLineItem[]
  subtotal: number
  discount_amount?: number
  discount_percent?: number
  discount_reason?: string
  gst_rate?: number
  gst_amount?: number
  total_amount: number
  amount_paid: number
  amount_owed: number
  payment_method?: PaymentMethod | null
  payment_reference?: string | null
  corporate_company?: string
  payments?: Array<{
    amount: number
    method: PaymentMethod
    reference?: string
    receipt_number: string
    date: string
  }>
}
