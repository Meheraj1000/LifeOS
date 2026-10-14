import { refreshViews, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { slug } = await context.params;
  const guide = await prisma.civicServiceGuide.findUnique({ where: { slug } });
  if (!guide) return Response.json({ error: "সেবাটি পাওয়া যায়নি।" }, { status: 404 });
  const body = (await request.json()) as { step?: number; checkId?: string };
  const current = await prisma.serviceProgress.findUnique({ where: { userId_guideId: { userId: user.id, guideId: guide.id } } });
  const checked = Array.isArray(current?.checked) ? (current?.checked as string[]) : [];
  const nextChecked = body.checkId
    ? checked.includes(body.checkId)
      ? checked.filter((item) => item !== body.checkId)
      : [...checked, body.checkId]
    : checked;
  const progress = await prisma.serviceProgress.upsert({
    where: { userId_guideId: { userId: user.id, guideId: guide.id } },
    update: { step: body.step ?? current?.step ?? 0, checked: nextChecked },
    create: { userId: user.id, guideId: guide.id, step: body.step ?? 0, checked: nextChecked },
  });
  refreshViews();
  return Response.json({ step: progress.step, checked: progress.checked });
}
