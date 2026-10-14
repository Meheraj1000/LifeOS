import { after } from "next/server";
import { queueDueAlerts } from "@/lib/alerts";
import { dateOnly, monthKey, todayIso } from "@/lib/dates";
import { formatDate, formatTaka } from "@/lib/format";
import { parseIntent, type Intent } from "@/lib/intent";
import { documentLabels, expenseLabels, paymentLabels } from "@/lib/labels";
import { presentDocument, presentTask } from "@/lib/present";
import { prisma } from "@/lib/prisma";

type GuideShape = {
  title: string;
  steps: { title: string; body: string }[];
  documentsRequired: { label: string }[];
  fees: { label: string; amount: string }[];
  branches: { name: string; district: string }[];
};

export type ActionStep = { label: string; detail: string };

function asGuide(value: { title: string; steps: unknown; documentsRequired: unknown; fees: unknown; branches: unknown }): GuideShape {
  return {
    title: value.title,
    steps: Array.isArray(value.steps) ? (value.steps as GuideShape["steps"]) : [],
    documentsRequired: Array.isArray(value.documentsRequired) ? (value.documentsRequired as GuideShape["documentsRequired"]) : [],
    fees: Array.isArray(value.fees) ? (value.fees as GuideShape["fees"]) : [],
    branches: Array.isArray(value.branches) ? (value.branches as GuideShape["branches"]) : [],
  };
}

function pack(
  steps: ActionStep[],
  extra: { href?: string; created: { expenseId: string } | { incomeId: string } | { taskId: string } | null },
) {
  return {
    reply: steps.map((step) => `${step.label}: ${step.detail}`).join(" "),
    steps,
    created: extra.created,
    href: extra.href ?? null,
  };
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return { start: dateOnly(`${month}-01`), end: new Date(Date.UTC(year, monthNumber, 1, 12)) };
}

export async function applyIntent(userId: string, text: string) {
  const intent = parseIntent(text, todayIso());
  const result = await fulfill(userId, intent);
  after(async () => {
    try {
      await prisma.assistantLog.create({ data: { userId, utterance: text, intent, reply: result.reply } });
      await queueDueAlerts(userId);
    } catch {
      // The command is already saved. A late log should not change the reply.
    }
  });
  return { intent, ...result };
}

async function fulfill(userId: string, intent: Intent) {
  if (intent.type === "expense") {
    const row = await prisma.expense.create({
      data: {
        userId,
        amount: intent.amount,
        category: intent.category,
        paymentMethod: intent.paymentMethod,
        date: dateOnly(intent.date),
        notes: intent.notes,
        source: "voice",
      },
    });
    const month = monthKey(intent.date);
    const bounds = monthBounds(month);
    const [budget, spent] = await Promise.all([
      prisma.budget.findUnique({ where: { userId_category_month: { userId, category: intent.category, month } } }),
      prisma.expense.aggregate({ where: { userId, category: intent.category, date: { gte: bounds.start, lt: bounds.end } }, _sum: { amount: true } }),
    ]);
    const total = spent._sum.amount ?? intent.amount;
    const next = !budget
      ? "খাতায় এই খরচ দেখা যাবে।"
      : total > budget.limit
        ? `এই মাসে ${expenseLabels[intent.category]} সীমা ${formatTaka(budget.limit)} ছাড়িয়ে ${formatTaka(total)} হয়েছে। বাকি দিনে এই খাত কমিয়ে চলুন।`
        : `এই মাসে এই খাতে আর ${formatTaka(budget.limit - total)} রাখা আছে।`;
    return pack(
      [
        { label: "বুঝেছি", detail: `${formatDate(intent.date)} তারিখে ${expenseLabels[intent.category]} খাতে ${formatTaka(intent.amount)}, ${paymentLabels[intent.paymentMethod]}।` },
        { label: "করেছি", detail: "খরচের হিসাবে যোগ করেছি। অন্য কিছু বদলানো হয়নি।" },
        { label: "এরপর", detail: next },
      ],
      { created: { expenseId: row.id }, href: "/dashboard/finance" },
    );
  }

  if (intent.type === "income") {
    const row = await prisma.income.create({
      data: {
        userId,
        amount: intent.amount,
        category: intent.category,
        paymentMethod: intent.paymentMethod,
        date: dateOnly(intent.date),
        notes: intent.notes,
      },
    });
    const bounds = monthBounds(monthKey(intent.date));
    const earned = await prisma.income.aggregate({
      where: { userId, date: { gte: bounds.start, lt: bounds.end } },
      _sum: { amount: true },
    });
    return pack(
      [
        { label: "বুঝেছি", detail: `${intent.category} হিসেবে ${formatTaka(intent.amount)}, তারিখ ${formatDate(intent.date)}।` },
        { label: "করেছি", detail: "আয়ের হিসাবে যোগ করেছি।" },
        { label: "এরপর", detail: `এই মাসের মোট আয় এখন ${formatTaka(earned._sum.amount ?? intent.amount)}।` },
      ],
      { created: { incomeId: row.id }, href: "/dashboard/finance" },
    );
  }

  if (intent.type === "task") {
    const row = await prisma.task.create({
      data: {
        userId,
        title: intent.title,
        category: intent.category,
        dueDate: dateOnly(intent.dueDate),
        priority: intent.priority,
      },
    });
    return pack(
      [
        { label: "বুঝেছি", detail: `${formatDate(intent.dueDate)}-এ মনে করিয়ে দিতে হবে: ${intent.title}।` },
        { label: "করেছি", detail: "কাজের তালিকায় যোগ করেছি।" },
        { label: "এরপর", detail: "সময় হলে তালিকা থেকে টিক দিয়ে শেষ করে দেবেন।" },
      ],
      { created: { taskId: row.id }, href: "/dashboard/tasks" },
    );
  }

  if (intent.type === "expiry") {
    const documents = await prisma.document.findMany({
      where: { userId, ...(intent.category ? { category: intent.category } : {}) },
      orderBy: { expiryDate: "asc" },
    });
    const name = intent.category ? documentLabels[intent.category] : "নথি";
    if (documents.length === 0) {
      return pack(
        [
          { label: "বুঝেছি", detail: `${name}-এর মেয়াদ জানতে চেয়েছেন।` },
          { label: "করেছি", detail: "ভল্টে এই নথি পাইনি, তাই কিছু বদলাইনি।" },
          { label: "এরপর", detail: "ভল্টে নথি যোগ করলে পরের বার দিন গুনে বলতে পারব।" },
        ],
        { created: null, href: "/dashboard/vault" },
      );
    }
    const views = documents.map((document) => ({ document, view: presentDocument(document) }));
    const urgent = [...views].sort((a, b) => (a.view.days ?? 9999) - (b.view.days ?? 9999))[0];
    const summary = views
      .slice(0, 3)
      .map((item) => `${item.document.holderName}-এর ${item.document.title}: ${item.view.label}`)
      .join("। ");
    const next = urgent.view.days !== null && urgent.view.days < 15
      ? `${urgent.document.title} আগে নবায়ন করুন। ছবি আর পুরনো কপি গুছিয়ে রাখুন।`
      : "৬০ দিনের কম থাকলে হলুদ, ১৫ দিনের কম থাকলে লাল দেখায়।";
    return pack(
      [
        { label: "বুঝেছি", detail: `${name}-এর মেয়াদ দেখতে বলেছেন।` },
        { label: "করেছি", detail: summary },
        { label: "এরপর", detail: next },
      ],
      { created: null, href: "/dashboard/vault" },
    );
  }

  if (intent.type === "service") {
    const guide = await prisma.civicServiceGuide.findUnique({ where: { slug: intent.slug } });
    if (!guide) {
      return pack(
        [
          { label: "বুঝেছি", detail: "একটি সরকারি সেবার ধাপ জানতে চেয়েছেন।" },
          { label: "করেছি", detail: "এই সেবার নির্দেশনা পাইনি।" },
          { label: "এরপর", detail: "সেবা তালিকা থেকে কাছাকাছি একটি বেছে নিন।" },
        ],
        { created: null, href: "/dashboard/services" },
      );
    }
    const shaped = asGuide(guide);
    const papers = shaped.documentsRequired.map((item) => item.label).slice(0, 4).join(", ");
    const fee = shaped.fees[0] ? `${shaped.fees[0].label} ${shaped.fees[0].amount}` : "ফি পোর্টালে দেখা যাবে";
    const branch = shaped.branches[0] ? `${shaped.branches[0].name}, ${shaped.branches[0].district}` : guide.office;
    return pack(
      [
        { label: "বুঝেছি", detail: `${shaped.title}-এর জন্য কী লাগবে।` },
        { label: "করেছি", detail: `প্রথম ধাপ: ${shaped.steps[0]?.title ?? "আবেদন"}। কাগজ: ${papers}।` },
        { label: "এরপর", detail: `${fee}। কাছের অফিস: ${branch}। উইজার্ডে টিক দিয়ে এগোতে পারবেন।` },
      ],
      { created: null, href: `/dashboard/services/${guide.slug}` },
    );
  }

  if (intent.type === "health") {
    const tasks = await prisma.task.findMany({
      where: { userId, category: "HEALTH", isCompleted: false },
      orderBy: { dueDate: "asc" },
      take: 4,
    });
    if (tasks.length === 0) {
      return pack(
        [
          { label: "বুঝেছি", detail: "স্বাস্থ্যের কাজ জানতে চেয়েছেন।" },
          { label: "করেছি", detail: "খোলা কোনো স্বাস্থ্য কাজ নেই।" },
          { label: "এরপর", detail: "ডাক্তার বা টিকার তারিখ বললে সেটি তালিকায় রাখব।" },
        ],
        { created: null, href: "/dashboard/tasks" },
      );
    }
    const lines = tasks.map((task) => `${presentTask(task).title} — ${formatDate(presentTask(task).dueDate)}`);
    return pack(
      [
        { label: "বুঝেছি", detail: "সামনের স্বাস্থ্য কাজ দেখতে বলেছেন।" },
        { label: "করেছি", detail: lines.join("; ") },
        { label: "এরপর", detail: "যে তারিখ আগে, সেটি আগে সেরে নিন।" },
      ],
      { created: null, href: "/dashboard/tasks" },
    );
  }

  return pack(
    [
      { label: "বুঝেছি", detail: "এটিকে খরচ, আয়, কাজ বা কাগজের নির্দেশ হিসেবে পাইনি।" },
      { label: "করেছি", detail: "কোনো হিসাব বদলাইনি।" },
      { label: "এরপর", detail: "খরচ বা মনে করিয়ে দেওয়ার কথা বললে সঙ্গে সঙ্গে যোগ হবে। অন্য আলাপ কথা ঘরে রাখা যায়।" },
    ],
    { created: null, href: "/dashboard/chat" },
  );
}
