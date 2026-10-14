import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdviceList } from "@/components/dashboard/advice-list";
import { VoicePanel } from "@/components/dashboard/voice-panel";
import { ExpiryBadge, Panel } from "@/components/ui";
import { recommendNextSteps } from "@/lib/advice";
import { formatNumber, formatTaka, monthLabel } from "@/lib/format";
import { providerLabels } from "@/lib/labels";
import { loadOverview } from "@/lib/load";
import { getCurrentUser } from "@/lib/session";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mist">ড্যাশবোর্ড আসছে...</p>}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [data, advice] = await Promise.all([loadOverview(user.id), recommendNextSteps(user.id)]);
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-gold">স্বাগতম, {user.name}</p>
        <h1 className="mt-1 font-display text-4xl">আজকের দিনটি যেন গুছিয়ে যায়</h1>
        <p className="mt-2 text-sm text-mist">বললেই হিসাব বদলায়, আর নিচে পুরো হিসাব থেকে পরের কাজ সাজানো থাকে।</p>
      </header>
      <VoicePanel />
      <AdviceList steps={advice} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric href="/dashboard/vault" label="ডকুমেন্ট সতর্কতা" value={`${formatNumber(data.alertCount)}টি`} detail="৬০ দিনের মধ্যে" />
        <Metric href="/dashboard/finance" label="এই মাসের খরচ" value={formatTaka(data.spent)} detail={monthLabel(data.month)} />
        <Metric href="/dashboard/tasks" label="আজকের কাজ" value={`${formatNumber(data.doneToday)}/${formatNumber(data.todayTotal)}`} detail="টিক দিলেই হয়ে যাবে" />
        <Metric href="/dashboard/services" label="সেবা কেন্দ্র" value={`${formatNumber(data.guides.length)}টি`} detail="ধাপে ধাপে" />
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <h2 className="font-display text-2xl">মেয়াদের খবর</h2>
          <ul className="mt-3 divide-y divide-line/70">
            {data.documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 py-3">
                <span><span className="block text-sm">{document.title}</span><span className="text-xs text-mist">{document.holderName}</span></span>
                <ExpiryBadge tone={document.tone} label={document.label} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-display text-2xl">কাছের কাজ</h2>
          <ul className="mt-3 grid gap-2">
            {data.tasks.map((task) => <li key={task.id} className="text-sm">{task.title}<span className="mt-1 block text-xs text-mist">{task.dueDate}</span></li>)}
          </ul>
        </Panel>
      </div>
      <Panel>
        <h2 className="font-display text-2xl">বাকি বিল</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {data.bills.map((bill) => (
            <li key={bill.id} className="rounded-2xl border border-line px-3 py-3 text-sm">
              <span className="block">{providerLabels[bill.provider as keyof typeof providerLabels]}</span>
              <span className="text-gold">{formatTaka(bill.amount)}</span>
              <Link href="/dashboard/finance" className="mt-2 block text-xs text-mist">পরিশোধের পাতা</Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Metric({ href, label, value, detail }: { href: string; label: string; value: string; detail: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-line/80 bg-canopy p-4 hover:border-gold/40">
      <span className="text-xs text-mist">{label}</span>
      <strong className="mt-2 block font-display text-3xl font-medium">{value}</strong>
      <span className="mt-1 block text-xs text-muted">{detail}</span>
    </Link>
  );
}
