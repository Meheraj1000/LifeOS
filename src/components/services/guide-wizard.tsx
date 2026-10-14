"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { cn, formatNumber } from "@/lib/format";

type Guide = {
  slug: string;
  title: string;
  summary: string;
  office: string;
  portal: string;
  steps: { title: string; body: string }[];
  documentsRequired: { id: string; label: string }[];
  fees: { label: string; amount: string }[];
  tips: string[];
  branches: { name: string; address: string; district: string }[];
  step: number;
  checked: string[];
};

export function GuideWizard({ guide }: { guide: Guide }) {
  const router = useRouter();
  const [step, setStep] = useState(guide.step);
  const [checked, setChecked] = useState(guide.checked);
  const current = guide.steps[Math.min(step, guide.steps.length - 1)];

  async function move(next: number) {
    setStep(next);
    await fetch(`/api/services/${guide.slug}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: next }),
    });
    router.refresh();
  }

  async function toggle(id: string) {
    setChecked((currentChecked) => (currentChecked.includes(id) ? currentChecked.filter((item) => item !== id) : [...currentChecked, id]));
    await fetch(`/api/services/${guide.slug}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkId: id }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Link href="/dashboard/services" className="inline-flex items-center gap-1 text-sm text-gold"><ChevronLeft size={16} /> সব সেবা</Link>
      <header>
        <p className="text-xs tracking-[0.16em] text-gold uppercase">{guide.office}</p>
        <h1 className="mt-2 font-display text-4xl">{guide.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-mist">{guide.summary}</p>
        <a href={guide.portal} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gold-soft">অফিসিয়াল পোর্টাল</a>
      </header>
      <div className="grid gap-4 xl:grid-cols-[240px_1fr_300px]">
        <Panel>
          <ol className="grid gap-2">
            {guide.steps.map((item, index) => (
              <li key={item.title}>
                <button type="button" onClick={() => void move(index)} className={cn("flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm", index === step ? "bg-moss" : "text-mist")}>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-xs text-forest">{formatNumber(index + 1)}</span>
                  {item.title}
                </button>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <h2 className="font-display text-3xl">{current?.title}</h2>
          <p className="mt-3 text-sm leading-8 text-mist">{current?.body}</p>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" disabled={step === 0} onClick={() => void move(step - 1)}>আগের ধাপ</Button>
            <Button disabled={step >= guide.steps.length - 1} onClick={() => void move(step + 1)}>পরের ধাপ</Button>
          </div>
          <p className="mt-5 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm leading-7 text-gold-soft">ফি ও কাগজ বদলাতে পারে। আবেদনের আগে অফিসিয়াল সাইটে মিলিয়ে নেবেন।</p>
        </Panel>
        <div className="grid gap-4">
          <Panel>
            <h2 className="font-display text-xl">প্রয়োজনীয় কাগজ</h2>
            <p className="text-xs text-mist">{formatNumber(checked.length)} / {formatNumber(guide.documentsRequired.length)}</p>
            <ul className="mt-3 grid gap-2">
              {guide.documentsRequired.map((item) => {
                const on = checked.includes(item.id);
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => void toggle(item.id)} className="flex items-start gap-2 text-left text-sm">
                      <span className={cn("mt-0.5 grid h-5 w-5 place-items-center rounded-md border", on ? "border-mint bg-mint text-forest" : "border-line")}>{on && <Check size={12} />}</span>
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel>
            <h2 className="font-display text-xl">আনুমানিক ফি</h2>
            <ul className="mt-2 divide-y divide-line/70 text-sm">{guide.fees.map((fee) => <li key={fee.label} className="flex justify-between gap-3 py-2"><span className="text-mist">{fee.label}</span><span>{fee.amount}</span></li>)}</ul>
          </Panel>
          <Panel>
            <h2 className="font-display text-xl">পরামর্শ</h2>
            <ul className="mt-2 grid gap-2 text-sm text-mist">{guide.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          </Panel>
          <Panel>
            <h2 className="font-display text-xl">কাছের অফিস</h2>
            <ul className="mt-2 grid gap-2 text-sm">{guide.branches.map((branch) => <li key={branch.name}><span className="block">{branch.name}</span><span className="text-xs text-mist">{branch.address}, {branch.district}</span></li>)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
