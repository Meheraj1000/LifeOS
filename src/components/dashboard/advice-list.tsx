"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ListPlus } from "lucide-react";
import type { NextStep } from "@/lib/advice";
import { priorityLabels } from "@/lib/labels";
import { Button } from "@/components/ui";

export function AdviceList({ steps }: { steps: NextStep[] }) {
  const router = useRouter();
  const [items, setItems] = useState(steps);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const fresh = items.filter((item) => !item.alreadyListed);

  async function add(keys: string[]) {
    if (keys.length === 0 || busy) return;
    setBusy(true);
    setNote("");
    const response = await fetch("/api/ai/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    });
    const payload = (await response.json()) as { created?: string[]; error?: string };
    setBusy(false);
    if (!response.ok) {
      setNote(payload.error ?? "কাজ যোগ করা যায়নি।");
      return;
    }
    const added = new Set(payload.created ?? []);
    setItems((current) => current.map((item) => (added.has(item.key) ? { ...item, alreadyListed: true } : item)));
    setNote(added.size > 0 ? "কাজের তালিকায় যোগ হয়েছে।" : "এগুলো আগে থেকেই তালিকায় আছে।");
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-line/80 bg-canopy/90 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-gold uppercase">পরবর্তী পদক্ষেপ</p>
          <h2 className="mt-1 font-display text-3xl">এখন যা করা দরকার</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-mist">নথি, বিল, বাজেট, কাজ ও পরিবার একসাথে দেখে সাজানো। এই তালিকা এই কম্পিউটারেই তৈরি হয়।</p>
        </div>
        {fresh.length > 0 && (
          <Button onClick={() => void add(fresh.map((item) => item.key))} disabled={busy}>
            <ListPlus size={16} />
            বাকি {fresh.length.toLocaleString("bn-BD")}টি যোগ করুন
          </Button>
        )}
      </div>
      {items.length === 0 && <p className="mt-4 text-sm text-mist">এখন জরুরি কিছু নেই। নতুন মেয়াদ বা বিল এলে এখানে উঠে আসবে।</p>}
      <ol className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <li key={item.key} className="grid gap-3 rounded-2xl border border-line/70 bg-forest/40 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className="font-display text-2xl text-gold">{(index + 1).toLocaleString("bn-BD")}</span>
            <div>
              <p className="text-sm">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-mist">{item.reason}</p>
              <p className="mt-1 text-[11px] text-gold">{priorityLabels[item.priority]} · {item.alreadyListed ? "তালিকায় আছে" : "এখনো যোগ হয়নি"}</p>
            </div>
            <div className="flex gap-2">
              <Link href={item.href} className="rounded-xl border border-line px-3 py-2 text-xs text-mist hover:border-gold/50">খুলুন</Link>
              {item.alreadyListed ? (
                <span className="inline-flex items-center gap-1 rounded-xl bg-moss px-3 py-2 text-xs text-mint"><Check size={14} />আছে</span>
              ) : (
                <Button className="px-3 py-2" onClick={() => void add([item.key])} disabled={busy}>যোগ করুন</Button>
              )}
            </div>
          </li>
        ))}
      </ol>
      {note && <p className="mt-3 text-sm text-gold">{note}</p>}
    </section>
  );
}
