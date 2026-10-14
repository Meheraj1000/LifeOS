export function isoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateOnly(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 12));
}

export function todayIso(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addIsoDays(iso: string, days: number) {
  const date = dateOnly(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function daysLeft(expiry: Date | null | undefined, now = new Date()) {
  if (!expiry) return null;
  const end = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - start) / 86_400_000);
}

export type ExpiryTone = "red" | "yellow" | "green" | "safe";

export function toneFor(days: number | null): ExpiryTone {
  if (days === null) return "safe";
  if (days < 15) return "red";
  if (days < 60) return "yellow";
  return "green";
}

export function statusFor(days: number | null) {
  if (days === null) return "ACTIVE" as const;
  if (days < 0) return "EXPIRED" as const;
  if (days < 60) return "EXPIRING" as const;
  return "ACTIVE" as const;
}
