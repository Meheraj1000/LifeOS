import path from "path";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/uploads";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const { id } = await context.params;
  const document = await prisma.document.findFirst({ where: { id, userId: user.id } });
  if (!document?.fileUrl) return Response.json({ error: "ফাইল নেই।" }, { status: 404 });
  const data = await readUpload(document.fileUrl);
  if (!data) return Response.json({ error: "ফাইল খোলা যায়নি।" }, { status: 404 });
  const extension = path.extname(document.fileName ?? "").toLowerCase();
  const type = extension === ".pdf" ? "application/pdf" : extension === ".png" ? "image/png" : "image/jpeg";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName ?? "document")}"`,
    },
  });
}
