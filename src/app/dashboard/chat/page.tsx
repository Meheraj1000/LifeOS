import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChatBoard } from "@/components/chat/chat-board";
import { listConversations, loadThread } from "@/lib/chat";
import { chatProvider } from "@/lib/chat-model";
import { getCurrentUser } from "@/lib/session";

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mist">কথা ঘর খুলছে...</p>}>
      <Room />
    </Suspense>
  );
}

async function Room() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const threads = await listConversations(user.id);
  const first = threads[0] ? await loadThread(user.id, threads[0].id) : null;
  return <ChatBoard initialThreads={threads} initialId={first?.id ?? null} initialMessages={first?.messages ?? []} ownModel={chatProvider().own} />;
}
