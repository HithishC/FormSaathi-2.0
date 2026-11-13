// ==================== USER & AUTH ====================
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'applicant' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicantProfile {
  id: string;
  user_id: string;
  full_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  category?: string | null;
  annual_family_income?: number | null;
  domicile_state?: string | null;
  district?: string | null;
  aadhaar_last_four?: string | null;
  bank_account_linked: boolean;
  npci_mapped: boolean;
  sslc_registration_number?: string | null;
  current_education_level?: string | null;
  institution_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
}

// ==================== SCHEMES ====================
export interface Scheme {
  id: string;
  name: string;
  description: string;
  department: string;
  portal_url?: string;
  category: string;
  sub_categories: string[];
  state: string;
  benefits: SchemeBenefit[];
  eligibility_rules: SchemeEligibilityRule[];
  required_documents: SchemeDocument[];
  important_dates: SchemeDate[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchemeBenefit {
  type: string;
  description: string;
  amount?: number;
  frequency?: string;
}

export interface SchemeEligibilityRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  description: string;
  is_mandatory: boolean;
  disqualifying: boolean;
}

export interface SchemeDocument {
  id: string;
  document_type: string;
  name: string;
  description: string;
  is_mandatory: boolean;
  digilocker_available: boolean;
}

export interface SchemeDate {
  event: string;
  date: string;
  description?: string;
}

// ==================== ELIGIBILITY ====================
export interface EligibilityAssessmentRequest {
  scheme_id: string;
  profile_data: Record<string, unknown>;
}

export interface EligibilityResult {
  id: string;
  scheme_id: string;
  scheme_name: string;
  user_id: string;
  is_eligible: boolean;
  eligibility_percentage: number;
  conditions: EligibilityCondition[];
  missing_information: string[];
  required_documents: string[];
  ai_explanation?: string;
  ai_explanation_kannada?: string;
  disclaimer: string;
  assessed_at: string;
}

export interface EligibilityCondition {
  rule_id: string;
  field: string;
  description: string;
  is_met: boolean;
  is_mandatory: boolean;
  is_disqualifying: boolean;
  provided_value?: string;
  expected_value?: string;
  explanation: string;
}

export interface EligibilityQuestionnaire {
  scheme_id: string;
  scheme_name: string;
  questions: QuestionnaireField[];
}

export interface QuestionnaireField {
  field: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
  required: boolean;
  placeholder?: string;
  description?: string;
}

// ==================== APPLICATIONS ====================
export interface Application {
  id: string;
  user_id: string;
  scheme_id: string;
  scheme_name: string;
  reference_number?: string;
  official_reference_number?: string;
  status: ApplicationStatusType;
  tracking_mode: 'official' | 'assisted';
  submission_date?: string;
  last_updated: string;
  created_at: string;
  documents: string[];
  notes?: string;
}

export type ApplicationStatusType =
  | 'draft'
  | 'documents_pending'
  | 'documents_submitted'
  | 'under_review'
  | 'verification_in_progress'
  | 'approved'
  | 'rejected'
  | 'disbursement_initiated'
  | 'disbursement_completed'
  | 'on_hold';

export interface ApplicationStatusEvent {
  id: string;
  application_id: string;
  status: ApplicationStatusType;
  source: 'official_portal' | 'sms' | 'email' | 'user_reported' | 'system';
  notes?: string;
  evidence_document_id?: string;
  timestamp: string;
  created_by: string;
}

export interface ApplicationTimeline {
  application_id: string;
  scheme_name: string;
  reference_number?: string;
  current_status: ApplicationStatusType;
  tracking_mode: 'official' | 'assisted';
  events: ApplicationStatusEvent[];
  expected_stages: ExpectedStage[];
}

export interface ExpectedStage {
  status: ApplicationStatusType;
  name: string;
  description: string;
  is_completed: boolean;
  is_current: boolean;
  completed_date?: string;
}

// ==================== DOCUMENTS ====================
export interface Document {
  id: string;
  user_id: string;
  document_type: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  source: 'upload' | 'digilocker';
  digilocker_uri?: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'needs_review';
  verification: DocumentVerification | null;
  analysis: DocumentAnalysis | null;
  uploaded_at: string;
  updated_at: string;
}

export interface DocumentVerification {
  verified_by: string;
  verified_at: string;
  status: 'verified' | 'rejected' | 'needs_review';
  notes?: string;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  extracted_fields: Record<string, string>;
  issues: DocumentIssue[];
  confidence_score: number;
  name_match: NameMatchResult | null;
  expiry_check: ExpiryCheckResult | null;
  recommendations: string[];
  analyzed_at: string;
}

export interface DocumentIssue {
  type: 'error' | 'warning' | 'info';
  field?: string;
  message: string;
}

export interface NameMatchResult {
  is_match: boolean;
  document_name: string;
  profile_name: string;
  similarity_score: number;
}

export interface ExpiryCheckResult {
  is_expired: boolean;
  expiry_date?: string;
  days_until_expiry?: number;
}

// ==================== DIGILOCKER ====================
export interface DigiLockerConnection {
  is_connected: boolean;
  connected_at?: string;
  aadhaar_last_four?: string;
  full_name?: string;
  is_sandbox: boolean;
}

export interface DigiLockerDocument {
  uri: string;
  name: string;
  type: string;
  issuer: string;
  issued_date?: string;
  description?: string;
  is_fetched: boolean;
  mapped_document_id?: string;
}

export interface DigiLockerAuthUrl {
  auth_url: string;
  state: string;
}

// ==================== PRIVACY & CONSENT ====================
export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  is_granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  description: string;
  updated_at: string;
}

export type ConsentType =
  | 'data_processing'
  | 'ai_document_analysis'
  | 'digilocker_access'
  | 'document_storage'
  | 'notifications';

export interface AuditEvent {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export interface AIProcessingLog {
  id: string;
  user_id: string;
  action: string;
  input_summary: string;
  output_summary: string;
  model_used?: string;
  timestamp: string;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed';
  requested_at: string;
  completed_at?: string;
}

// ==================== RISK & READINESS ====================
export interface RiskAssessment {
  id: string;
  user_id: string;
  scheme_id: string;
  scheme_name: string;
  risk_factors: RiskFactor[];
  total_risks: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  assessed_at: string;
}

export interface RiskFactor {
  id: string;
  name: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommended_action: string;
  action_url?: string;
  is_resolved: boolean;
}

export interface ReadinessPassport {
  id: string;
  user_id: string;
  scheme_id: string;
  scheme_name: string;
  overall_score: number;
  overall_status: 'ready' | 'almost_ready' | 'needs_attention' | 'not_ready';
  sections: ReadinessSection[];
  missing_items: string[];
  recommended_next_steps: string[];
  disclaimer: string;
  assessed_at: string;
}

export interface ReadinessSection {
  name: string;
  score: number;
  status: string;
  details: string;
  items: ReadinessItem[];
}

export interface ReadinessItem {
  name: string;
  is_complete: boolean;
  description?: string;
}

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  user_id: string;
  notification_type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ACTION_REQUIRED';
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

// ==================== ADMIN ====================
export interface AdminStats {
  total_users: number;
  total_applications: number;
  total_documents: number;
  active_schemes: number;
  applications_by_status: Record<string, number>;
  recent_registrations: number;
}

// ==================== API RESPONSES ====================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}


