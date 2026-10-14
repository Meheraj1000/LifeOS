export type DocumentType = "nid" | "passport" | "land" | "license";

export type VaultDocument = {
  id: string;
  type: DocumentType;
  title: string;
  holder: string;
  number: string;
  issuedOn?: string;
  expiresOn?: string | null;
  fileName?: string;
};

export type ExpenseCategory = "utility" | "grocery" | "education" | "transport" | "other";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  date: string;
  source: "manual" | "voice";
};

export type TaskKind = "bill" | "exam" | "errand";

export type Reminder = {
  id: string;
  title: string;
  kind: TaskKind;
  dueDate: string;
  done: boolean;
};

export type ServiceProgress = Record<string, { step: number; checked: string[] }>;

export type PersistedState = {
  documents: VaultDocument[];
  expenses: Expense[];
  tasks: Reminder[];
  serviceProgress: ServiceProgress;
};
