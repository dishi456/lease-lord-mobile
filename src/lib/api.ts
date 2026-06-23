import * as SecureStore from "expo-secure-store";
import { API_V1, API_BASE } from "./config";

const TOKEN_KEY = "leaselord.token";

// In-memory copy of the JWT so every request can attach it without an async read.
let authToken: string | null = null;

export function getToken() {
  return authToken;
}

export async function loadToken(): Promise<string | null> {
  try {
    authToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    authToken = null;
  }
  return authToken;
}

export async function saveToken(token: string) {
  authToken = token;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    /* non-fatal */
  }
}

export async function clearToken() {
  authToken = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* non-fatal */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Opts = { auth?: boolean; body?: unknown; query?: Record<string, string | number | undefined> };

async function request<T>(method: string, path: string, opts: Opts = {}): Promise<T> {
  const { auth = true, body, query } = opts;
  let url = path.startsWith("http") ? path : `${API_V1}${path}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Network error — check your connection and the API URL.", 0);
  }

  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    if (data && typeof data === "object" && "error" in data) {
      msg = String((data as { error: unknown }).error);
    }
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---- Typed shapes (subset of the fields the screens use) -------------------
export type Me = {
  id: string; fullName: string; email: string; role: "TENANT" | "USER" | "LANDLORD" | "MASTER_ADMIN";
  phone: string | null; avatarUrl: string | null; verified: boolean; status: string;
};
export type AuthResult = { token: string; user: { id: string; fullName: string; email: string; role: Me["role"]; status: string } };

export type Dashboard = {
  lease: { id: string; monthlyRent: number; endDate: string; status: string; property: { name: string; address: string } } | null;
  nextInvoice: { id: string; amount: number; dueDate: string; status: string; periodMonth: string } | null;
  openMaintenanceCount: number;
  unreadNotifications: number;
};
export type Lease = {
  id: string; monthlyRent: number; securityDeposit: number; maintenanceFee: number | null;
  startDate: string; endDate: string; status: string; noticePeriodDays: number;
  noticeGivenAt: string | null; noticeEffectiveDate: string | null; signedContractUrl: string | null;
  property: { id: string; name: string; address: string; photos: string[] };
  landlord: { name: string; phone: string | null };
};
export type Invoice = { id: string; periodMonth: string; amount: number; dueDate: string; status: string };
export type Payment = { id: string; amount: number; method: string; status: string; paidAt: string | null; receiptUrl: string | null; createdAt: string; invoiceId: string; periodMonth: string };
export type Maintenance = { id: string; title: string; status: string; priority: string; images: string[]; createdAt: string };
export type MaintenanceDetail = Maintenance & { description: string; assignedTo: string | null; updatedAt: string; property: { id: string; name: string; address: string } };
export type Complaint = { id: string; subject: string; status: string; createdAt: string };
export type ComplaintDetail = Complaint & { description: string; updatedAt: string; property: { id: string; name: string } | null; messages: { id: string; body: string; authorId: string; mine: boolean; createdAt: string }[] };
export type Notification = { id: string; type: string; title: string; body: string | null; link: string | null; read: boolean; createdAt: string };
export type Listing = { id: string; ref: string | null; name: string; address: string; city: string; type: string; rent: number; securityDeposit: number; rooms: number | null; bathrooms: number | null; areaSqft: number | null; furnishing: string; amenities: string[]; available: boolean; verified: boolean; listedAt: string; photo: string | null };
export type ListingDetail = Omit<Listing, "city" | "photo" | "listedAt"> & { description: string | null; maintenanceMonthly: number | null; balconies: number | null; floor: number | null; totalFloors: number | null; carpetAreaSqft: number | null; facing: string | null; bachelorsAllowed: boolean; projectName: string | null; parkingSpots: number | null; listedBy: string; hasLobby: boolean; hasParking: boolean; hasLift: boolean; powerBackup: boolean; availability: string; photos: string[]; landlord: { name: string; verified: boolean } };
export type Enquiry = { token: string; createdAt: string; updatedAt: string; unread: number; lastMessage: { body: string; fromGuest: boolean; createdAt: string } | null; property: { id: string; ref: string | null; name: string; address: string; photo: string | null } };
export type TenantProfile = Me & { governmentId: string | null; emergencyContact: string | null; documents: { id: string; type: string; fileName: string | null; label: string | null; url: string; createdAt: string }[] };
export type PendingReview = { leaseId: string; endDate: string; status: string; property: { name: string; address: string }; landlordName: string };
export type ReviewCriteria = { propertyQuality: number; maintenanceSupport: number; communication: number; transparency: number; overall: number };

// ---- Landlord shapes -------------------------------------------------------
export type LandlordDashboard = {
  properties: number; occupied: number; vacant: number; tenants: number; expiringSoon: number;
  monthlyCollection: number; pendingDue: number; openMaintenance: number; openComplaints: number;
  rating: number | null; unreadInquiries: number;
};
export type LProperty = { id: string; ref: string | null; name: string; address: string; type: string; rent: number; availability: string; approved: boolean; verified: boolean; listedPublic: boolean; photo: string | null; tenants: string[] };
export type LTenant = { id: string; fullName: string; email: string; phone: string | null; status: string; verified: boolean; property: string | null };
export type LLease = { id: string; status: string; monthlyRent: number; startDate: string; endDate: string; property: string; tenant: string };
export type LInvoice = { id: string; periodMonth: string; amount: number; dueDate: string; status: string; property: string; tenant: string };
export type LMaintenance = { id: string; title: string; status: string; priority: string; assignedTo: string | null; images: string[]; createdAt: string; property: string; tenant: string };
export type LComplaint = { id: string; subject: string; status: string; createdAt: string; property: string | null; tenant: string };
export type LInquiry = { id: string; token: string; guestName: string; guestPhone: string; property: string; updatedAt: string; unread: number; lastMessage: { body: string; fromGuest: boolean } | null };
export type LPendingReview = { leaseId: string; endDate: string; property: string; tenant: string };
export type TenantCriteria = { rentDiscipline: number; propertyMaintenance: number; communication: number; ruleCompliance: number; conduct: number };

// ---- Admin shapes ----------------------------------------------------------
export type AdminDashboard = {
  landlords: number; tenants: number; users: number; properties: number; occupied: number; vacant: number; activeLeases: number;
  monthlyRevenue: number; pendingRent: number; openMaintenance: number; openComplaints: number;
  pendingLandlords: number; pendingProperties: number; flaggedReviews: number;
};
export type AdminUser = { id: string; fullName: string; email: string; phone: string | null; role: string; status: string; verified: boolean; createdAt: string };
export type AdminPayment = { id: string; amount: number; method: string; status: string; paidAt: string | null; createdAt: string; tenant: string; property: string };
export type AdminReview = { id: string; stars: number; feedback: string | null; direction: string; status: string; createdAt: string; from: string; fromRole: string; to: string };
export type AuditEntry = { id: string; action: string; entity: string; entityId: string | null; actor: string; createdAt: string };

// ---- API surface -----------------------------------------------------------
export const api = {
  // auth
  login: (email: string, password: string, otp?: string) =>
    request<AuthResult>("POST", "/auth/login", { auth: false, body: { email, password, otp } }),
  register: (b: { fullName: string; email: string; password: string; role: "USER" | "LANDLORD"; otpToken: string }) =>
    request<AuthResult>("POST", "/auth/register", { auth: false, body: b }),
  forgot: (email: string) => request<{ ok: true }>("POST", "/auth/forgot", { auth: false, body: { email } }),
  reset: (email: string, code: string, newPassword: string) =>
    request<{ ok: true }>("POST", "/auth/reset", { auth: false, body: { email, code, newPassword } }),
  me: () => request<Me>("GET", "/me"),

  // OTP (reused existing endpoints, not under /v1)
  sendOtp: (email: string, purpose: "register" | "chat") =>
    request<{ ok: boolean }>("POST", `${API_BASE}/api/otp/send`, { auth: false, body: { email, purpose } }),
  verifyOtp: (email: string, code: string, purpose: "register" | "chat") =>
    request<{ ok: boolean; verifyToken: string }>("POST", `${API_BASE}/api/otp/verify`, { auth: false, body: { email, code, purpose } }),

  // tenant
  dashboard: () => request<Dashboard>("GET", "/tenant/dashboard"),
  lease: () => request<{ lease: Lease | null }>("GET", "/tenant/lease"),
  giveNotice: () => request<{ ok: true; noticeEffectiveDate: string }>("POST", "/tenant/lease/notice", { body: {} }),
  invoices: () => request<{ items: Invoice[] }>("GET", "/tenant/invoices"),
  payments: () => request<{ items: Payment[] }>("GET", "/tenant/payments"),
  maintenance: () => request<{ items: Maintenance[] }>("GET", "/tenant/maintenance"),
  maintenanceDetail: (id: string) => request<MaintenanceDetail>("GET", `/tenant/maintenance/${id}`),
  createMaintenance: (b: { title: string; description: string; priority: string; imageUrls?: string[] }) =>
    request<{ id: string }>("POST", "/tenant/maintenance", { body: b }),
  complaints: () => request<{ items: Complaint[] }>("GET", "/tenant/complaints"),
  complaintDetail: (id: string) => request<ComplaintDetail>("GET", `/tenant/complaints/${id}`),
  createComplaint: (b: { subject: string; description: string }) =>
    request<{ id: string }>("POST", "/tenant/complaints", { body: b }),
  replyComplaint: (id: string, body: string) =>
    request<{ id: string }>("POST", `/tenant/complaints/${id}/messages`, { body: { body } }),
  tenantProfile: () => request<TenantProfile>("GET", "/tenant/profile"),
  updateTenantProfile: (b: Partial<{ fullName: string; phone: string; emergencyContact: string; avatarUrl: string }>) =>
    request<{ ok: true }>("PATCH", "/tenant/profile", { body: b }),
  pendingReviews: () => request<{ items: PendingReview[] }>("GET", "/tenant/reviews/pending"),
  submitReview: (b: { leaseId: string; stars: number; criteria: ReviewCriteria; feedback?: string; recommend?: boolean }) =>
    request<{ ok: true }>("POST", "/tenant/reviews", { body: b }),

  // shared
  notifications: () => request<{ items: Notification[]; unread: number }>("GET", "/notifications"),
  markRead: (id?: string) => request<{ ok: true }>("POST", "/notifications/read", { body: id ? { id } : {} }),

  // user / public
  listings: (q: Record<string, string | number | undefined>) =>
    request<{ items: Listing[]; total: number; page: number; pageSize: number; pages: number }>("GET", "/listings", { auth: false, query: q }),
  listingDetail: (idOrRef: string) => request<ListingDetail>("GET", `/listings/${idOrRef}`, { auth: false }),
  enquiries: () => request<{ items: Enquiry[] }>("GET", "/account/enquiries"),
  updateAccount: (b: Partial<{ fullName: string; phone: string; avatarUrl: string }>) =>
    request<{ ok: true }>("PATCH", "/account/profile", { body: b }),

  // landlord
  landlordDashboard: () => request<LandlordDashboard>("GET", "/landlord/dashboard"),
  landlordProperties: () => request<{ items: LProperty[] }>("GET", "/landlord/properties"),
  landlordTenants: () => request<{ items: LTenant[] }>("GET", "/landlord/tenants"),
  landlordLeases: () => request<{ items: LLease[] }>("GET", "/landlord/leases"),
  landlordInvoices: () => request<{ kpis: { collectedThisMonth: number; pending: number; overdue: number }; items: LInvoice[] }>("GET", "/landlord/invoices"),
  landlordPayInvoice: (id: string, method: string) => request<{ ok: true }>("POST", `/landlord/invoices/${id}/pay`, { body: { method } }),
  landlordRemindInvoice: (id: string) => request<{ ok: true }>("POST", `/landlord/invoices/${id}/remind`, { body: {} }),
  landlordMaintenance: (status?: string) => request<{ items: LMaintenance[] }>("GET", "/landlord/maintenance", { query: { status } }),
  landlordUpdateMaintenance: (id: string, b: { status?: string; assignedTo?: string }) => request<{ ok: true }>("POST", `/landlord/maintenance/${id}`, { body: b }),
  landlordComplaints: () => request<{ items: LComplaint[] }>("GET", "/landlord/complaints"),
  landlordRespondComplaint: (id: string, b: { body?: string; status?: string }) => request<{ ok: true }>("POST", `/landlord/complaints/${id}`, { body: b }),
  landlordInquiries: () => request<{ items: LInquiry[] }>("GET", "/landlord/inquiries"),
  landlordPendingReviews: () => request<{ items: LPendingReview[] }>("GET", "/landlord/reviews"),
  landlordRateTenant: (b: { leaseId: string; stars: number; criteria: TenantCriteria; feedback?: string; recommend?: boolean }) => request<{ ok: true }>("POST", "/landlord/reviews", { body: b }),

  // admin
  adminDashboard: () => request<AdminDashboard>("GET", "/admin/dashboard"),
  adminApprovals: () => request<{ landlords: { id: string; fullName: string; email: string; phone: string | null; createdAt: string }[]; properties: { id: string; name: string; address: string; ref: string | null; landlord: string; photo: string | null; createdAt: string }[] }>("GET", "/admin/approvals"),
  adminApproveProperty: (id: string, approved = true) => request<{ ok: true }>("POST", `/admin/properties/${id}/approve`, { body: { approved } }),
  adminUsers: (q: Record<string, string | number | undefined>) => request<{ items: AdminUser[]; total: number; page: number; pages: number }>("GET", "/admin/users", { query: q }),
  adminSetUser: (id: string, b: { status?: string; verified?: boolean }) => request<{ ok: true }>("POST", `/admin/users/${id}`, { body: b }),
  adminPayments: (status?: string) => request<{ kpis: { totalCollected: number; thisMonth: number; outstanding: number; refunded: number }; items: AdminPayment[] }>("GET", "/admin/payments", { query: { status } }),
  adminReviews: (status?: string) => request<{ items: AdminReview[] }>("GET", "/admin/reviews", { query: { status } }),
  adminModerateReview: (id: string, status: string) => request<{ ok: true }>("POST", `/admin/reviews/${id}`, { body: { status } }),
  adminActivity: () => request<{ items: AuditEntry[] }>("GET", "/admin/activity"),
};
