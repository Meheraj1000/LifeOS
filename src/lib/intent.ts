import { addIsoDays, todayIso } from "@/lib/dates";
import { normalizeDigits } from "@/lib/format";

export type ExpenseCategory = "UTILITY" | "GROCERY" | "EDUCATION" | "HEALTHCARE" | "TRAVEL" | "EMI" | "OTHER";
export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "BANK" | "CARD";
export type TaskCategory = "BILL" | "EXAM" | "JOB" | "HEALTH" | "FAMILY" | "HOME" | "VEHICLE" | "PERSONAL";
export type DocumentCategory =
  | "NID"
  | "PASSPORT"
  | "LAND_KHATIAN"
  | "LAND_NAMJARI"
  | "DRIVING_LICENSE"
  | "TIN"
  | "VEHICLE_FITNESS"
  | "TRADE_LICENSE";

export type Intent =
  | { type: "expense"; category: ExpenseCategory; amount: number; date: string; notes: string; paymentMethod: PaymentMethod }
  | { type: "income"; amount: number; date: string; notes: string; category: string; paymentMethod: PaymentMethod }
  | { type: "task"; title: string; category: TaskCategory; dueDate: string; priority: "LOW" | "MEDIUM" | "HIGH" }
  | { type: "expiry"; category?: DocumentCategory }
  | { type: "service"; slug: string }
  | { type: "health" }
  | { type: "unknown" };

const expenseWords: Array<{ category: ExpenseCategory; words: string[] }> = [
  { category: "UTILITY", words: ["ডেসকো", "desco", "ডিপিডিসি", "dpdc", "ওয়াসা", "wasa", "তিতাস", "গ্যাস", "বিদ্যুৎ", "ইন্টারনেট", "কারেন্ট"] },
  { category: "GROCERY", words: ["বাজার", "খাবার", "সবজি", "মুদি", "কিরিয়ানা", "গ্রোসারি"] },
  { category: "EDUCATION", words: ["স্কুল", "কলেজ", "বেতন", "বই", "কোচিং", "টিউশন"] },
  { category: "HEALTHCARE", words: ["ওষুধ", "ডাক্তার", "হাসপাতাল", "টিকা", "ফার্মেসি"] },
  { category: "TRAVEL", words: ["বাস", "সিএনজি", "রিকশা", "উবার", "পাঠাও", "ট্রেন", "মেট্রো", "ভাড়া"] },
  { category: "EMI", words: ["কিস্তি", "ইএমআই", "emi", "লোন", "ঋণ"] },
];

const services: Array<{ slug: string; words: string[] }> = [
  { slug: "tin-return", words: ["টিন", "tin", "আয়কর", "ট্যাক্স", "কর রিটার্ন"] },
  { slug: "birth-certificate", words: ["জন্ম নিবন্ধন", "জন্মসনদ", "মৃত্যু সনদ", "মৃত্যু নিবন্ধন"] },
  { slug: "e-namjari", words: ["নামজারি", "খতিয়ান", "ভূমি"] },
  { slug: "trade-license", words: ["ট্রেড", "trade"] },
  { slug: "driving-license", words: ["ড্রাইভিং", "বিআরটিএ", "brta", "স্মার্ট কার্ড"] },
  { slug: "e-passport", words: ["পাসপোর্ট", "passport", "ই-পাস"] },
];

const documents: Array<{ category: DocumentCategory; words: string[] }> = [
  { category: "VEHICLE_FITNESS", words: ["ফিটনেস"] },
  { category: "DRIVING_LICENSE", words: ["ড্রাইভিং", "লাইসেন্স"] },
  { category: "LAND_NAMJARI", words: ["নামজারি"] },
  { category: "LAND_KHATIAN", words: ["খতিয়ান", "মৌজা"] },
  { category: "TIN", words: ["টিন", "কর সনদ"] },
  { category: "TRADE_LICENSE", words: ["ট্রেড"] },
  { category: "NID", words: ["এনআইডি", "জাতীয় পরিচয়", "nid"] },
  { category: "PASSPORT", words: ["পাসপোর্ট", "passport"] },
];

function has(text: string, words: string[]) {
  const haystack = text.toLowerCase();
  return words.some((word) => haystack.includes(word.toLowerCase()));
}

function amountOf(text: string) {
  const normalized = normalizeDigits(text).replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:টাকা|taka|৳)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function mentionedDate(text: string, today: string) {
  if (text.includes("পরশু")) return addIsoDays(today, 2);
  if (text.includes("আগামীকাল")) return addIsoDays(today, 1);
  if (text.includes("আজ")) return today;
  return null;
}

function paymentOf(text: string): PaymentMethod {
  if (has(text, ["বিকাশ", "bkash"])) return "BKASH";
  if (has(text, ["নগদ অ্যাপ", "nagad"])) return "NAGAD";
  if (has(text, ["রকেট", "rocket"])) return "ROCKET";
  if (has(text, ["ব্যাংক", "কার্ড"])) return "BANK";
  return "CASH";
}

function taskTitle(text: string, category: TaskCategory) {
  if (has(text, ["ডেসকো", "desco"])) return "ডেসকো বিল পরিশোধ";
  if (has(text, ["ওয়াসা", "wasa"])) return "ওয়াসা বিল পরিশোধ";
  if (has(text, ["তিতাস"])) return "তিতাস গ্যাস বিল পরিশোধ";
  if (has(text, ["টিকা"])) return "টিকার তারিখ মনে রাখা";
  if (has(text, ["সার্ভিসিং", "সার্ভিস"])) return "যান সার্ভিসিং";
  if (has(text, ["ভাড়া"])) return "বাড়ি ভাড়া পরিশোধ";
  const cleaned = text
    .replace(/অনুগ্রহ করে|দয়া করে|মনে করিয়ে দিন|মনে করিয়ে দিও|রিমাইন্ডার/g, "")
    .replace(/আগামীকাল|পরশু|আজ/g, "")
    .replace(/[।,.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length >= 4) return cleaned;
  if (category === "EXAM") return "পরীক্ষার প্রস্তুতি";
  if (category === "HEALTH") return "স্বাস্থ্য সংক্রান্ত কাজ";
  return "ব্যক্তিগত কাজ";
}

export function parseIntent(text: string, today = todayIso()): Intent {
  const speech = text.trim();
  if (!speech) return { type: "unknown" };

  const askingExpiry = has(speech, ["মেয়াদ", "কবে শেষ", "কত দিন"]);
  const document = documents.find((item) => has(speech, item.words))?.category;
  if (askingExpiry) return { type: "expiry", category: document };

  const amount = amountOf(speech);
  const date = mentionedDate(speech, today) ?? today;
  const paymentMethod = paymentOf(speech);

  if (amount && has(speech, ["পেয়েছি", "পেলাম", "আয়", "বেতন পে", "জমা হয়েছে"])) {
    return {
      type: "income",
      amount,
      date,
      notes: speech,
      category: has(speech, ["বেতন"]) ? "বেতন" : "আয়",
      paymentMethod,
    };
  }

  if (amount && has(speech, ["খরচ", "কিনে", "কিনলাম", "দিলাম", "দিয়েছি", "লাগল", "গেছে", "বিল"])) {
    const category = expenseWords.find((item) => has(speech, item.words))?.category ?? "OTHER";
    return { type: "expense", category, amount, date, notes: speech, paymentMethod };
  }

  if (has(speech, ["মনে করিয়ে", "রিমাইন্ডার", "কাজ যোগ", "পরীক্ষা", "সার্ভিসিং", "টিকা", "অ্যাপয়েন্টমেন্ট"])) {
    const category: TaskCategory = has(speech, ["পরীক্ষা"])
      ? "EXAM"
      : has(speech, ["চাকরি", "আবেদন ফি", "জব"])
        ? "JOB"
        : has(speech, ["ডাক্তার", "টিকা", "অ্যাপয়েন্টমেন্ট", "ওষুধ"])
          ? "HEALTH"
          : has(speech, ["সার্ভিস", "বাইক", "গাড়ি", "ফিটনেস"])
            ? "VEHICLE"
            : has(speech, ["ভাড়া", "মেয়ে", "বাসা"])
              ? "HOME"
              : has(speech, ["বিল", "ডেসকো", "ওয়াসা", "তিতাস"])
                ? "BILL"
                : "PERSONAL";
    return {
      type: "task",
      title: taskTitle(speech, category),
      category,
      dueDate: mentionedDate(speech, today) ?? addIsoDays(today, 1),
      priority: has(speech, ["জরুরি", "আজ"]) ? "HIGH" : "MEDIUM",
    };
  }

  if (has(speech, ["ডাক্তার", "টিকা", "স্বাস্থ্য", "ওষুধ"])) return { type: "health" };

  const serviceWords = has(speech, ["কাগজ", "আবেদন", "ফি", "কী লাগবে", "কি লাগবে", "কীভাবে", "ফরম", "শাখা"]);
  const service = services.find((item) => has(speech, item.words));
  if (service && (serviceWords || has(speech, ["ই-পাস", "ই-নাম", "ট্রেড", "টিন", "জন্ম"]))) {
    return { type: "service", slug: service.slug };
  }

  if (document) return { type: "expiry", category: document };
  return { type: "unknown" };
}
