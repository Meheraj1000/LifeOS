"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Mic, Sparkles } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { listenOnce } from "@/lib/speech";

const samples = [
  "আগামীকাল সকালে ৩০০ টাকা বাজারে খরচ করেছি",
  "আগামীকাল ডেসকো বিল মনে করিয়ে দিন",
  "পাসপোর্টের মেয়াদ কত দিন বাকি",
  "ই-নামজারিতে কী কাগজ লাগবে",
];

type Result = { reply: string; href?: string | null; intent: { type: string }; steps?: { label: string; detail: string }[] };

export function VoicePanel() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "listening" | "working">("idle");
  const [draft, setDraft] = useState("");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const index = useRef(0);

  async function submit(text: string) {
    const speech = text.trim();
    if (speech.length < 2) return;
    setPhase("working");
    setError("");
    setTranscript(speech);
    const response = await fetch("/api/ai/voice-parser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: speech }),
    });
    const payload = (await response.json()) as Result & { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "এই মুহূর্তে বোঝা যায়নি।");
      setPhase("idle");
      return;
    }
    setResult(payload);
    setDraft("");
    setPhase("idle");
    if (payload.intent.type === "expense" || payload.intent.type === "income" || payload.intent.type === "task") router.refresh();
  }

  async function listen() {
    setPhase("listening");
    setResult(null);
    const heard = await listenOnce();
    if (heard) {
      await submit(heard);
      return;
    }
    const sample = samples[index.current % samples.length];
    index.current += 1;
    await submit(sample);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold/35 bg-[radial-gradient(circle_at_85%_15%,rgba(224,180,90,0.2),transparent_32%),linear-gradient(155deg,#12382e,#0c241d)] p-5 sm:p-8">
      <div className="grid items-center gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="flex items-center gap-2 text-xs tracking-[0.16em] text-gold-soft uppercase">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-moss text-gold"><Sparkles size={14} /></span>
            বাংলা ভয়েস সহকারী
          </p>
          <h2 className="mt-4 font-display text-3xl leading-snug sm:text-4xl">কীভাবে সাহায্য করতে পারি?</h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-mist">বললেই সঙ্গে সঙ্গে তিনটি কথা পাবেন: কী বুঝেছি, কী করেছি, এরপর কী করবেন। লম্বা আলাপ <Link href="/dashboard/chat" className="text-gold-soft underline">কথা ঘরে</Link>।</p>
          <Button className="mt-5" onClick={listen} disabled={phase !== "idle"}>
            <Mic size={18} />
            {phase === "listening" ? "শুনছি..." : phase === "working" ? "বুঝে নিচ্ছি..." : "কথা বলুন"}
          </Button>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void submit(draft); }}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="যেমন: আগামীকাল সকালে ৩০০ টাকা বাজারে খরচ করেছি" className={inputClass} aria-label="সহকারীকে লিখে বলুন" />
            <Button type="submit" variant="ghost" disabled={phase !== "idle" || draft.trim().length < 2}>বুঝে নিন</Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {samples.map((sample) => (
              <button key={sample} type="button" disabled={phase !== "idle"} onClick={() => void submit(sample)} className="rounded-full border border-gold/25 px-3 py-1 text-left text-xs text-gold-soft hover:border-gold/60">
                {sample}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mx-auto grid h-44 w-44 place-items-center" aria-hidden>
          <span className={`ripple absolute h-28 w-28 rounded-full border border-gold/40 ${phase === "listening" ? "ripple-fast" : ""}`} />
          <span className="grid h-20 w-20 place-items-center rounded-full bg-gold text-forest"><Mic size={28} /></span>
        </div>
      </div>
      {(result || error) && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4" aria-live="polite">
          <p className="text-xs text-gold">আপনি বলেছেন</p>
          <p className="mt-1 font-display text-xl">{transcript}</p>
          {error && <p className="mt-2 text-sm text-coral">{error}</p>}
          {result?.steps && result.steps.length > 0 ? (
            <ol className="mt-3 grid gap-2">
              {result.steps.map((step) => (
                <li key={step.label} className="rounded-xl bg-forest/50 px-3 py-2">
                  <span className="text-xs text-gold">{step.label}</span>
                  <span className="mt-1 block text-sm leading-6">{step.detail}</span>
                </li>
              ))}
            </ol>
          ) : (
            result && <p className="mt-2 flex gap-2 text-sm leading-6 text-mist"><Check size={16} className="mt-1 shrink-0 text-mint" />{result.reply}</p>
          )}
          {result?.href && <Link href={result.href} className="mt-3 inline-flex rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-forest">পরের কাজ খুলুন</Link>}
        </div>
      )}
    </section>
  );
}
