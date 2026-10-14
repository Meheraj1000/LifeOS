import { acceptAdvice, recommendNextSteps } from "@/lib/advice";
import { refreshViews, requireUser } from "@/lib/api";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return error;
  const steps = await recommendNextSteps(user.id);
  return Response.json({ steps });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json().catch(() => null)) as { keys?: string[] } | null;
  const keys = Array.isArray(body?.keys) ? body.keys.filter((key) => typeof key === "string").slice(0, 8) : [];
  if (keys.length === 0) return Response.json({ error: "কোনো পদক্ষেপ বাছা হয়নি।" }, { status: 400 });
  const created = await acceptAdvice(user.id, keys);
  refreshViews();
  return Response.json({ created: created.map((task) => task.notes?.replace("advice:", "") ?? task.id) });
}
