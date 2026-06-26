import type { GuideStep } from "@/components/FeatureGuide";

// 12-step mandatory walkthrough shown to a landlord on first sign-in.
export const LANDLORD_STEPS: GuideStep[] = [
  { icon: "home", color: "#2563EB", title: "Welcome to Lease Lord", body: "Your all-in-one landlord portal — list properties, manage tenants, collect rent and handle requests. This quick guide covers every feature. It only shows once." },
  { icon: "at", color: "#0EA5E9", title: "1. Set your unique user ID", body: "First, create your unique @username on your Profile. It identifies you to tenants and is required before you can add a property or a tenant." },
  { icon: "stats-chart", color: "#2563EB", title: "2. Your dashboard", body: "Your home shows rent collected this month, pending dues, and live stats — properties, occupancy, tenants, expiring leases and open maintenance — at a glance." },
  { icon: "business", color: "#1D4ED8", title: "3. Add properties", body: "Tap Properties → Add. Choose the type (apartment, house, commercial, land, student housing) and add photos and the rent." },
  { icon: "options", color: "#0891B2", title: "4. Smart property details", body: "The form adapts to the property type — bedrooms & furnishing for homes, carpet area & floor for commercial, plot size for land — so each listing captures the right info." },
  { icon: "people", color: "#059669", title: "5. Add & vet tenants", body: "Add tenants directly or accept their requests. Open a tenant to see their full rental history and the reviews other landlords left." },
  { icon: "shield-checkmark", color: "#16A34A", title: "6. Verify tenant documents", body: "Tenants upload their ID documents. Open a tenant → Documents to view each one and mark it Verified — so you know who you're renting to." },
  { icon: "document-text", color: "#0E7490", title: "7. Create lease agreements", body: "Set up a lease for a property + tenant with rent, deposit, dates and notice period. Upload the signed contract too." },
  { icon: "cash", color: "#16A34A", title: "8. Collect & track rent", body: "Record payments with method and amount (partial payments supported), and mark rent paid or unpaid in a tap." },
  { icon: "receipt", color: "#D97706", title: "9. Confirm payment proofs", body: "When a tenant uploads a payment screenshot, you'll see it on the rent screen — review and confirm it to mark the rent received." },
  { icon: "construct", color: "#8B5CF6", title: "10. Handle requests", body: "Maintenance, complaints, enquiries, tenant requests and visit bookings each have their own section so nothing slips through the cracks." },
  { icon: "chatbubbles", color: "#7C3AED", title: "11. Message your tenants", body: "Every active lease has its own WhatsApp-style chat — send messages and photos, with read receipts and unread counts. Find it in the Messages tab." },
  { icon: "star", color: "#F59E0B", title: "12. Reviews & blacklist", body: "Rate your tenants, read the reviews tenants leave about you, and blacklist a tenant with a specific reason if things go wrong." },
];

// 12-step mandatory walkthrough shown to a tenant on first sign-in.
export const TENANT_STEPS: GuideStep[] = [
  { icon: "home", color: "#2563EB", title: "Welcome to Lease Lord", body: "Everything about your rental in one place — your lease, rent, requests and chat with your landlord. This quick guide covers every feature. It only shows once." },
  { icon: "stats-chart", color: "#2563EB", title: "1. Your home", body: "Your dashboard shows your next rent due, your lease summary, recent messages and the latest activity — so you always know what needs attention." },
  { icon: "document-text", color: "#0E7490", title: "2. Your lease", body: "Open the Lease tab for your full terms — rent, deposit, dates and notice period — your landlord's contact, and the signed contract to view any time." },
  { icon: "card", color: "#16A34A", title: "3. Pay your rent", body: "Pay rent from the Pay tab using any supported method. Partial payments are supported, and every payment gets a receipt." },
  { icon: "camera", color: "#D97706", title: "4. Upload payment proof", body: "Paid by UPI or bank transfer? Attach a screenshot as proof — your landlord reviews and confirms it, and you're covered." },
  { icon: "receipt", color: "#0891B2", title: "5. Payment history & receipts", body: "See every rent payment you've made and download receipts whenever you need them — handy for records and reimbursements." },
  { icon: "construct", color: "#8B5CF6", title: "6. Maintenance requests", body: "Something broken? Raise a maintenance request with photos and a priority, and track its status until it's resolved." },
  { icon: "alert-circle", color: "#DC2626", title: "7. Complaints", body: "Raise a formal complaint when needed and follow the conversation with your landlord through to a resolution." },
  { icon: "chatbubbles", color: "#7C3AED", title: "8. Message your landlord", body: "Every lease has its own chat. Message your landlord and share photos directly — no more lost WhatsApp threads." },
  { icon: "shield-checkmark", color: "#16A34A", title: "9. Your documents", body: "Upload your identity documents securely. Your landlord can verify them, and a verified profile builds trust for future rentals." },
  { icon: "star", color: "#F59E0B", title: "10. Reviews", body: "Once your lease ends you can rate your landlord, and you can see the reviews landlords have left about you." },
  { icon: "time", color: "#0EA5E9", title: "11. Rental history", body: "Your past and current tenancies are kept in one place — a portable rental record you can show future landlords." },
  { icon: "search", color: "#2563EB", title: "12. Browse & preferences", body: "Explore properties near you from the Browse tab, and set your country, currency and notification preferences in your profile." },
];
