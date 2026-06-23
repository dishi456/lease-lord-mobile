// Lease Lord brand palette — mirrors the web app (theme_color #2563EB).
export const colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  subtle: "#94A3B8",
  success: "#059669",
  successBg: "#ECFDF5",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  info: "#2563EB",
  infoBg: "#EFF6FF",
};

// Map backend status strings → a {fg,bg} chip color.
export function statusColor(status: string): { fg: string; bg: string } {
  const s = status.toUpperCase();
  if (["PAID", "SUCCESS", "ACTIVE", "RESOLVED", "AVAILABLE", "RENEWED", "APPROVED", "VISIBLE"].includes(s))
    return { fg: colors.success, bg: colors.successBg };
  if (["PENDING", "OPEN", "DRAFT", "ASSIGNED", "IN_PROGRESS", "RESPONDED", "REOPENED"].includes(s))
    return { fg: colors.warning, bg: colors.warningBg };
  if (["OVERDUE", "FAILED", "SUSPENDED", "REJECTED", "TERMINATED", "CANCELLED", "DECLINED"].includes(s))
    return { fg: colors.danger, bg: colors.dangerBg };
  return { fg: colors.muted, bg: "#F1F5F9" };
}

export const radius = { sm: 8, md: 12, lg: 16 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
