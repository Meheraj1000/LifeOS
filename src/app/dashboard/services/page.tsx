import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { loadServices } from "@/lib/load";
import { getCurrentUser } from "@/lib/session";

export default function ServicesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mist">সেবা আসছে...</p>}>
      <Services />
    </Suspense>
  );
}

async function Services() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const guides = await loadServices(user.id);
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="সরকারি সেবা" title="সেবা সহকারী" text="সেবা বাছলে কাগজ, ফি, ধাপ ও কাছের অফিস নিজে থেকে সাজানো হয়। তালিকায় টিক দিলে অগ্রগতি সেভ হয়।" />
      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Panel key={guide.slug}>
            <p className="text-xs text-gold">{guide.office}</p>
            <h2 className="mt-1 font-display text-3xl">{guide.title}</h2>
            <p className="mt-2 text-sm leading-7 text-mist">{guide.summary}</p>
            <p className="mt-3 text-xs text-muted">{formatNumber(guide.steps)} ধাপ · কাগজ {formatNumber(guide.checked)}/{formatNumber(guide.required)}</p>
            <Link href={`/dashboard/services/${guide.slug}`} className="mt-4 inline-block text-sm font-semibold text-gold">নির্দেশনা দেখুন</Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
