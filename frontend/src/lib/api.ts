import {
  AuthResponse,
  RegisterRequest,
  User,
  ApplicantProfile,
  Scheme,
  SchemeDocument,
  EligibilityResult,
  EligibilityQuestionnaire,
  EligibilityAssessmentRequest,
  Document as DocType,
  DocumentAnalysis,
  DigiLockerAuthUrl,
  DigiLockerConnection,
  DigiLockerDocument,
  Application,
  ApplicationTimeline,
  ApplicationStatusType,
  ConsentRecord,
  AuditEvent,
  AIProcessingLog,
  RiskAssessment,
  ReadinessPassport,
  Notification,
  NotificationListResponse,
  AdminStats,
  PaginatedResponse,
} from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('formsaathi_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.detail || errorData.message || 'An error occurred',
        status: response.status,
        detail: errorData.detail,
      };
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.detail || errorData.message || 'An error occurred',
        status: response.status,
        detail: errorData.detail,
      };
    }

    return response.json();
  }

  // ==================== AUTH ====================
  auth = {
    register: (data: RegisterRequest): Promise<AuthResponse> =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (email: string, password: string): Promise<AuthResponse> => {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      return fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw { message: err.detail || 'Login failed', status: res.status };
        }
        return res.json();
      });
    },

    getMe: (): Promise<User> =>
      this.request('/auth/me'),

    getProfile: (): Promise<ApplicantProfile> =>
      this.request('/auth/profile'),

    updateProfile: (data: Partial<ApplicantProfile>): Promise<ApplicantProfile> =>
      this.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // ==================== SCHEMES ====================
  schemes = {
    list: (params?: { page?: number; limit?: number }): Promise<any> =>
      this.request(`/schemes?page=${params?.page || 1}&limit=${params?.limit || 20}`),

    getById: (id: string): Promise<any> =>
      this.request(`/schemes/${id}`),

    getDocuments: (id: string): Promise<any> =>
      this.request(`/schemes/${id}/documents`),
  };

  // ==================== ELIGIBILITY ====================
  eligibility = {
    assess: (data: any): Promise<any> =>
      this.request('/eligibility/assess', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    explain: (schemeId: string, language?: string): Promise<{ explanation: string }> =>
      this.request('/eligibility/explain', {
        method: 'POST',
        body: JSON.stringify({ scheme_id: schemeId, language: language || 'en' }),
      }),

    getQuestionnaire: (schemeId: string): Promise<any> =>
      this.request(`/eligibility/questionnaire/${schemeId}`),
  };

  // ==================== DOCUMENTS ====================
  documents = {
    upload: (file: File, documentType: string): Promise<any> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      return this.requestFormData('/documents/upload', formData);
    },

    list: (): Promise<any> =>
      this.request('/documents'),

    getById: (id: string): Promise<any> =>
      this.request(`/documents/${id}`),

    delete: (id: string): Promise<void> =>
      this.request(`/documents/${id}`, { method: 'DELETE' }),

    analyze: (id: string): Promise<any> =>
      this.request(`/documents/${id}/analyze`, { method: 'POST' }),
  };

  // ==================== DIGILOCKER ====================
  digilocker = {
    getAuthUrl: (): Promise<any> =>
      this.request('/digilocker/auth-url'),

    callback: (code: string, state: string): Promise<any> =>
      this.request('/digilocker/callback', {
        method: 'POST',
        body: JSON.stringify({ code, state }),
      }),

    getStatus: (): Promise<any> =>
      this.request('/digilocker/status'),

    status: (): Promise<any> =>
      this.request('/digilocker/status'),

    listDocuments: (): Promise<any> =>
      this.request('/digilocker/documents'),

    fetchDocument: (docType: string): Promise<any> =>
      this.request(`/digilocker/fetch/${docType}`, {
        method: 'POST',
      }),

    disconnect: (): Promise<any> =>
      this.request('/digilocker/disconnect', { method: 'DELETE' }),
  };

  // ==================== APPLICATIONS ====================
  applications = {
    create: (data: { scheme_id: string; tracking_mode?: string; notes?: string }): Promise<any> =>
      this.request('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: (): Promise<any> =>
      this.request('/applications'),

    getById: (id: string): Promise<any> =>
      this.request(`/applications/${id}`),

    getTimeline: (id: string): Promise<any> =>
      this.request(`/applications/${id}/timeline`),

    updateStatus: (
      id: string,
      data: { status: string; source?: string; notes?: string }
    ): Promise<any> =>
      this.request(`/applications/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    addOfficialRef: (id: string, referenceNumber: string): Promise<any> =>
      this.request(`/applications/${id}/official-reference`, {
        method: 'PUT',
        body: JSON.stringify({ official_reference_number: referenceNumber }),
      }),
  };

  // ==================== PRIVACY ====================
  privacy = {
    getConsents: (): Promise<any> =>
      this.request('/privacy/consents'),

    updateConsent: (data: { consent_type: string; is_granted: boolean; details?: string }): Promise<any> =>
      this.request('/privacy/consents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    revokeConsent: (consentType: string): Promise<any> =>
      this.request(`/privacy/consents/${consentType}`, { method: 'DELETE' }),

    getAuditLog: (): Promise<any> =>
      this.request('/privacy/audit-log'),

    getAiProcessingLog: (): Promise<any> =>
      this.request('/privacy/ai-processing-log'),

    getAILog: (): Promise<any> =>
      this.request('/privacy/ai-processing-log'),

    deleteData: (currentPassword: string): Promise<{ message: string }> =>
      this.request('/privacy/data', {
        method: 'DELETE',
        body: JSON.stringify({ current_password: currentPassword }),
      }),
  };

  // ==================== RISK ====================
  risk = {
    getAssessment: (appId: string): Promise<any> =>
      this.request(`/risk/assessment/${appId}`),

    getReadiness: (appId: string): Promise<any> =>
      this.request(`/risk/readiness/${appId}`),
  };

  // ==================== NOTIFICATIONS ====================
  notifications = {
    list: (): Promise<any> =>
      this.request('/notifications'),

    markRead: (id: string): Promise<any> =>
      this.request(`/notifications/${id}/read`, { method: 'PUT' }),

    markAllRead: (): Promise<void> =>
      this.request('/notifications/read-all', { method: 'PUT' }),
  };

  // ==================== ADMIN ====================
  admin = {
    getUsers: (params?: { page?: number; limit?: number }): Promise<any> =>
      this.request(`/admin/users?page=${params?.page || 1}&limit=${params?.limit || 20}`),

    getApplications: (params?: { page?: number; limit?: number; status?: string }): Promise<any> =>
      this.request(`/admin/applications?page=${params?.page || 1}&limit=${params?.limit || 20}${params?.status ? `&status=${params.status}` : ''}`),

    getStats: (): Promise<AdminStats> =>
      this.request('/admin/stats'),

    updateApplicationStatus: (
      applicationId: string,
      data: { status: ApplicationStatusType; notes?: string }
    ): Promise<Application> =>
      this.request(`/admin/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };
}

export const api = new ApiClient(API_BASE);
export default api;



