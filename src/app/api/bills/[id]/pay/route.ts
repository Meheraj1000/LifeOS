import { PaymentMethod } from "@prisma/client";
import { queueDueAlerts } from "@/lib/alerts";
import { refreshViews, requireUser } from "@/lib/api";
import { paymentMethods } from "@/lib/labels";
import { presentBill } from "@/lib/present";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const bill = await prisma.utilityBill.findFirst({ where: { id, userId: user.id } });
  if (!bill) return Response.json({ error: "বিলটি পাওয়া যায়নি।" }, { status: 404 });
  if (bill.isPaid) return Response.json({ error: "এই বিল ইতিমধ্যে পরিশোধিত।" }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { paymentMethod?: string };
  const method = paymentMethods.includes(body.paymentMethod as PaymentMethod) ? (body.paymentMethod as PaymentMethod) : "BKASH";
  const reference = `SIM-${method}-${Date.now().toString().slice(-6)}`;
  const updated = await prisma.utilityBill.update({
    where: { id },
    data: { isPaid: true, paidAt: new Date(), paymentMethod: method, reference },
  });
  await prisma.expense.create({
    data: {
      userId: user.id,
      amount: bill.amount,
      category: "UTILITY",
      paymentMethod: method,
      date: new Date(),
      notes: `${bill.provider} বিল পরিশোধ · ${reference}`,
      source: "bill",
    },
  });
  await queueDueAlerts(user.id);
  refreshViews();
  return Response.json({
    bill: presentBill(updated),
    simulator: true,
    message: "এটি পেমেন্ট সিমুলেটর। কোনো টাকা কাটা হয়নি। রেফারেন্স সংরক্ষণ করা হয়েছে।",
    reference,
  });
}
