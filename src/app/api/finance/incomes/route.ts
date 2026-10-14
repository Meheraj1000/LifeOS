import { PaymentMethod } from "@prisma/client";
import { refreshViews, requireUser } from "@/lib/api";
import { dateOnly, todayIso } from "@/lib/dates";
import { paymentMethods } from "@/lib/labels";
import { presentMoney } from "@/lib/present";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json()) as { amount?: number; category?: string; paymentMethod?: string; date?: string; notes?: string };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return Response.json({ error: "সঠিক পরিমাণ লিখুন।" }, { status: 400 });
  const method = paymentMethods.includes(body.paymentMethod as PaymentMethod) ? (body.paymentMethod as PaymentMethod) : "BANK";
  const row = await prisma.income.create({
    data: {
      userId: user.id,
      amount: Math.round(amount),
      category: body.category?.trim() || "আয়",
      paymentMethod: method,
      date: dateOnly(body.date || todayIso()),
      notes: body.notes?.trim() || "আয়",
    },
  });
  refreshViews();
  return Response.json({ income: presentMoney(row) }, { status: 201 });
}
