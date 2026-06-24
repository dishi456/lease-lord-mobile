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

// Multipart upload to the shared /api/upload endpoint (Bearer-authed). Used to
// attach property photos (purpose "property-photo", refId = propertyId).
export async function uploadPropertyPhoto(
  propertyId: string,
  asset: { uri: string; fileName?: string | null; mimeType?: string | null },
): Promise<{ id: string; url: string }> {
  const form = new FormData();
  const name = asset.fileName || `photo-${Date.now()}.jpg`;
  // React Native FormData file shape.
  form.append("file", { uri: asset.uri, name, type: asset.mimeType || "image/jpeg" } as any);
  form.append("purpose", "property-photo");
  form.append("refId", propertyId);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: form,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    throw new ApiError(aborted ? "Photo upload timed out." : "Photo upload failed — network error.", 0);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    const msg = data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : `Upload failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as { id: string; url: string };
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

  // Hard timeout so a stalled request can never leave a screen spinning forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: controller.signal });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    throw new ApiError(aborted ? "Request timed out — please try again." : "Network error — check your connection and the API URL.", 0);
  } finally {
    clearTimeout(timer);
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
// A rental application = a prospective tenant requesting a property. The landlord
// approves/rejects (mirrors the website's /landlord/applications flow).
export type LApplication = { id: string; fullName: string; email: string; phone: string | null; message: string | null; status: string; createdAt: string; property: string };
// A property visit (tour) request a prospective tenant booked.
export type LVisit = { id: string; fullName: string; email: string; phone: string | null; message: string | null; status: string; preferredAt: string | null; createdAt: string; property: string };
export type NewProperty = {
  name: string; type: "APARTMENT" | "HOUSE" | "ROOM" | "COMMERCIAL" | "OTHER"; address: string;
  rentAmount: number; securityDeposit?: number; rooms?: number; bathrooms?: number; areaSqft?: number;
  furnishing?: "UNFURNISHED" | "SEMI_FURNISHED" | "FURNISHED"; description?: string;
};

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

// ---- Live-backend normalization -------------------------------------------
// The live prebuildapps.com backend wraps lists in per-resource envelopes
// (`{invoices}`, `{requests}`, `{tenants}`, `{users}`, `{ratings}`, `{activity}`,
// `{profile,documents}`, …) and `/me` in `{user}`, whereas the screens expect a
// flat `{items}` shape. We normalize here so screens stay untouched. Each helper
// also accepts the older `{items}` form, so the app works against either backend.
const OK = { ok: true } as const;
function rows<T = any>(d: any, ...keys: string[]): T[] {
  if (Array.isArray(d)) return d as T[];
  for (const k of keys) if (Array.isArray(d?.[k])) return d[k] as T[];
  return [];
}
function unwrap<T = any>(d: any, ...keys: string[]): T {
  for (const k of keys) if (d && typeof d === "object" && d[k] != null) return d[k] as T;
  return d as T;
}
// The live backend sends `property`/`tenant` as objects ({id,name}/{id,fullName});
// screens render them as strings. Flatten to a name so React never gets an object.
const pName = (p: any): string => (typeof p === "string" ? p : p?.name ?? "");
const tName = (t: any): string => (typeof t === "string" ? t : t?.fullName ?? t?.name ?? "");

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
  // Live returns `{ user: {...} }`; older backend returns the user flat.
  me: () => request<any>("GET", "/me").then((d) => unwrap<Me>(d, "user")),

  // OTP (reused existing endpoints, not under /v1)
  sendOtp: (email: string, purpose: "register" | "chat") =>
    request<{ ok: boolean }>("POST", `${API_BASE}/api/otp/send`, { auth: false, body: { email, purpose } }),
  verifyOtp: (email: string, code: string, purpose: "register" | "chat") =>
    request<{ ok: boolean; verifyToken: string }>("POST", `${API_BASE}/api/otp/verify`, { auth: false, body: { email, code, purpose } }),

  // tenant
  dashboard: () =>
    request<any>("GET", "/tenant/dashboard").then((d) => ({
      lease: d.lease
        ? { ...d.lease, property: typeof d.lease.property === "string" ? { name: d.lease.property, address: "" } : d.lease.property ?? { name: "", address: "" } }
        : null,
      nextInvoice: d.nextInvoice ?? null,
      openMaintenanceCount: d.openMaintenanceCount ?? d.openMaintenance ?? 0,
      unreadNotifications: d.unreadNotifications ?? 0,
    } as Dashboard)),
  lease: () =>
    request<any>("GET", "/tenant/lease").then((d) => {
      const l = d.lease ?? d.activeLease ?? null;
      // backend sends landlord as {fullName,...}; app reads {name, phone}.
      if (l && l.landlord) l.landlord = { name: l.landlord.name ?? l.landlord.fullName ?? "", phone: l.landlord.phone ?? null };
      return { lease: l as Lease | null };
    }),
  giveNotice: () => request<{ ok: true; noticeEffectiveDate: string }>("POST", "/tenant/lease/notice", { body: {} }),
  invoices: () => request<any>("GET", "/tenant/invoices").then((d) => ({ items: rows<Invoice>(d, "items", "invoices") })),
  payments: () => request<any>("GET", "/tenant/payments").then((d) => ({ items: rows<Payment>(d, "items", "payments") })),
  maintenance: () => request<any>("GET", "/tenant/maintenance").then((d) => ({ items: rows<Maintenance>(d, "items", "requests") })),
  maintenanceDetail: (id: string) => request<any>("GET", `/tenant/maintenance/${id}`).then((d) => unwrap<MaintenanceDetail>(d, "request", "maintenance")),
  createMaintenance: (b: { title: string; description: string; priority: string; imageUrls?: string[] }) =>
    request<{ id: string }>("POST", "/tenant/maintenance", { body: b }),
  complaints: () => request<any>("GET", "/tenant/complaints").then((d) => ({ items: rows<Complaint>(d, "items", "complaints") })),
  complaintDetail: (id: string) => request<any>("GET", `/tenant/complaints/${id}`).then((d) => unwrap<ComplaintDetail>(d, "complaint")),
  createComplaint: (b: { subject: string; description: string }) =>
    request<{ id: string }>("POST", "/tenant/complaints", { body: b }),
  replyComplaint: (id: string, body: string) =>
    request<{ id: string }>("POST", `/tenant/complaints/${id}/messages`, { body: { body } }),
  tenantProfile: () =>
    request<any>("GET", "/tenant/profile").then((d) => {
      const p = d.profile ?? d;
      return { ...p, documents: d.documents ?? p.documents ?? [] } as TenantProfile;
    }),
  updateTenantProfile: (b: Partial<{ fullName: string; phone: string; emergencyContact: string; avatarUrl: string }>) =>
    request<{ ok: true }>("PATCH", "/tenant/profile", { body: b }),
  pendingReviews: () => request<any>("GET", "/tenant/reviews/pending").then((d) => ({ items: rows<PendingReview>(d, "items", "leases") })),
  submitReview: (b: { leaseId: string; stars: number; criteria: ReviewCriteria; feedback?: string; recommend?: boolean }) =>
    request<{ ok: true }>("POST", "/tenant/reviews", { body: b }),

  // shared
  notifications: () =>
    request<any>("GET", "/notifications").then((d) => ({ items: rows<Notification>(d, "items", "notifications"), unread: d.unread ?? 0 })),
  markRead: (id?: string) => request<{ ok: true }>("POST", "/notifications/read", { body: id ? { id } : {} }),

  // user / public — `pages`/`totalPages` both accepted for pagination.
  listings: (q: Record<string, string | number | undefined>) =>
    request<{ items: Listing[]; total: number; page: number; pageSize: number; pages?: number; totalPages?: number }>("GET", "/listings", { auth: false, query: q }),
  listingDetail: (idOrRef: string) => request<any>("GET", `/listings/${idOrRef}`, { auth: false }).then((d) => unwrap<ListingDetail>(d, "listing", "property")),
  enquiries: () => request<any>("GET", "/account/enquiries").then((d) => ({ items: rows<Enquiry>(d, "items", "inquiries", "enquiries") })),
  updateAccount: (b: Partial<{ fullName: string; phone: string; avatarUrl: string }>) =>
    request<{ ok: true }>("PATCH", "/account/profile", { body: b }),

  // landlord
  landlordDashboard: () =>
    request<any>("GET", "/landlord/dashboard").then((d) => ({
      properties: d.properties ?? 0,
      occupied: d.occupied ?? 0,
      vacant: d.vacant ?? 0,
      tenants: d.tenants ?? 0,
      expiringSoon: d.expiringSoon ?? 0,
      monthlyCollection: d.monthlyCollection ?? 0,
      pendingDue: d.pendingDue ?? d.pendingRent ?? 0,
      openMaintenance: d.openMaintenance ?? 0,
      openComplaints: d.openComplaints ?? 0,
      rating: d.rating ?? null,
      unreadInquiries: d.unreadInquiries ?? d.unreadNotifications ?? 0,
      pendingApplications: d.pendingApplications ?? 0,
    } as LandlordDashboard & { pendingApplications: number })),
  landlordProperties: () => request<any>("GET", "/landlord/properties").then((d) => ({ items: rows<LProperty>(d, "items", "properties") })),
  landlordTenants: () => request<any>("GET", "/landlord/tenants").then((d) => ({ items: rows<LTenant>(d, "items", "tenants") })),
  landlordLeases: () => request<any>("GET", "/landlord/leases").then((d) => ({ items: rows<any>(d, "items", "leases").map((l) => ({ ...l, property: pName(l.property), tenant: tName(l.tenant) })) as LLease[] })),
  // Live exposes rent collection at `/landlord/rent` → `{ invoices }` (no kpis).
  landlordInvoices: () =>
    request<any>("GET", "/landlord/rent").then((d) => ({
      kpis: d.kpis ?? { collectedThisMonth: 0, pending: 0, overdue: 0 },
      items: rows<any>(d, "items", "invoices").map((i) => ({ ...i, property: pName(i.property), tenant: tName(i.tenant) })) as LInvoice[],
    })),
  // Recording a manual rent payment: live uses POST /landlord/rent/record.
  landlordPayInvoice: (id: string, method: string) => request<{ ok: true }>("POST", "/landlord/rent/record", { body: { invoiceId: id, method } }),
  landlordRemindInvoice: (id: string) => request<{ ok: true }>("POST", "/landlord/rent/remind", { body: { invoiceId: id } }),
  landlordMaintenance: (status?: string) => request<any>("GET", "/landlord/maintenance", { query: { status } }).then((d) => ({ items: rows<any>(d, "items", "requests").map((m) => ({ ...m, property: pName(m.property), tenant: tName(m.tenant) })) as LMaintenance[] })),
  // Live updates a request via PATCH /landlord/maintenance/{id}.
  landlordUpdateMaintenance: (id: string, b: { status?: string; assignedTo?: string }) => request<{ ok: true }>("PATCH", `/landlord/maintenance/${id}`, { body: b }),
  landlordComplaints: () => request<any>("GET", "/landlord/complaints").then((d) => ({ items: rows<any>(d, "items", "complaints").map((c) => ({ ...c, property: pName(c.property) || null, tenant: tName(c.tenant) })) as LComplaint[] })),
  // Live: status via PATCH /landlord/complaints/{id}; message via POST /{id}/messages.
  landlordRespondComplaint: async (id: string, b: { body?: string; status?: string }) => {
    if (b.body) await request("POST", `/landlord/complaints/${id}/messages`, { body: { body: b.body } });
    if (b.status) await request("PATCH", `/landlord/complaints/${id}`, { body: { status: b.status } });
    return OK;
  },
  landlordInquiries: () => request<any>("GET", "/landlord/inquiries").then((d) => ({ items: rows<any>(d, "items", "inquiries").map((i) => ({ ...i, property: pName(i.property), guestName: i.guestName ?? "" })) as LInquiry[] })),
  // Rental applications (tenant requests): list + approve/reject.
  landlordApplications: () =>
    request<any>("GET", "/landlord/applications").then((d) => ({
      items: rows<any>(d, "items", "applications").map((a) => ({
        id: a.id,
        fullName: a.fullName ?? a.name ?? "",
        email: a.email ?? "",
        phone: a.phone ?? null,
        message: a.message ?? null,
        status: a.status ?? "PENDING",
        createdAt: a.createdAt ?? a.updatedAt ?? "",
        property: typeof a.property === "string" ? a.property : a.property?.name ?? a.propertyName ?? "",
      })) as LApplication[],
    })),
  landlordDecideApplication: (id: string, decision: "APPROVED" | "REJECTED") =>
    request<{ ok: true }>("PATCH", `/landlord/applications/${id}`, { body: { decision } }),
  // Property visit (tour) requests: list + confirm/decline.
  landlordVisits: () =>
    request<any>("GET", "/landlord/visits").then((d) => ({
      items: rows<any>(d, "items", "visits").map((v) => ({
        id: v.id,
        fullName: v.fullName ?? v.name ?? "",
        email: v.email ?? "",
        phone: v.phone ?? null,
        message: v.message ?? null,
        status: v.status ?? "PENDING",
        preferredAt: v.preferredAt ?? null,
        createdAt: v.createdAt ?? v.updatedAt ?? "",
        property: typeof v.property === "string" ? v.property : v.property?.name ?? v.propertyName ?? "",
      })) as LVisit[],
    })),
  landlordDecideVisit: (id: string, action: "confirm" | "decline" | "complete" | "cancel") =>
    request<{ ok: true }>("PATCH", `/landlord/visits/${id}`, { body: { action } }),
  // List a new property (matches the live POST /landlord/properties schema).
  landlordCreateProperty: (b: NewProperty) => request<{ ok: true; id: string }>("POST", "/landlord/properties", { body: b }),
  // Add a tenant directly (requires the new backend POST /landlord/tenants).
  landlordAddTenant: (b: { fullName: string; email: string; password: string; phone?: string; governmentId?: string }) =>
    request<{ ok: true; id: string }>("POST", "/landlord/tenants", { body: b }),

  // Seeker: apply to rent / book a visit (requires the new backend account endpoints).
  applyToProperty: (propertyId: string, message?: string) =>
    request<{ ok: true; id: string }>("POST", "/account/applications", { body: { propertyId, message } }),
  myApplications: () => request<any>("GET", "/account/applications").then((d) => ({ items: rows<any>(d, "items", "applications") })),
  bookVisit: (propertyId: string, preferredAt: string, message?: string) =>
    request<{ ok: true; id: string }>("POST", "/account/visits", { body: { propertyId, preferredAt, message } }),
  myVisits: () => request<any>("GET", "/account/visits").then((d) => ({ items: rows<any>(d, "items", "visits") })),
  landlordPendingReviews: () => request<any>("GET", "/landlord/reviews/pending").then((d) => ({ items: rows<LPendingReview>(d, "items", "leases", "pending") })),
  landlordRateTenant: (b: { leaseId: string; stars: number; criteria: TenantCriteria; feedback?: string; recommend?: boolean }) => request<{ ok: true }>("POST", "/landlord/reviews", { body: b }),

  // admin
  adminDashboard: () =>
    request<any>("GET", "/admin/dashboard").then((d) => ({
      landlords: d.landlords ?? 0,
      tenants: d.tenants ?? 0,
      users: d.users ?? d.seekers ?? 0,
      properties: d.properties ?? 0,
      occupied: d.occupied ?? 0,
      vacant: d.vacant ?? 0,
      activeLeases: d.activeLeases ?? 0,
      monthlyRevenue: d.monthlyRevenue ?? 0,
      pendingRent: d.pendingRent ?? 0,
      openMaintenance: d.openMaintenance ?? 0,
      openComplaints: d.openComplaints ?? 0,
      pendingLandlords: d.pendingLandlords ?? 0,
      pendingProperties: d.pendingProperties ?? 0,
      flaggedReviews: d.flaggedReviews ?? 0,
    } as AdminDashboard)),
  // Live has no /admin/approvals — compose it from users + properties.
  adminApprovals: async () => {
    const [u, p] = await Promise.all([
      request<any>("GET", "/admin/users", { query: { role: "LANDLORD" } }).catch(() => ({})),
      request<any>("GET", "/admin/properties", { query: { status: "pending" } }).catch(() => ({})),
    ]);
    const users = rows<any>(u, "items", "users").filter((x) => x.role === "LANDLORD" || x.role == null);
    const props = rows<any>(p, "items", "properties");
    return {
      landlords: users
        .filter((x) => x.verified === false || x.status === "PENDING" || x.status === "INACTIVE")
        .map((x) => ({ id: x.id, fullName: x.fullName, email: x.email, phone: x.phone ?? null, createdAt: x.createdAt })),
      properties: props
        .filter((x) => x.approved === false || x.status === "PENDING" || x.approved == null)
        .map((x) => ({
          id: x.id, name: x.name, address: x.address, ref: x.ref ?? null,
          // live returns landlord as an object {id, fullName}; older backend as a string.
          landlord: typeof x.landlord === "string" ? x.landlord : x.landlord?.fullName ?? x.owner ?? "",
          photo: x.photo ?? null, createdAt: x.createdAt,
        })),
    };
  },
  adminApproveProperty: (id: string, approved = true) => request<{ ok: true }>("POST", `/admin/properties/${id}/approve`, { body: { approved } }),
  adminUsers: (q: Record<string, string | number | undefined>) =>
    request<any>("GET", "/admin/users", { query: q }).then((d) => {
      const items = rows<AdminUser>(d, "items", "users");
      return { items, total: d.total ?? items.length, page: d.page ?? 1, pages: d.pages ?? d.totalPages ?? 1 };
    }),
  // Live splits status / verify into separate POST endpoints.
  adminSetUser: async (id: string, b: { status?: string; verified?: boolean }) => {
    if (b.status) await request("POST", `/admin/users/${id}/status`, { body: { status: b.status } });
    if (b.verified !== undefined) await request("POST", `/admin/users/${id}/verify`, { body: { verified: b.verified } });
    return OK;
  },
  adminPayments: (status?: string) =>
    request<any>("GET", "/admin/payments", { query: { status } }).then((d) => ({
      kpis: d.kpis ?? { totalCollected: 0, thisMonth: 0, outstanding: 0, refunded: 0 },
      items: rows<any>(d, "items", "payments").map((p) => ({ ...p, tenant: tName(p.tenant), property: pName(p.property) })) as AdminPayment[],
    })),
  adminReviews: (status?: string) =>
    request<any>("GET", "/admin/reviews", { query: { status } }).then((d) => ({
      items: rows<any>(d, "items", "ratings", "reviews").map((r) => ({
        id: r.id,
        stars: r.stars,
        feedback: r.feedback ?? null,
        direction: r.direction,
        status: r.status,
        createdAt: r.createdAt,
        // backend sends rater/ratee objects; app shows from/to strings.
        from: typeof r.from === "string" ? r.from : tName(r.rater),
        fromRole: r.fromRole ?? (r.direction === "LANDLORD_TO_TENANT" ? "LANDLORD" : "TENANT"),
        to: typeof r.to === "string" ? r.to : tName(r.ratee),
      })) as AdminReview[],
    })),
  // Live moderates via PATCH /admin/reviews/{id}.
  adminModerateReview: (id: string, status: string) => request<{ ok: true }>("PATCH", `/admin/reviews/${id}`, { body: { status } }),
  adminActivity: () =>
    request<any>("GET", "/admin/activity").then((d) => ({
      items: rows<any>(d, "items", "activity").map((a) => ({ ...a, actor: typeof a.actor === "string" ? a.actor : a.actor?.fullName ?? "" })) as AuditEntry[],
    })),
};
