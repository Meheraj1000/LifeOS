export const documentLabels = {
  NID: "জাতীয় পরিচয়পত্র",
  PASSPORT: "ই-পাসপোর্ট",
  LAND_KHATIAN: "খতিয়ান",
  LAND_NAMJARI: "নামজারি",
  DRIVING_LICENSE: "ড্রাইভিং লাইসেন্স",
  TIN: "টিন / কর সনদ",
  VEHICLE_FITNESS: "যানের ফিটনেস",
  TRADE_LICENSE: "ট্রেড লাইসেন্স",
} as const;

export const expenseLabels = {
  UTILITY: "ইউটিলিটি",
  GROCERY: "বাজার ও খাবার",
  EDUCATION: "শিক্ষা",
  HEALTHCARE: "স্বাস্থ্য",
  TRAVEL: "যাতায়াত",
  EMI: "কিস্তি ও ঋণ",
  OTHER: "অন্যান্য",
} as const;

export const expenseHints = {
  UTILITY: "ডেসকো, ডিপিডিসি, ওয়াসা, তিতাস, ইন্টারনেট",
  GROCERY: "বাজার, মুদি ও দৈনিক খাবার",
  EDUCATION: "বেতন, বই, কোচিং",
  HEALTHCARE: "ডাক্তার, ওষুধ, টিকা",
  TRAVEL: "বাস, সিএনজি, ট্রেন",
  EMI: "লোন ও মাসিক কিস্তি",
  OTHER: "ব্যক্তিগত খরচ",
} as const;

export const expenseColors = {
  UTILITY: "#e0b45a",
  GROCERY: "#7dcea8",
  EDUCATION: "#8eb6d9",
  HEALTHCARE: "#e08b78",
  TRAVEL: "#c4b49a",
  EMI: "#d7a1c4",
  OTHER: "#9aa89f",
} as const;

export const paymentLabels = {
  CASH: "হাতে নগদ",
  BKASH: "বিকাশ",
  NAGAD: "নগদ অ্যাপ",
  ROCKET: "রকেট",
  BANK: "ব্যাংক",
  CARD: "কার্ড",
} as const;

export const providerLabels = {
  DESCO: "ডেসকো",
  DPDC: "ডিপিডিসি",
  WASA: "ওয়াসা",
  TITAS: "তিতাস গ্যাস",
  INTERNET: "ইন্টারনেট",
} as const;

export const taskLabels = {
  BILL: "বিল",
  EXAM: "পরীক্ষা",
  JOB: "চাকরি",
  HEALTH: "স্বাস্থ্য",
  FAMILY: "পরিবার",
  HOME: "ঘর",
  VEHICLE: "যান",
  PERSONAL: "ব্যক্তিগত",
} as const;

export const priorityLabels = {
  LOW: "কম",
  MEDIUM: "সাধারণ",
  HIGH: "জরুরি",
} as const;

export const documentCategories = Object.keys(documentLabels) as Array<keyof typeof documentLabels>;
export const expenseCategories = Object.keys(expenseLabels) as Array<keyof typeof expenseLabels>;
export const taskCategories = Object.keys(taskLabels) as Array<keyof typeof taskLabels>;
export const paymentMethods = Object.keys(paymentLabels) as Array<keyof typeof paymentLabels>;
export const providers = Object.keys(providerLabels) as Array<keyof typeof providerLabels>;
export const priorities = Object.keys(priorityLabels) as Array<keyof typeof priorityLabels>;
