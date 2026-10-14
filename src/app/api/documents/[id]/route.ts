import { DocumentCategory } from "@prisma/client";
import { queueDueAlerts } from "@/lib/alerts";
import { readJson, refreshViews, requireUser } from "@/lib/api";
import { dateOnly } from "@/lib/dates";
import { documentCategories } from "@/lib/labels";
import { presentDocument } from "@/lib/present";
import { prisma } from "@/lib/prisma";
import { removeUpload } from "@/lib/uploads";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return Response.json({ error: "তথ্য পড়া যায়নি।" }, { status: 400 });
  const existing = await prisma.document.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "নথিটি পাওয়া যায়নি।" }, { status: 404 });
  const category = String(body.category ?? existing.category);
  if (!documentCategories.includes(category as DocumentCategory)) {
    return Response.json({ error: "নথির ধরন ঠিক নয়।" }, { status: 400 });
  }
  const updated = await prisma.document.update({
    where: { id },
    data: {
      category: category as DocumentCategory,
      title: String(body.title ?? existing.title),
      number: String(body.number ?? existing.number),
      holderName: String(body.holderName ?? existing.holderName),
      issueDate: body.issueDate ? dateOnly(String(body.issueDate)) : body.issueDate === "" ? null : existing.issueDate,
      expiryDate: body.expiryDate ? dateOnly(String(body.expiryDate)) : body.expiryDate === "" ? null : existing.expiryDate,
      familyMemberId:
        body.familyMemberId === undefined ? existing.familyMemberId : String(body.familyMemberId) || null,
    },
  });
  await queueDueAlerts(user.id);
  refreshViews();
  return Response.json({ document: presentDocument(updated) });
}

export async function DELETE(_request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const existing = await prisma.document.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "নথিটি পাওয়া যায়নি।" }, { status: 404 });
  await removeUpload(existing.fileUrl);
  await prisma.document.delete({ where: { id } });
  refreshViews();
  return Response.json({ ok: true });
}
