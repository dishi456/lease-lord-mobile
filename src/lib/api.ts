import * as SecureStore from "expo-secure-store";
import { API_V1, API_BASE } from "./config";
import { setCurrency } from "./currency";

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

// Multipart upload to the shared /api/upload endpoint (Bearer-authed). `purpose`
// + `refId` tell the server what the file is (property photo, lease contract…).
export async function uploadFile(
  purpose: string,
  refId: string,
  asset: { uri: string; fileName?: string | null; mimeType?: string | null },
): Promise<{ id: string; url: string }> {
  const form = new FormData();
  const name = asset.fileName || `upload-${Date.now()}.jpg`;
  // React Native FormData file shape.
  form.append("file", { uri: asset.uri, name, type: asset.mimeType || "image/jpeg" } as any);
  form.append("purpose", purpose);
  form.append("refId", refId);
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

// Convenience wrappers for the two things the app uploads.
export const uploadPropertyPhoto = (propertyId: string, asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
  uploadFile("property-photo", propertyId, asset);
export const uploadLeaseContract = (leaseId: string, asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
  uploadFile("lease-contract", leaseId, asset);
export const uploadAvatar = (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
  uploadFile("avatar", "me", asset);
export const uploadTenantDocument = (label: string, asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
  uploadFile("profile-id", label, asset);
export const uploadMarketplacePhoto = (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
  uploadFile("marketplace-photo", "me", asset);
export const uploadPaymentProof = (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
  uploadFile("payment-proof", "me", asset);
export const uploadChatAttachment = (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) =>
  uploadFile("chat-attachment", "me", asset);

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
  username: string | null; currency: string | null;
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
export type Payment = { id: string; amount: number; method: string; status: string; paidAt: string | null; receiptUrl: string | null; receiptNumber: string | null; reference: string | null; proofUrl: string | null; createdAt: string; invoiceId: string; periodMonth: string | null; property: string | null };
export type Maintenance = { id: string; title: string; status: string; priority: string; images: string[]; createdAt: string };
export type MaintenanceDetail = Maintenance & { description: string; assignedTo: string | null; updatedAt: string; property: { id: string; name: string; address: string } };
export type Complaint = { id: string; subject: string; status: string; createdAt: string };
export type ComplaintDetail = Complaint & { description: string; updatedAt: string; property: { id: string; name: string } | null; messages: { id: string; body: string; authorId: string; mine: boolean; createdAt: string }[] };
export type Notification = { id: string; type: string; title: string; body: string | null; link: string | null; read: boolean; createdAt: string };
export type Listing = { id: string; ref: string | null; name: string; address: string; city: string; type: string; rent: number; securityDeposit: number; rooms: number | null; bathrooms: number | null; areaSqft: number | null; furnishing: string; amenities: string[]; available: boolean; verified: boolean; listedAt: string; photo: string | null; distanceKm?: number };
export type PublicReview = { id: string; stars: number; feedback: string | null; createdAt: string; by: string };
export type ListingDetail = Omit<Listing, "city" | "photo" | "listedAt"> & { description: string | null; maintenanceMonthly: number | null; balconies: number | null; floor: number | null; totalFloors: number | null; carpetAreaSqft: number | null; facing: string | null; bachelorsAllowed: boolean; projectName: string | null; parkingSpots: number | null; listedBy: string; hasLobby: boolean; hasParking: boolean; hasLift: boolean; powerBackup: boolean; availability: string; photos: string[]; landlord: { name: string; verified: boolean; rating: number | null; ratingCount: number }; reviews: PublicReview[] };
export type Enquiry = { token: string; createdAt: string; updatedAt: string; unread: number; lastMessage: { body: string; fromGuest: boolean; createdAt: string } | null; property: { id: string; ref: string | null; name: string; address: string; photo: string | null } };
export type TenantProfile = Me & {
  governmentId: string | null; emergencyContact: string | null;
  verificationStatus: "VERIFIED" | "PENDING" | "NOT_VERIFIED"; completion: number;
  prefCountry: string | null; prefState: string | null; prefCity: string | null;
  documents: { id: string; type: string; fileName: string | null; label: string | null; url: string; createdAt: string }[];
};
export type PendingReview = { leaseId: string; endDate: string; status: string; property: { name: string; address: string }; landlordName: string };
export type RentalRecord = {
  id: string; status: string; monthlyRent: number; securityDeposit: number; startDate: string; endDate: string; noticeEffectiveDate: string | null;
  property: { id: string; name: string; address: string; photo: string | null };
  landlord: { id: string; name: string; avatarUrl: string | null };
  reviewFromLandlord: { stars: number; feedback: string | null; recommend: boolean } | null;
  reviewFromTenant: { stars: number; feedback: string | null; recommend: boolean } | null;
};
export type TenantDoc = { id: string; type: string; numberMasked: string | null; expiryDate: string | null; verified: boolean; verificationStatus: string; fileName: string | null; isImage: boolean; url: string; createdAt: string };
export type MktSeller = { id: string; name: string; avatarUrl: string | null; verified: boolean };
export type MktListing = { id: string; title: string; description: string | null; category: string; condition: string; price: number; currency: string; location: string | null; images: string[]; status: string; createdAt: string; seller: MktSeller; favorited: boolean; favorites: number; mine: boolean };
export type MktDetail = Omit<MktListing, "seller"> & { seller: MktSeller & { phone: string | null; email: string; city: string | null; listings: number } };
export type NewListing = { title: string; description?: string; category: string; condition: string; price: number; location?: string; images: string[] };
export type ReviewCriteria = { propertyQuality: number; maintenanceSupport: number; communication: number; transparency: number; overall: number };

// ---- Landlord shapes -------------------------------------------------------
export type LandlordDashboard = {
  properties: number; occupied: number; vacant: number; tenants: number; expiringSoon: number;
  monthlyCollection: number; pendingDue: number; openMaintenance: number; openComplaints: number;
  rating: number | null; unreadInquiries: number;
};
export type LProperty = { id: string; ref: string | null; name: string; address: string; type: string; rent: number; availability: string; approved: boolean; verified: boolean; listedPublic: boolean; photo: string | null; tenants: string[] };
export type LPropertyDetail = {
  id: string; ref: string | null; name: string; type: string; address: string; description: string | null;
  rentAmount: number; securityDeposit: number; rooms: number | null; bathrooms: number | null; areaSqft: number | null;
  furnishing: string; availability: string; listedPublic: boolean; approved: boolean; verified: boolean;
  amenities: string[]; photos: string[]; [k: string]: unknown;
};
export type LTenant = { id: string; fullName: string; email: string; phone: string | null; status: string; verified: boolean; property: string | null };
export type LLease = { id: string; status: string; monthlyRent: number; startDate: string; endDate: string; property: string; tenant: string };
export type LLeaseDetail = {
  id: string; status: string; monthlyRent: number; securityDeposit: number; maintenanceFee: number | null;
  startDate: string; endDate: string; terms: string | null; signedContractUrl: string | null; noticePeriodDays: number;
  property: { id: string; name: string; address: string } | null;
  tenant: { id: string; fullName: string; email: string; phone: string | null } | null;
  invoices: { id: string; periodMonth: string; amount: number; dueDate: string; status: string }[];
};
export type LPaymentRow = { id: string; amount: number; method: string; status: string; proofUrl: string | null; reference: string | null; receiptNumber: string | null; paidAt: string | null };
export type LInvoice = { id: string; periodMonth: string; amount: number; amountPaid: number; balance: number; dueDate: string; status: string; hasAgreement?: boolean; property: string; tenant: string; payments?: LPaymentRow[] };
export type LMaintenance = { id: string; title: string; status: string; priority: string; assignedTo: string | null; images: string[]; createdAt: string; property: string; tenant: string };
export type LComplaint = { id: string; subject: string; status: string; createdAt: string; property: string | null; tenant: string };
export type LInquiry = { id: string; token: string; guestName: string; guestPhone: string; property: string; updatedAt: string; unread: number; lastMessage: { body: string; fromGuest: boolean } | null };
export type LPendingReview = { leaseId: string; endDate: string; property: string; tenant: string };
export type TenantCriteria = { rentDiscipline: number; propertyMaintenance: number; communication: number; ruleCompliance: number; conduct: number };
// A normalized rating row for the in-app "reviews I gave / received" lists.
export type ReviewView = { id: string; stars: number; feedback: string | null; recommend: boolean; createdAt: string; counterparty: string; property: string };
export type ReviewBundle = { given: ReviewView[]; received: ReviewView[] };
// Full tenant detail a landlord can open from the tenants list.
export type LTenantHistoryLease = { id: string; status: string; monthlyRent: number; startDate: string; endDate: string; property: { id: string; name: string; address: string; city: string | null } | null; landlord: { id: string; fullName: string } | null; mine: boolean };
export type LTenantReview = { id: string; stars: number; feedback: string | null; recommend: boolean; by: string; property: string | null; createdAt: string };
export type LTenantDetail = {
  tenant: { id: string; fullName: string; email: string; phone: string | null; verified: boolean; governmentId: string | null; emergencyContact: string | null; avatarUrl: string | null; username: string | null } | null;
  rating: number | null; ratingCount: number;
  blacklist: { reason: string; createdAt: string } | null;
  leases: LTenantHistoryLease[];
  reviews: LTenantReview[];
};
export type BlacklistEntry = { tenantId: string; reason: string; createdAt: string; tenant: { id: string; fullName: string; email: string; avatarUrl: string | null } };
// A rental application = a prospective tenant requesting a property. The landlord
// approves/rejects (mirrors the website's /landlord/applications flow).
export type LApplication = { id: string; fullName: string; email: string; phone: string | null; message: string | null; status: string; createdAt: string; property: string };
// A property visit (tour) request a prospective tenant booked.
export type LVisit = { id: string; fullName: string; email: string; phone: string | null; message: string | null; status: string; preferredAt: string | null; createdAt: string; property: string };
export type NewProperty = {
  name: string; type: "APARTMENT" | "HOUSE" | "ROOM" | "COMMERCIAL" | "LAND" | "STUDENT_HOUSING" | "OTHER"; address: string;
  rentAmount: number; securityDeposit?: number; rooms?: number; bathrooms?: number; areaSqft?: number;
  furnishing?: "UNFURNISHED" | "SEMI_FURNISHED" | "FURNISHED"; description?: string;
  country?: string; state?: string; city?: string; postalCode?: string; latitude?: number; longitude?: number;
  details?: Record<string, string | number | boolean | null>;
};

export type LandlordProfile = {
  id: string; fullName: string; email: string; phone: string | null; avatarUrl: string | null;
  username: string | null; verified: boolean; status: string;
  verificationStatus: "VERIFIED" | "PENDING" | "NOT_VERIFIED"; completion: number;
  stats: { properties: number; tenants: number; rating: number | null; ratingCount: number };
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
export type AdminLease = { id: string; status: string; monthlyRent: number; startDate: string; endDate: string; property: string; landlord: string; tenant: string };
export type AdminMaintenance = { id: string; title: string; priority: string; status: string; images: string[]; property: string; landlord: string; tenant: string; createdAt: string };
export type InquiryMsg = { id: string; fromGuest: boolean; body: string; createdAt: string };
// ---- Property chat (per-lease) ----
export type ChatParty = { id: string; name: string; avatarUrl: string | null; lastSeenAt: string | null };
export type ChatConversation = { leaseId: string; leaseNumber: string; leaseStatus: string; rent: number; property: { id: string; name: string; photo: string | null }; other: ChatParty; lastMessage: { body: string | null; attachmentType: string | null; createdAt: string; mine: boolean } | null; unread: number };
export type ChatMessage = { id: string; body: string | null; attachmentUrl: string | null; attachmentType: string | null; starred: boolean; readAt: string | null; createdAt: string; senderId: string; mine: boolean };
export type ChatHeader = { leaseId: string; leaseNumber: string; leaseStatus: string; rent: number; property: { id: string; name: string; photo: string | null }; tenantName: string; landlordName: string; other: ChatParty; signedContractUrl: string | null };

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
// Flatten a backend rating row (rater/ratee objects, lease.property.name) into a
// flat ReviewView. `who` is the side that is the *other* party for this list.
const mapReview = (r: any, who: "rater" | "ratee") => ({
  id: r.id,
  stars: r.stars ?? 0,
  feedback: r.feedback ?? null,
  recommend: !!r.recommend,
  createdAt: r.createdAt ?? "",
  counterparty: tName(r[who]),
  property: r.lease?.property?.name ?? pName(r.property) ?? "",
});

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
  me: () =>
    request<any>("GET", "/me").then((d) => {
      const u = unwrap<Me>(d, "user");
      setCurrency(u?.currency); // keep app-wide currency in sync on every load
      return u;
    }),

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
  maintenanceDetail: (id: string) =>
    request<any>("GET", `/tenant/maintenance/${id}`).then((d) => {
      const x = unwrap<any>(d, "request", "maintenance");
      return { ...x, images: Array.isArray(x.images) ? x.images : [] } as MaintenanceDetail;
    }),
  createMaintenance: (b: { title: string; description: string; priority: string; imageUrls?: string[] }) =>
    request<{ id: string }>("POST", "/tenant/maintenance", { body: b }),
  complaints: () => request<any>("GET", "/tenant/complaints").then((d) => ({ items: rows<Complaint>(d, "items", "complaints") })),
  complaintDetail: (id: string) =>
    request<any>("GET", `/tenant/complaints/${id}`).then((d) => {
      const x = unwrap<any>(d, "complaint");
      return { ...x, messages: Array.isArray(x.messages) ? x.messages : [] } as ComplaintDetail;
    }),
  createComplaint: (b: { subject: string; description: string }) =>
    request<{ id: string }>("POST", "/tenant/complaints", { body: b }),
  replyComplaint: (id: string, body: string) =>
    request<{ id: string }>("POST", `/tenant/complaints/${id}/messages`, { body: { body } }),
  tenantProfile: () =>
    request<any>("GET", "/tenant/profile").then((d) => {
      const p = d.profile ?? d;
      return { ...p, documents: d.documents ?? p.documents ?? [] } as TenantProfile;
    }),
  updateTenantProfile: (b: Partial<{ fullName: string; username: string; phone: string; emergencyContact: string; governmentId: string; avatarUrl: string; currency: string; prefCountry: string; prefState: string; prefCity: string }>) =>
    request<{ ok: true; profile?: any }>("PATCH", "/tenant/profile", { body: b }).then((r) => {
      if (b.currency) setCurrency(b.currency);
      return r;
    }),
  // Live sends property/landlord as objects + no flat landlordName; normalize.
  // Rental history (all leases + two-way reviews).
  tenantRentals: () => request<any>("GET", "/tenant/rentals").then((d) => ({ items: rows<RentalRecord>(d, "rentals", "items") })),
  // Identity documents.
  tenantDocuments: () => request<any>("GET", "/tenant/documents").then((d) => ({ items: rows<TenantDoc>(d, "documents", "items") })),
  updateTenantDocument: (id: string, b: { label?: string; docNumber?: string; expiryDate?: string }) =>
    request<{ ok: true }>("PATCH", `/tenant/documents/${id}`, { body: b }),
  deleteTenantDocument: (id: string) => request<{ ok: true }>("DELETE", `/tenant/documents/${id}`),

  pendingReviews: () =>
    request<any>("GET", "/tenant/reviews/pending").then((d) => ({
      items: rows<any>(d, "items", "leases").map((l) => ({
        leaseId: l.leaseId ?? l.id,
        endDate: l.endDate ?? "",
        status: l.status ?? "",
        property: { name: l.property?.name ?? pName(l.property), address: l.property?.address ?? "" },
        landlordName: l.landlordName ?? l.landlord?.fullName ?? l.landlord?.name ?? "",
        existingRating: l.existingRating ?? null,
      })) as (PendingReview & { existingRating: unknown })[],
    })),
  submitReview: (b: { leaseId: string; stars: number; criteria: ReviewCriteria; feedback?: string; recommend?: boolean }) =>
    request<{ ok: true }>("POST", "/tenant/reviews", { body: b }),
  // Reviews the tenant gave + received (received = public, status VISIBLE).
  tenantReviews: () =>
    request<any>("GET", "/tenant/reviews").then((d) => ({
      given: (Array.isArray(d?.given) ? d.given : []).map((r: any) => mapReview(r, "ratee")),
      received: (Array.isArray(d?.received) ? d.received : []).map((r: any) => mapReview(r, "rater")),
    } as ReviewBundle)),

  // shared
  notifications: () =>
    request<any>("GET", "/notifications").then((d) => ({ items: rows<Notification>(d, "items", "notifications"), unread: d.unread ?? 0 })),
  markRead: (id?: string) => request<{ ok: true }>("POST", "/notifications/read", { body: id ? { id } : {} }),

  // user / public — `pages`/`totalPages` both accepted for pagination.
  listings: (q: Record<string, string | number | undefined>) =>
    request<any>("GET", "/listings", { auth: false, query: q }).then((d) => ({
      // The backend returns `address` but not `city`; fall back so cards aren't blank.
      items: rows<any>(d, "items").map((it) => ({ ...it, city: it.city ?? it.address ?? "" })) as Listing[],
      total: d.total ?? 0, page: d.page ?? 1, pageSize: d.pageSize ?? 20,
      pages: d.pages ?? d.totalPages, totalPages: d.totalPages ?? d.pages,
    })),
  listingsNearby: (lat: number, lng: number, opts?: { radius?: number; q?: string }) =>
    request<any>("GET", "/listings/nearby", { auth: false, query: { lat, lng, radius: opts?.radius, q: opts?.q } }).then((d) => ({
      items: rows<any>(d, "items").map((it) => ({ ...it, city: it.city || it.address || "" })) as Listing[],
      total: d.total ?? 0,
    })),
  listingDetail: (idOrRef: string) =>
    request<any>("GET", `/listings/${idOrRef}`, { auth: false }).then((d) => {
      const x = unwrap<any>(d, "listing", "property");
      const l = x.landlord ?? {};
      return {
        ...x,
        photos: Array.isArray(x.photos) ? x.photos : [],
        amenities: Array.isArray(x.amenities) ? x.amenities : [],
        // Live sends landlord.fullName; the screen reads landlord.name.
        landlord: { name: l.name ?? l.fullName ?? "", verified: !!l.verified, rating: l.rating ?? null, ratingCount: l.ratingCount ?? 0 },
        reviews: Array.isArray(x.reviews) ? x.reviews : [],
      } as ListingDetail;
    }),
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
  landlordProperties: () => request<any>("GET", "/landlord/properties").then((d) => ({ items: rows<any>(d, "items", "properties").map((p) => ({ ...p, tenants: Array.isArray(p.tenants) ? p.tenants : [] })) as LProperty[] })),
  landlordTenants: () => request<any>("GET", "/landlord/tenants").then((d) => ({ items: rows<LTenant>(d, "items", "tenants") })),
  landlordLeases: () => request<any>("GET", "/landlord/leases").then((d) => ({ items: rows<any>(d, "items", "leases").map((l) => ({ ...l, property: pName(l.property), tenant: tName(l.tenant) })) as LLease[] })),
  // Create a lease for a managed tenant on one of the landlord's properties.
  landlordCreateLease: (b: { tenantId: string; propertyId: string; monthlyRent: number; securityDeposit?: number; maintenanceFee?: number; startDate: string; endDate: string; noticePeriodDays?: number; terms?: string }) =>
    request<{ ok: true; id: string }>("POST", "/landlord/leases", { body: b }),
  landlordLeaseDetail: (id: string) =>
    request<any>("GET", `/landlord/leases/${id}`).then((d) => {
      const l = unwrap<any>(d, "lease");
      return { ...l, property: l.property ?? null, tenant: l.tenant ?? null, invoices: Array.isArray(l.invoices) ? l.invoices : [] } as LLeaseDetail;
    }),
  // Live exposes rent collection at `/landlord/rent` → `{ invoices }` (no kpis).
  landlordInvoices: () =>
    request<any>("GET", "/landlord/rent").then((d) => ({
      kpis: d.kpis ?? { collectedThisMonth: 0, pending: 0, overdue: 0 },
      items: rows<any>(d, "items", "invoices").map((i) => ({ ...i, property: pName(i.property), tenant: tName(i.tenant) })) as LInvoice[],
    })),
  // Recording a manual rent payment: live uses POST /landlord/rent/record.
  landlordPayInvoice: (id: string, method: string) => request<{ ok: true }>("POST", "/landlord/rent/record", { body: { invoiceId: id, method } }),
  landlordRecordPayment: (b: { invoiceId: string; amount?: number; method: string; reference?: string; notes?: string; proofUrl?: string }) =>
    request<{ ok: true; paymentId: string; receiptNumber: string; status: string; balance: number }>("POST", "/landlord/rent/record", { body: b }),
  // Confirm / reject a tenant-submitted payment proof.
  landlordConfirmPayment: (paymentId: string, action: "confirm" | "reject") =>
    request<{ ok: true; receiptNumber?: string; status?: string }>("POST", "/landlord/rent/confirm", { body: { paymentId, action } }),
  // Tenant submits a payment proof (creates a PENDING payment for confirmation).
  tenantSubmitProof: (b: { invoiceId: string; method: string; reference?: string; proofUrl: string }) =>
    request<{ ok: true; paymentId: string }>("POST", "/tenant/payments/proof", { body: b }),
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
  landlordPropertyDetail: (id: string) =>
    request<any>("GET", `/landlord/properties/${id}`).then((d) => {
      const x = unwrap<any>(d, "property");
      return { ...x, photos: Array.isArray(x.photos) ? x.photos : [], amenities: Array.isArray(x.amenities) ? x.amenities : [] } as LPropertyDetail;
    }),
  landlordUpdateProperty: (id: string, b: Record<string, unknown>) => request<{ ok: true }>("PATCH", `/landlord/properties/${id}`, { body: b }),
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
  // Live sends tenant/property as objects; flatten to strings for the screen.
  landlordPendingReviews: () =>
    request<any>("GET", "/landlord/reviews/pending").then((d) => ({
      items: rows<any>(d, "items", "leases", "pending").map((l) => ({
        leaseId: l.leaseId ?? l.id,
        endDate: l.endDate ?? "",
        property: pName(l.property),
        tenant: tName(l.tenant),
        existingRating: l.existingRating ?? null,
      })) as (LPendingReview & { existingRating: unknown })[],
    })),
  landlordRateTenant: (b: { leaseId: string; stars: number; criteria: TenantCriteria; feedback?: string; recommend?: boolean }) => request<{ ok: true }>("POST", "/landlord/reviews", { body: b }),
  // Reviews the landlord gave + received (received = public, status VISIBLE).
  landlordReviews: () =>
    request<any>("GET", "/landlord/reviews").then((d) => ({
      given: (Array.isArray(d?.given) ? d.given : []).map((r: any) => mapReview(r, "ratee")),
      received: (Array.isArray(d?.received) ? d.received : []).map((r: any) => mapReview(r, "rater")),
    } as ReviewBundle)),
  // Full tenant detail (profile + leases) — landlord taps a tenant in the list.
  landlordProfile: () => request<any>("GET", "/landlord/profile").then((d) => d.profile as LandlordProfile),
  updateLandlordProfile: (b: Partial<{ fullName: string; username: string; phone: string; avatarUrl: string }>) =>
    request<{ ok: true; profile?: any }>("PATCH", "/landlord/profile", { body: b }),
  landlordTenant: (id: string) =>
    request<any>("GET", `/landlord/tenants/${id}`).then((d) => ({
      tenant: d.tenant ?? null,
      rating: d.rating ?? null,
      ratingCount: d.ratingCount ?? 0,
      blacklist: d.blacklist ?? null,
      leases: rows<any>(d, "leases").map((l) => ({ ...l, monthlyRent: Number(l.monthlyRent ?? 0), property: l.property ?? null, landlord: l.landlord ?? null })),
      reviews: rows<any>(d, "reviews"),
    } as LTenantDetail)),
  // Blacklist
  landlordBlacklist: () => request<any>("GET", "/landlord/blacklist").then((d) => ({ items: rows<BlacklistEntry>(d, "items") })),
  landlordSetBlacklist: (tenantId: string, reason: string) => request<{ ok: true }>("POST", "/landlord/blacklist", { body: { tenantId, reason } }),
  landlordRemoveBlacklist: (tenantId: string) => request<{ ok: true }>("DELETE", `/landlord/blacklist/${tenantId}`),

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
  adminLeases: () =>
    request<any>("GET", "/admin/leases").then((d) => ({
      items: rows<any>(d, "items", "leases").map((l) => ({ ...l, property: pName(l.property), landlord: tName(l.landlord), tenant: tName(l.tenant) })) as AdminLease[],
    })),
  adminMaintenance: (status?: string) =>
    request<any>("GET", "/admin/maintenance", { query: { status } }).then((d) => ({
      items: rows<any>(d, "items", "requests", "maintenance").map((m) => ({ ...m, property: pName(m.property), landlord: tName(m.landlord), tenant: tName(m.tenant) })) as AdminMaintenance[],
    })),

  // landlord inquiry chat
  landlordInquiryThread: (id: string) => request<any>("GET", `/landlord/inquiries/${id}`).then((d) => ({ messages: rows<InquiryMsg>(d, "messages", "items") })),
  landlordReplyInquiry: (id: string, body: string) => request<{ ok: true }>("POST", `/landlord/inquiries/${id}`, { body: { body } }),

  // marketplace
  marketplaceListings: (q: Record<string, string | number | undefined>) =>
    request<any>("GET", "/marketplace/listings", { query: q }).then((d) => ({ items: rows<MktListing>(d, "listings", "items") })),
  marketplaceDetail: (id: string) => request<any>("GET", `/marketplace/listings/${id}`).then((d) => unwrap<MktDetail>(d, "listing")),
  marketplaceCreate: (b: NewListing) => request<{ ok: true; id: string }>("POST", "/marketplace/listings", { body: b }),
  marketplaceUpdate: (id: string, b: Partial<NewListing & { status: string }>) => request<{ ok: true }>("PATCH", `/marketplace/listings/${id}`, { body: b }),
  marketplaceDelete: (id: string) => request<{ ok: true }>("DELETE", `/marketplace/listings/${id}`),
  marketplaceFavorite: (id: string, on: boolean) => request<{ ok: true; favorited: boolean }>(on ? "POST" : "DELETE", `/marketplace/favorites/${id}`),

  // property chat (per-lease)
  chatConversations: () => request<any>("GET", "/chat/conversations").then((d) => ({ items: rows<ChatConversation>(d, "conversations", "items"), totalUnread: d.totalUnread ?? 0 })),
  chatThread: (leaseId: string) => request<any>("GET", `/chat/${leaseId}`).then((d) => ({ conversation: d.conversation as ChatHeader, messages: rows<ChatMessage>(d, "messages") })),
  chatSend: (leaseId: string, b: { body?: string; attachmentUrl?: string; attachmentType?: string }) => request<{ ok: true; message: ChatMessage }>("POST", `/chat/${leaseId}`, { body: b }),
};
