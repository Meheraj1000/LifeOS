import { Priority, TaskCategory } from "@prisma/client";
import { refreshViews, requireUser } from "@/lib/api";
import { dateOnly, todayIso } from "@/lib/dates";
import { priorities, taskCategories } from "@/lib/labels";
import { presentTask } from "@/lib/present";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return error;
  const tasks = await prisma.task.findMany({ where: { userId: user.id }, orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }] });
  return Response.json({ tasks: tasks.map(presentTask) });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json()) as {
    title?: string;
    category?: string;
    dueDate?: string;
    priority?: string;
    isRecurring?: boolean;
    recurrence?: string;
    notes?: string;
    familyMemberId?: string;
  };
  if (!body.title || body.title.trim().length < 2) return Response.json({ error: "কাজের নাম লিখুন।" }, { status: 400 });
  if (!taskCategories.includes(body.category as TaskCategory)) return Response.json({ error: "কাজের ধরন বাছুন।" }, { status: 400 });
  const row = await prisma.task.create({
    data: {
      userId: user.id,
      title: body.title.trim(),
      category: body.category as TaskCategory,
      dueDate: dateOnly(body.dueDate || todayIso()),
      priority: priorities.includes(body.priority as Priority) ? (body.priority as Priority) : "MEDIUM",
      isRecurring: Boolean(body.isRecurring),
      recurrence: body.isRecurring ? body.recurrence || "monthly" : null,
      notes: body.notes?.trim() || null,
      familyMemberId: body.familyMemberId || null,
    },
  });
  refreshViews();
  return Response.json({ task: presentTask(row) }, { status: 201 });
}
