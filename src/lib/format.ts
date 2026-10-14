import type { DocumentType, ExpenseCategory, TaskKind } from "@/lib/types";

export const SEED_TODAY = "2026-10-15";
export const SEED_MONTH = "2026-10";

export function formatNumber(value: number) {
  return Math.round(value).toLocaleString("bn-BD");
}

export function formatTaka(value: number) {
  return `৳ ${formatNumber(value)}`;
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function currentMonthKey(date = new Date()) {
  return toISODate(date).slice(0, 7);
}

export function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1 + delta, 1);
  return toISODate(date).slice(0, 7);
}

export function addDays(iso: string, days: number) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function formatDate(iso: string) {
  return parseISODate(iso).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekday(iso: string) {
  return parseISODate(iso).toLocaleDateString("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function monthLabel(key: string) {
  return parseISODate(`${key}-01`).toLocaleDateString("bn-BD", {
    month: "long",
    year: "numeric",
  });
}

export function daysUntil(iso: string, todayIso: string) {
  const target = parseISODate(iso).getTime();
  const today = parseISODate(todayIso).getTime();
  return Math.round((target - today) / 86_400_000);
}

export type ExpiryTone = "red" | "yellow" | "green" | "safe";

export function expiryInfo(expiresOn: string | null | undefined, todayIso: string) {
  if (!expiresOn) {
    return { tone: "safe" as const, days: null, label: "স্থায়ী" };
  }

  const days = daysUntil(expiresOn, todayIso);
  if (days < 0) return { tone: "red" as const, days, label: "মেয়াদ শেষ" };
  if (days < 15) return { tone: "red" as const, days, label: `${formatNumber(days)} দিন বাকি` };
  if (days < 60) return { tone: "yellow" as const, days, label: `${formatNumber(days)} দিন বাকি` };
  return { tone: "green" as const, days, label: `${formatNumber(days)} দিন বাকি` };
}

export function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export const documentTypes: Record<DocumentType, { label: string; short: string }> = {
  nid: { label: "জাতীয় পরিচয়পত্র", short: "এনআইডি" },
  passport: { label: "পাসপোর্ট", short: "পাসপোর্ট" },
  land: { label: "খতিয়ান / নামজারি", short: "ভূমি" },
  license: { label: "ড্রাইভিং লাইসেন্স", short: "লাইসেন্স" },
};

export const categoryMeta: Record<ExpenseCategory, { label: string; hint: string; color: string }> = {
  utility: { label: "ইউটিলিটি", hint: "ডেসকো, ওয়াসা, গ্যাস", color: "#e0b45a" },
  grocery: { label: "বাজার-সদাই", hint: "কাঁচাবাজার ও মুদি", color: "#7dcea8" },
  education: { label: "শিক্ষা", hint: "বেতন, বই, কোচিং", color: "#8eb6d9" },
  transport: { label: "যাতায়াত", hint: "বাস, সিএনজি, রিকশা", color: "#e08b78" },
  other: { label: "অন্যান্য", hint: "ওষুধ ও ব্যক্তিগত", color: "#c4b49a" },
};

export const budgets: Record<ExpenseCategory, number> = {
  utility: 6000,
  grocery: 8000,
  education: 4000,
  transport: 3000,
  other: 3000,
};

export const taskKindMeta: Record<TaskKind, { label: string }> = {
  bill: { label: "বিল" },
  exam: { label: "পরীক্ষা" },
  errand: { label: "ব্যক্তিগত" },
};

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function normalizeDigits(input: string) {
  return input.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
}
