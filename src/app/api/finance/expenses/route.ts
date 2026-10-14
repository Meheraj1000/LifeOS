import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { refreshViews, requireUser } from "@/lib/api";
import { dateOnly, monthKey, todayIso } from "@/lib/dates";
import { expenseCategories, paymentMethods } from "@/lib/labels";
import { presentMoney } from "@/lib/present";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const month = new URL(request.url).searchParams.get("month") ?? monthKey(todayIso());
  const [expenses, incomes, budgets] = await Promise.all([
    prisma.expense.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.income.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.budget.findMany({ where: { userId: user.id, month } }),
  ]);
  return Response.json({
    month,
    expenses: expenses.map(presentMoney).filter((item) => item.date.startsWith(month)),
    incomes: incomes.map(presentMoney).filter((item) => item.date.startsWith(month)),
    budgets,
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json()) as { amount?: number; category?: string; paymentMethod?: string; date?: string; notes?: string };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return Response.json({ error: "সঠিক পরিমাণ লিখুন।" }, { status: 400 });
  if (!expenseCategories.includes(body.category as ExpenseCategory)) return Response.json({ error: "খাত বাছুন।" }, { status: 400 });
  const method = paymentMethods.includes(body.paymentMethod as PaymentMethod) ? (body.paymentMethod as PaymentMethod) : "CASH";
  const row = await prisma.expense.create({
    data: {
      userId: user.id,
      amount: Math.round(amount),
      category: body.category as ExpenseCategory,
      paymentMethod: method,
      date: dateOnly(body.date || todayIso()),
      notes: body.notes?.trim() || "খরচ",
      source: "manual",
    },
  });
  refreshViews();
  return Response.json({ expense: presentMoney(row) }, { status: 201 });
}
