import { refreshViews, requireUser } from "@/lib/api";
import { answerInConversation, listConversations } from "@/lib/chat";
import { chatProvider } from "@/lib/chat-model";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return Response.json({ conversations: await listConversations(user.id), ownModel: chatProvider().own });
  }
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return Response.json({ error: "আলাপটি পাওয়া যায়নি।" }, { status: 404 });
  return Response.json({
    conversation: { id: conversation.id, title: conversation.title },
    messages: conversation.messages.map((message) => ({ id: message.id, role: message.role, content: message.content })),
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json().catch(() => null)) as { text?: string; conversationId?: string } | null;
  const text = body?.text?.trim() ?? "";
  if (text.length < 2) return Response.json({ error: "একটু লিখে বা বলে তারপর পাঠান।" }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: "একবারে এত লম্বা না লিখে দুই ভাগে পাঠান।" }, { status: 400 });
  const result = await answerInConversation(user.id, text, body?.conversationId);
  if ("error" in result && result.error === "missing") {
    return Response.json({ error: "আলাপটি পাওয়া যায়নি।" }, { status: 404 });
  }
  if ("error" in result && result.error === "model") {
    return Response.json({ error: result.message }, { status: 503 });
  }
  if ("error" in result) return Response.json({ error: "উত্তর আসেনি।" }, { status: 500 });
  if (result.intent === "expense" || result.intent === "income" || result.intent === "task") refreshViews();
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "আলাপটি বাছুন।" }, { status: 400 });
  const existing = await prisma.conversation.findFirst({ where: { id, userId: user.id } });
  if (!existing) return Response.json({ error: "আলাপটি পাওয়া যায়নি।" }, { status: 404 });
  await prisma.conversation.delete({ where: { id } });
  return Response.json({ ok: true });
}
