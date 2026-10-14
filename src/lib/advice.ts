import { ExpenseCategory, Priority, TaskCategory } from "@prisma/client";
import { dateOnly, daysLeft, isoDate, monthKey, todayIso } from "@/lib/dates";
import { formatDate, formatTaka } from "@/lib/format";
import { documentLabels, expenseLabels, providerLabels } from "@/lib/labels";
import { presentDocument } from "@/lib/present";
import { prisma } from "@/lib/prisma";

export type NextStep = {
  key: string;
  title: string;
  reason: string;
  category: TaskCategory;
  priority: Priority;
  dueDate: string;
  href: string;
  alreadyListed: boolean;
};

const serviceHref: Partial<Record<string, string>> = {
  PASSPORT: "/dashboard/services/e-passport",
  LAND_NAMJARI: "/dashboard/services/e-namjari",
  LAND_KHATIAN: "/dashboard/services/e-namjari",
  DRIVING_LICENSE: "/dashboard/services/driving-license",
  TRADE_LICENSE: "/dashboard/services/trade-license",
  TIN: "/dashboard/services/tin-return",
};

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return { start: dateOnly(`${month}-01`), end: new Date(Date.UTC(year, monthNumber, 1, 12)) };
}

function listed(tasks: { title: string; notes: string | null; isCompleted: boolean }[], key: string, title: string) {
  return tasks.some((task) => !task.isCompleted && (task.notes?.includes(`advice:${key}`) || task.title.trim() === title.trim()));
}

function rank(priority: Priority) {
  if (priority === "HIGH") return 0;
  if (priority === "MEDIUM") return 1;
  return 2;
}

export async function recommendNextSteps(userId: string, now = new Date()): Promise<NextStep[]> {
  const today = todayIso(now);
  const month = monthKey(today);
  const range = monthRange(month);

  const [documents, bills, budgets, expenses, incomes, tasks, members, progress] = await Promise.all([
    prisma.document.findMany({ where: { userId } }),
    prisma.utilityBill.findMany({ where: { userId, isPaid: false } }),
    prisma.budget.findMany({ where: { userId, month } }),
    prisma.expense.findMany({ where: { userId, date: { gte: range.start, lt: range.end } } }),
    prisma.income.findMany({ where: { userId, date: { gte: range.start, lt: range.end } } }),
    prisma.task.findMany({ where: { userId, isCompleted: false } }),
    prisma.familyMember.findMany({ where: { userId } }),
    prisma.serviceProgress.findMany({ where: { userId }, include: { guide: true } }),
  ]);

  const steps: NextStep[] = [];

  for (const document of documents) {
    const view = presentDocument(document, now);
    if (view.days === null || view.days >= 60) continue;
    const label = documentLabels[document.category as keyof typeof documentLabels] ?? document.title;
    const title = `${label} নবায়ন`;
    const key = `doc:${document.id}`;
    steps.push({
      key,
      title,
      reason: `${document.holderName}-এর ${document.title}: ${view.label}। ${view.days < 15 ? "কাগজ এখনই গুছিয়ে নিন।" : "সময় আছে, তবু তালিকায় রাখুন।"}`,
      category: document.category === "DRIVING_LICENSE" || document.category === "VEHICLE_FITNESS" ? "VEHICLE" : document.category === "TRADE_LICENSE" || document.category === "TIN" ? "JOB" : "PERSONAL",
      priority: view.days < 15 ? "HIGH" : "MEDIUM",
      dueDate: view.days < 0 ? today : view.expiryDate ?? today,
      href: serviceHref[document.category] ?? "/dashboard/vault",
      alreadyListed: listed(tasks, key, title),
    });
  }

  for (const bill of bills) {
    const days = daysLeft(bill.dueDate, now);
    if (days === null || days > 21) continue;
    const provider = providerLabels[bill.provider];
    const title = `${provider} বিল পরিশোধ`;
    const key = `bill:${bill.id}`;
    steps.push({
      key,
      title,
      reason: `${formatTaka(bill.amount)}। শেষ তারিখ ${formatDate(isoDate(bill.dueDate))}। ${days < 0 ? "তারিখ পেরিয়ে গেছে।" : days <= 3 ? "খুব কাছে।" : "এখন দিলে বিলম্ব ফি এড়ানো যায়।"}`,
      category: "BILL",
      priority: days <= 3 ? "HIGH" : "MEDIUM",
      dueDate: isoDate(bill.dueDate),
      href: "/dashboard/finance",
      alreadyListed: listed(tasks, key, title),
    });
  }

  for (const budget of budgets) {
    const spent = expenses.filter((item) => item.category === budget.category).reduce((sum, item) => sum + item.amount, 0);
    if (budget.limit <= 0 || spent < budget.limit * 0.8) continue;
    const label = expenseLabels[budget.category as ExpenseCategory];
    const title = `${label} খরচ কমান`;
    const key = `budget:${budget.category}:${month}`;
    const over = spent >= budget.limit;
    steps.push({
      key,
      title,
      reason: `এই মাসে ${formatTaka(spent)} খরচ হয়েছে। সীমা ${formatTaka(budget.limit)}। ${over ? "সীমা পেরিয়ে গেছে।" : "সীমার কাছে এসে গেছে।"}`,
      category: "PERSONAL",
      priority: over ? "HIGH" : "MEDIUM",
      dueDate: today,
      href: "/dashboard/finance",
      alreadyListed: listed(tasks, key, title),
    });
  }

  const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const earned = incomes.reduce((sum, item) => sum + item.amount, 0);
  if (earned > 0 && spent > earned) {
    const title = "এই মাসের খরচ আয়ের চেয়ে বেশি";
    const key = `cash:${month}`;
    steps.push({
      key,
      title,
      reason: `আয় ${formatTaka(earned)}, খরচ ${formatTaka(spent)}। বাকি দিনের খরচ আগে থেকে ঠিক করে নিন।`,
      category: "PERSONAL",
      priority: "HIGH",
      dueDate: today,
      href: "/dashboard/finance",
      alreadyListed: listed(tasks, key, title),
    });
  }

  for (const task of tasks) {
    const due = daysLeft(task.dueDate, now);
    if (due === null || due > 3) continue;
    steps.push({
      key: `task:${task.id}`,
      title: task.title,
      reason: due < 0 ? "তারিখ পেরিয়ে গেছে। আজই শেষ করে দিন।" : due === 0 ? "আজকের কাজ।" : `${formatDate(isoDate(task.dueDate))}-এর মধ্যে শেষ করুন।`,
      category: task.category,
      priority: task.priority === "LOW" && due <= 0 ? "MEDIUM" : task.priority,
      dueDate: isoDate(task.dueDate),
      href: "/dashboard/tasks",
      alreadyListed: true,
    });
  }

  for (const member of members) {
    if (!member.medicalHistory?.trim()) continue;
    if (tasks.some((task) => task.familyMemberId === member.id)) continue;
    const title = `${member.name}-এর স্বাস্থ্য দেখে নিন`;
    const key = `family:${member.id}`;
    steps.push({
      key,
      title,
      reason: member.medicalHistory.trim(),
      category: "HEALTH",
      priority: "MEDIUM",
      dueDate: today,
      href: "/dashboard/tasks",
      alreadyListed: listed(tasks, key, title),
    });
  }

  for (const item of progress) {
    const required = Array.isArray(item.guide.documentsRequired) ? item.guide.documentsRequired.length : 0;
    const checked = Array.isArray(item.checked) ? item.checked.length : 0;
    if (required > 0 && checked >= required) continue;
    if (item.step === 0 && checked === 0) continue;
    const title = `${item.guide.title} এগিয়ে নিন`;
    const key = `service:${item.guide.slug}`;
    steps.push({
      key,
      title,
      reason: `ধাপ ${item.step + 1} চলছে। কাগজ মিলিয়ে পরের ধাপে যান।`,
      category: "PERSONAL",
      priority: "MEDIUM",
      dueDate: today,
      href: `/dashboard/services/${item.guide.slug}`,
      alreadyListed: listed(tasks, key, title),
    });
  }

  return steps
    .sort((a, b) => rank(a.priority) - rank(b.priority) || a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);
}

export async function acceptAdvice(userId: string, keys: string[]) {
  const wanted = new Set(keys);
  const steps = (await recommendNextSteps(userId)).filter((step) => wanted.has(step.key) && !step.alreadyListed);
  if (steps.length === 0) return [];
  return prisma.$transaction(
    steps.map((step) =>
      prisma.task.create({
        data: {
          userId,
          title: step.title,
          category: step.category,
          dueDate: dateOnly(step.dueDate),
          priority: step.priority,
          notes: `advice:${step.key}`,
        },
      }),
    ),
  );
}
