import { requireUser } from "@/lib/api";
import { documentCategories } from "@/lib/labels";
import { simulateOcr } from "@/lib/uploads";

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json().catch(() => null)) as { fileName?: string; category?: string } | null;
  const fileName = body?.fileName?.trim() ?? "";
  const category = body?.category ?? "NID";
  if (!fileName) return Response.json({ error: "ফাইলের নাম পাওয়া যায়নি।" }, { status: 400 });
  if (!documentCategories.includes(category as (typeof documentCategories)[number])) {
    return Response.json({ error: "নথির ধরন ঠিক নয়।" }, { status: 400 });
  }
  return Response.json(simulateOcr(fileName, category));
}
