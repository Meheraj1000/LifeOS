import { DocumentCategory } from "@prisma/client";
import { queueDueAlerts, syncDocumentStatuses } from "@/lib/alerts";
import { refreshViews, requireUser } from "@/lib/api";
import { dateOnly } from "@/lib/dates";
import { documentCategories, documentLabels } from "@/lib/labels";
import { presentDocument } from "@/lib/present";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";

function isCategory(value: string | undefined): value is DocumentCategory {
  return documentCategories.includes(value as DocumentCategory);
}

async function readBody(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    return {
      category: String(form.get("category") ?? ""),
      title: String(form.get("title") ?? ""),
      number: String(form.get("number") ?? ""),
      holderName: String(form.get("holderName") ?? ""),
      issueDate: String(form.get("issueDate") ?? ""),
      expiryDate: String(form.get("expiryDate") ?? ""),
      familyMemberId: String(form.get("familyMemberId") ?? ""),
      file: file instanceof File && file.size > 0 ? file : null,
    };
  }
  const json = (await request.json()) as Record<string, string>;
  return { ...json, file: null as File | null };
}

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return error;
  await syncDocumentStatuses(user.id);
  const documents = await prisma.document.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return Response.json({ documents: documents.map((document) => presentDocument(document)) });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = await readBody(request);
  if (!isCategory(body.category) || !body.number?.trim() || !body.holderName?.trim()) {
    return Response.json({ error: "ধরন, নম্বর ও ধারকের নাম দিন।" }, { status: 400 });
  }
  const created = await prisma.document.create({
    data: {
      userId: user.id,
      category: body.category,
      title: body.title?.trim() || documentLabels[body.category],
      number: body.number.trim(),
      holderName: body.holderName.trim(),
      issueDate: body.issueDate ? dateOnly(body.issueDate) : null,
      expiryDate: body.expiryDate ? dateOnly(body.expiryDate) : null,
      familyMemberId: body.familyMemberId || null,
    },
  });
  if (body.file) {
    try {
      const saved = await saveUpload(user.id, created.id, body.file);
      await prisma.document.update({
        where: { id: created.id },
        data: { fileName: saved.fileName, fileUrl: saved.stored },
      });
    } catch (uploadError) {
      await prisma.document.delete({ where: { id: created.id } });
      const message = uploadError instanceof Error ? uploadError.message : "ফাইল রাখা যায়নি।";
      return Response.json({ error: message }, { status: 400 });
    }
  }
  await queueDueAlerts(user.id);
  refreshViews();
  const fresh = await prisma.document.findUniqueOrThrow({ where: { id: created.id } });
  return Response.json({ document: presentDocument(fresh) }, { status: 201 });
}
