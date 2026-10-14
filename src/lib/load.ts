import { queueDueAlerts, syncDocumentStatuses } from "@/lib/alerts";
import { monthKey, todayIso } from "@/lib/dates";
import { presentBill, presentDocument, presentMoney, presentTask } from "@/lib/present";
import { prisma } from "@/lib/prisma";

export async function loadShell(userId: string) {
  await syncDocumentStatuses(userId);
  await queueDueAlerts(userId);
  const [documents, tasks, notifications] = await Promise.all([
    prisma.document.findMany({ where: { userId }, orderBy: { expiryDate: "asc" } }),
    prisma.task.findMany({ where: { userId, isCompleted: false }, orderBy: { dueDate: "asc" }, take: 8 }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const docs = documents.map((document) => presentDocument(document));
  return {
    alerts: docs.filter((document) => document.tone === "red" || document.tone === "yellow").length,
    notifications: notifications.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      status: item.status,
      channel: item.channel,
    })),
    search: [
      ...docs.map((document) => ({ href: "/dashboard/vault", title: document.title, meta: document.holderName })),
      ...tasks.map((task) => ({ href: "/dashboard/tasks", title: task.title, meta: presentTask(task).dueDate })),
    ],
  };
}

export async function loadOverview(userId: string) {
  const month = monthKey(todayIso());
  const [documents, expenses, incomes, tasks, bills, guides] = await Promise.all([
    prisma.document.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.income.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId }, orderBy: { dueDate: "asc" } }),
    prisma.utilityBill.findMany({ where: { userId, isPaid: false }, orderBy: { dueDate: "asc" } }),
    prisma.civicServiceGuide.findMany({ orderBy: { title: "asc" } }),
  ]);
  const docs = documents.map((document) => presentDocument(document)).sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  const monthExpenses = expenses.map(presentMoney).filter((item) => item.date.startsWith(month));
  const monthIncome = incomes.map(presentMoney).filter((item) => item.date.startsWith(month));
  const taskViews = tasks.map(presentTask);
  const today = todayIso();
  const todays = taskViews.filter((task) => task.dueDate === today);
  return {
    month,
    documents: docs.slice(0, 4),
    alertCount: docs.filter((document) => document.tone === "red" || document.tone === "yellow").length,
    spent: monthExpenses.reduce((sum, item) => sum + item.amount, 0),
    earned: monthIncome.reduce((sum, item) => sum + item.amount, 0),
    tasks: taskViews.filter((task) => !task.isCompleted).slice(0, 5),
    doneToday: todays.filter((task) => task.isCompleted).length,
    todayTotal: todays.length,
    bills: bills.map(presentBill).slice(0, 3),
    guides: guides.map((guide) => ({ slug: guide.slug, title: guide.title, summary: guide.summary })),
  };
}

export async function loadVault(userId: string) {
  const [documents, members] = await Promise.all([
    prisma.document.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.familyMember.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);
  return {
    documents: documents.map((document) => presentDocument(document)).sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999)),
    members: members.map((member) => ({ id: member.id, name: member.name, relation: member.relation })),
  };
}

export async function loadFinance(userId: string, month: string) {
  const [expenses, incomes, budgets, bills] = await Promise.all([
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.budget.findMany({ where: { userId, month } }),
    prisma.utilityBill.findMany({ where: { userId }, orderBy: { dueDate: "asc" } }),
  ]);
  return {
    month,
    expenses: expenses.map(presentMoney).filter((item) => item.date.startsWith(month)),
    incomes: incomes.map(presentMoney).filter((item) => item.date.startsWith(month)),
    budgets: budgets.map((budget) => ({ category: budget.category, limit: budget.limit })),
    bills: bills.map(presentBill),
  };
}

export async function loadServices(userId: string) {
  const guides = await prisma.civicServiceGuide.findMany({ orderBy: { title: "asc" }, include: { progress: { where: { userId } } } });
  return guides.map((guide) => {
    const required = Array.isArray(guide.documentsRequired) ? guide.documentsRequired.length : 0;
    const checked = Array.isArray(guide.progress[0]?.checked) ? (guide.progress[0]?.checked as unknown[]).length : 0;
    return {
      slug: guide.slug,
      title: guide.title,
      category: guide.category,
      summary: guide.summary,
      office: guide.office,
      steps: Array.isArray(guide.steps) ? guide.steps.length : 0,
      required,
      checked,
    };
  });
}

export async function loadGuide(userId: string, slug: string) {
  const guide = await prisma.civicServiceGuide.findUnique({
    where: { slug },
    include: { progress: { where: { userId } } },
  });
  if (!guide) return null;
  const progress = guide.progress[0];
  return {
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
    summary: guide.summary,
    office: guide.office,
    portal: guide.portal,
    steps: guide.steps as { title: string; body: string }[],
    documentsRequired: guide.documentsRequired as { id: string; label: string }[],
    fees: guide.fees as { label: string; amount: string }[],
    tips: guide.tips as string[],
    branches: guide.branches as { name: string; address: string; district: string }[],
    step: progress?.step ?? 0,
    checked: Array.isArray(progress?.checked) ? (progress.checked as string[]) : [],
  };
}

export async function loadRoutine(userId: string) {
  const [tasks, members] = await Promise.all([
    prisma.task.findMany({ where: { userId }, orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }] }),
    prisma.familyMember.findMany({ where: { userId }, include: { documents: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    tasks: tasks.map(presentTask),
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      relation: member.relation,
      medicalHistory: member.medicalHistory,
      documents: member.documents.map((document) => document.title),
    })),
  };
}
