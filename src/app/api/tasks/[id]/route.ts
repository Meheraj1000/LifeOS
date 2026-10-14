import { refreshViews, requireUser } from "@/lib/api";
import { dateOnly } from "@/lib/dates";
import { presentTask } from "@/lib/present";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "কাজটি পাওয়া যায়নি।" }, { status: 404 });
  const body = (await request.json()) as { isCompleted?: boolean; title?: string; dueDate?: string; priority?: "LOW" | "MEDIUM" | "HIGH" };
  const completing = body.isCompleted === true && !existing.isCompleted;
  const updated = await prisma.task.update({
    where: { id },
    data: {
      isCompleted: body.isCompleted ?? existing.isCompleted,
      title: body.title?.trim() || existing.title,
      dueDate: body.dueDate ? dateOnly(body.dueDate) : existing.dueDate,
      priority: body.priority ?? existing.priority,
    },
  });
  if (completing && existing.isRecurring) {
    const next = new Date(existing.dueDate);
    if (existing.recurrence === "weekly") next.setUTCDate(next.getUTCDate() + 7);
    else next.setUTCMonth(next.getUTCMonth() + 1);
    await prisma.task.create({
      data: {
        userId: user.id,
        title: existing.title,
        category: existing.category,
        dueDate: next,
        priority: existing.priority,
        isRecurring: true,
        recurrence: existing.recurrence,
        notes: existing.notes,
        familyMemberId: existing.familyMemberId,
      },
    });
  }
  refreshViews();
  return Response.json({ task: presentTask(updated) });
}

export async function DELETE(_request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "কাজটি পাওয়া যায়নি।" }, { status: 404 });
  await prisma.task.delete({ where: { id } });
  refreshViews();
  return Response.json({ ok: true });
}
