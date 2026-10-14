import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FinanceBoard } from "@/components/finance/finance-board";
import { PageIntro } from "@/components/ui";
import { shiftMonth } from "@/lib/format";
import { monthKey, todayIso } from "@/lib/dates";
import { loadFinance } from "@/lib/load";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";

type Props = { searchParams: Promise<{ month?: string }> };

export default function FinancePage({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-mist">হিসাব আসছে...</p>}>
      <Finance searchParams={searchParams} />
    </Suspense>
  );
}

async function Finance({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : monthKey(todayIso());
  const data = await loadFinance(user.id, month);
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageIntro eyebrow="খাতা" title="আয়-ব্যয়" text="বাজার, বিল, শিক্ষা, স্বাস্থ্য, যাতায়াত ও কিস্তি। বিকাশ, নগদ বা রকেট দিয়ে বিল বন্ধ করার সিমুলেটর আছে — টাকা কাটা হয় না।" />
        <div className="flex gap-2 text-sm">
          <Link className="rounded-xl border border-line px-3 py-2" href={`/dashboard/finance?month=${previous}`}>আগে</Link>
          <Link className="rounded-xl border border-line px-3 py-2" href={`/dashboard/finance?month=${next}`}>পরে</Link>
        </div>
      </div>
      <FinanceBoard month={data.month} expenses={data.expenses} incomes={data.incomes} budgets={data.budgets} bills={data.bills} />
    </div>
  );
}
