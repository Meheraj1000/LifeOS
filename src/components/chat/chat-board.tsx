"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Plus, Send, Trash2 } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { listenOnce } from "@/lib/speech";

type Thread = { id: string; title: string; preview: string };
type Bubble = { id: string; role: "user" | "assistant"; content: string };

const starters = ["চায়ের ইতিহাস একটু বলো", "আজ রাতে হালকা রান্না কী হতে পারে", "Write a short note I can send to a friend"];

export function ChatBoard({
  initialThreads,
  initialId,
  initialMessages,
  ownModel,
}: {
  initialThreads: Thread[];
  initialId: string | null;
  initialMessages: Bubble[];
  ownModel: boolean;
}) {
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [messages, setMessages] = useState<Bubble[]>(initialMessages);
  const [loadedId, setLoadedId] = useState<string | null>(initialId);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  async function openThread(id: string) {
    setActiveId(id);
    setError("");
    const response = await fetch(`/api/ai/chat?id=${id}`);
    const payload = (await response.json()) as { messages?: Bubble[]; error?: string };
    if (!response.ok) {
      setError(payload.error ?? "আলাপ খোলা যায়নি।");
      return;
    }
    setMessages(payload.messages ?? []);
    setLoadedId(id);
    scrollDown();
  }

  function scrollDown() {
    window.setTimeout(() => {
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
    }, 30);
  }

  async function send(text: string) {
    const speech = text.trim();
    if (speech.length < 2 || pending) return;
    if (activeId && loadedId !== activeId) await openThread(activeId);
    setPending(true);
    setError("");
    setDraft("");
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: speech, conversationId: activeId ?? undefined }),
    });
    const payload = (await response.json()) as {
      error?: string;
      intent?: string;
      conversation?: { id: string; title: string };
      userMessage?: Bubble;
      assistantMessage?: Bubble;
    };
    setPending(false);
    if (!response.ok || !payload.conversation || !payload.userMessage || !payload.assistantMessage) {
      setDraft(speech);
      setError(payload.error ?? "উত্তর আসেনি।");
      return;
    }
    setActiveId(payload.conversation.id);
    setLoadedId(payload.conversation.id);
    setMessages((current) => [...current, payload.userMessage!, payload.assistantMessage!]);
    setThreads((current) => {
      const next = { id: payload.conversation!.id, title: payload.conversation!.title, preview: payload.assistantMessage!.content.slice(0, 80) };
      return [next, ...current.filter((item) => item.id !== next.id)];
    });
    if (payload.intent === "expense" || payload.intent === "income" || payload.intent === "task") router.refresh();
    scrollDown();
  }

  async function speak() {
    setPending(true);
    const heard = await listenOnce();
    setPending(false);
    if (heard) await send(heard);
    else setError("কথা শোনা যায়নি। লিখে পাঠাতে পারেন।");
  }

  function startNew() {
    setActiveId(null);
    setLoadedId(null);
    setMessages([]);
    setError("");
  }

  async function removeThread(id: string) {
    await fetch(`/api/ai/chat?id=${id}`, { method: "DELETE" });
    const next = threads.filter((item) => item.id !== id);
    setThreads(next);
    if (activeId === id) startNew();
  }

  const visible = activeId && loadedId !== activeId ? [] : messages;

  return (
    <div className="grid h-[calc(100dvh-12rem)] gap-4 lg:h-[calc(100dvh-8rem)] lg:grid-cols-[240px_1fr]">
      <aside className="flex min-h-0 flex-col rounded-3xl border border-line/80 bg-canopy/90 p-3">
        <Button onClick={startNew} className="w-full"><Plus size={16} />নতুন আলাপ</Button>
        <ul className="mt-3 grid gap-1 overflow-auto">
          {threads.length === 0 && <li className="px-2 py-3 text-sm text-mist">এখনো কোনো আলাপ নেই।</li>}
          {threads.map((thread) => (
            <li key={thread.id} className="flex items-start gap-1">
              <button type="button" onClick={() => void openThread(thread.id)} className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-left ${activeId === thread.id ? "bg-moss" : "hover:bg-leaf"}`}>
                <span className="block truncate text-sm">{thread.title}</span>
                <span className="block truncate text-xs text-mist">{thread.preview}</span>
              </button>
              <button type="button" aria-label="আলাপ মুছুন" onClick={() => void removeThread(thread.id)} className="rounded-lg p-2 text-mist hover:text-coral">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-0 flex-col rounded-3xl border border-gold/30 bg-[linear-gradient(180deg,#102920,#0c1f1a)]">
        <header className="border-b border-line/70 px-4 py-3">
          <h1 className="font-display text-2xl">কথা ঘর</h1>
          <p className="text-xs leading-5 text-mist">
            {ownModel
              ? "আপনার নিজের মডেল উত্তর দিচ্ছে।"
              : "সাধারণ আলাপ একটি পাবলিক মডেলে যায়। নথি, এনআইডি বা বিল সেখানে পাঠানো হয় না।"}
          </p>
        </header>
        <div ref={scroller} className="flex-1 space-y-3 overflow-auto px-4 py-4">
          {visible.length === 0 && !pending && (
            <div className="mx-auto max-w-lg pt-8 text-center">
              <p className="font-display text-3xl">যা ইচ্ছে জিজ্ঞেস করুন</p>
              <p className="mt-2 text-sm leading-7 text-mist">পড়াশোনা, রান্না, ভ্রমণ, চিঠি, বা শুধু একটা কথা। খরচ বা কাজ বললে সেটি হিসাবেও যোগ হবে।</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {starters.map((starter) => (
                  <button key={starter} type="button" onClick={() => void send(starter)} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold-soft hover:border-gold/70">
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}
          {visible.map((message) => (
            <p key={message.id} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user" ? "ml-auto bg-gold text-forest" : "bg-moss/80 text-cream"}`}>
              {message.content}
            </p>
          ))}
          {pending && <p className="text-sm text-gold">ভাবছি...</p>}
          {error && <p className="text-sm text-coral">{error}</p>}
        </div>
        <form className="flex gap-2 border-t border-line/70 p-3" onSubmit={(event) => { event.preventDefault(); void send(draft); }}>
          <button type="button" aria-label="কথা বলুন" onClick={() => void speak()} disabled={pending} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-gold">
            <Mic size={18} />
          </button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="যা খুশি লিখুন..." className={inputClass} aria-label="আপনার কথা" />
          <Button type="submit" disabled={pending || draft.trim().length < 2} aria-label="পাঠান"><Send size={16} /></Button>
        </form>
      </section>
    </div>
  );
}
