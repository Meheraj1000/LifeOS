import { daysLeft, isoDate, statusFor, toneFor, type ExpiryTone } from "@/lib/dates";
import { formatNumber } from "@/lib/format";

export function expiryLabel(days: number | null) {
  if (days === null) return "স্থায়ী";
  if (days < 0) return "মেয়াদ শেষ";
  return `${formatNumber(days)} দিন বাকি`;
}

export type DocumentView = ReturnType<typeof presentDocument>;
export type MoneyView = ReturnType<typeof presentMoney>;
export type BillView = ReturnType<typeof presentBill>;
export type TaskView = ReturnType<typeof presentTask>;

export function presentDocument(document: {
  id: string;
  category: string;
  title: string;
  number: string;
  fileName: string | null;
  fileUrl: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  holderName: string;
  familyMemberId: string | null;
  status: string;
}, now = new Date()) {
  const days = daysLeft(document.expiryDate, now);
  const tone: ExpiryTone = toneFor(days);
  return {
    id: document.id,
    category: document.category,
    title: document.title,
    number: document.number,
    fileName: document.fileName,
    fileUrl: document.fileUrl?.startsWith("storage:") ? `/api/documents/${document.id}/file` : document.fileUrl,
    issueDate: document.issueDate ? isoDate(document.issueDate) : null,
    expiryDate: document.expiryDate ? isoDate(document.expiryDate) : null,
    holderName: document.holderName,
    familyMemberId: document.familyMemberId,
    days,
    tone,
    label: expiryLabel(days),
    status: statusFor(days),
    storedStatus: document.status,
  };
}

export function presentMoney(record: {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: Date;
  notes: string;
  source?: string;
}) {
  return {
    id: record.id,
    amount: record.amount,
    category: record.category,
    paymentMethod: record.paymentMethod,
    date: isoDate(record.date),
    notes: record.notes,
    source: record.source ?? "manual",
  };
}

export function presentBill(bill: {
  id: string;
  provider: string;
  accountNo: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  paymentMethod: string | null;
  reference: string | null;
  lastFetchedAt: Date | null;
}) {
  return {
    id: bill.id,
    provider: bill.provider,
    accountNo: bill.accountNo,
    amount: bill.amount,
    dueDate: isoDate(bill.dueDate),
    isPaid: bill.isPaid,
    paymentMethod: bill.paymentMethod,
    reference: bill.reference,
    lastFetchedAt: bill.lastFetchedAt ? bill.lastFetchedAt.toISOString() : null,
    days: daysLeft(bill.dueDate),
  };
}

export function presentTask(task: {
  id: string;
  title: string;
  category: string;
  dueDate: Date;
  priority: string;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrence: string | null;
  notes: string | null;
  familyMemberId: string | null;
}) {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    dueDate: isoDate(task.dueDate),
    priority: task.priority,
    isCompleted: task.isCompleted,
    isRecurring: task.isRecurring,
    recurrence: task.recurrence,
    notes: task.notes,
    familyMemberId: task.familyMemberId,
    days: daysLeft(task.dueDate),
  };
}
