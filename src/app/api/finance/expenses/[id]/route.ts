import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { readJson, refreshViews, requireUser } from "@/lib/api";
import { dateOnly } from "@/lib/dates";
import { expenseCategories, paymentMethods } from "@/lib/labels";
import { presentMoney } from "@/lib/present";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const existing = await prisma.expense.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "খরচটি পাওয়া যায়নি।" }, { status: 404 });
  const body = await readJson(request);
  if (!body) return Response.json({ error: "তথ্য পড়া যায়নি।" }, { status: 400 });
  const category = String(body.category ?? existing.category);
  if (!expenseCategories.includes(category as ExpenseCategory)) return Response.json({ error: "খাত ঠিক নয়।" }, { status: 400 });
  const method = String(body.paymentMethod ?? existing.paymentMethod);
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      amount: body.amount === undefined ? existing.amount : Math.round(Number(body.amount)),
      category: category as ExpenseCategory,
      paymentMethod: (paymentMethods.includes(method as PaymentMethod) ? method : existing.paymentMethod) as PaymentMethod,
      date: body.date ? dateOnly(String(body.date)) : existing.date,
      notes: String(body.notes ?? existing.notes),
    },
  });
  refreshViews();
  return Response.json({ expense: presentMoney(updated) });
}

export async function DELETE(_request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const existing = await prisma.expense.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "খরচটি পাওয়া যায়নি।" }, { status: 404 });
  await prisma.expense.delete({ where: { id } });
  refreshViews();
  return Response.json({ ok: true });
}
