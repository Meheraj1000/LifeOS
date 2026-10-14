import { refreshViews, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const existing = await prisma.income.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "আয়টি পাওয়া যায়নি।" }, { status: 404 });
  await prisma.income.delete({ where: { id } });
  refreshViews();
  return Response.json({ ok: true });
}
