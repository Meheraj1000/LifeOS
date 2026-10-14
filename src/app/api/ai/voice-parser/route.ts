import { refreshViews, requireUser } from "@/lib/api";
import { applyIntent } from "@/lib/apply-intent";

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim() ?? "";
  if (text.length < 2) {
    return Response.json({ error: "অনুগ্রহ করে একটু পরিষ্কার করে বলুন বা লিখুন।" }, { status: 400 });
  }
  const result = await applyIntent(user.id, text);
  refreshViews();
  return Response.json(result);
}
