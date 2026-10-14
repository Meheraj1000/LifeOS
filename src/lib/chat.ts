import { applyIntent } from "@/lib/apply-intent";
import { chatFailure, completeChat } from "@/lib/chat-model";
import { parseIntent } from "@/lib/intent";
import { prisma } from "@/lib/prisma";
import { todayIso } from "@/lib/dates";

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function loadThread(userId: string, id: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return null;
  return {
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role === "assistant" ? "assistant" as const : "user" as const,
      content: message.content,
    })),
  };
}

export async function listConversations(userId: string) {
  const rows = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
    preview: row.messages[0]?.content.slice(0, 80) ?? "",
  }));
}

export async function answerInConversation(userId: string, text: string, conversationId?: string) {
  const speech = text.trim();
  let conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId } })
    : null;
  if (conversationId && !conversation) return { error: "missing" as const };
  const createdNow = !conversation;
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId, title: speech.slice(0, 42) || "নতুন আলাপ" },
    });
  }

  const intent = parseIntent(speech, todayIso());
  let reply: string;
  try {
    if (intent.type === "unknown") {
      const earlier = await prisma.chatMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "desc" },
        take: 16,
      });
      earlier.reverse();
      const history: ChatTurn[] = earlier
        .filter((item) => item.role === "user" || item.role === "assistant")
        .map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));
      history.push({ role: "user", content: speech });
      reply = await completeChat(history);
    } else {
      const applied = await applyIntent(userId, speech);
      reply = applied.reply;
    }
  } catch (error) {
    if (createdNow) await prisma.conversation.delete({ where: { id: conversation.id } }).catch(() => undefined);
    const reason = error instanceof Error ? error.message : "down";
    return { error: "model" as const, message: chatFailure(speech, reason) };
  }

  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "user", content: speech } }),
    prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { title: createdNow ? speech.slice(0, 42) : conversation.title },
    }),
  ]);

  return {
    conversation: { id: conversation.id, title: createdNow ? speech.slice(0, 42) : conversation.title },
    intent: intent.type,
    userMessage: { id: userMessage.id, role: "user" as const, content: userMessage.content },
    assistantMessage: { id: assistantMessage.id, role: "assistant" as const, content: assistantMessage.content },
  };
}
