"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass, Modal, Panel } from "@/components/ui";
import { formatNumber, formatTaka, percent } from "@/lib/format";
import { expenseCategories, expenseColors, expenseHints, expenseLabels, paymentLabels, paymentMethods, providerLabels } from "@/lib/labels";
import type { BillView, MoneyView } from "@/lib/present";
import { MoneyCharts } from "@/components/finance/money-charts";

type Budget = { category: string; limit: number };

export function FinanceBoard({
  month,
  expenses,
  incomes,
  budgets,
  bills,
}: {
  month: string;
  expenses: MoneyView[];
  incomes: MoneyView[];
  budgets: Budget[];
  bills: BillView[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"expense" | "income" | null>(null);
  const [editing, setEditing] = useState<MoneyView | null>(null);
  const [pay, setPay] = useState<BillView | null>(null);
  const [method, setMethod] = useState("BKASH");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const earned = incomes.reduce((sum, item) => sum + item.amount, 0);
  const slices = expenseCategories.map((category) => ({
    category,
    amount: expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0),
  }));

  async function saveMoney(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const url = open === "income" ? "/api/finance/incomes" : editing ? `/api/finance/expenses/${editing.id}` : "/api/finance/expenses";
    const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setMessage(body.error ?? "সংরক্ষণ হয়নি।");
      return;
    }
    setOpen(null);
    setEditing(null);
    setMessage("হিসাব যোগ হয়েছে।");
    router.refresh();
  }

  async function payBill() {
    if (!pay) return;
    setPending(true);
    const response = await fetch(`/api/bills/${pay.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: method }),
    });
    const body = (await response.json()) as { error?: string; message?: string; reference?: string };
    setPending(false);
    if (!response.ok) {
      setMessage(body.error ?? "পেমেন্ট হয়নি।");
      return;
    }
    setMessage(`${body.message} রেফারেন্স ${body.reference}`);
    setPay(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel><p className="text-xs text-mist">আয়</p><p className="font-display text-3xl text-mint">{formatTaka(earned)}</p></Panel>
        <Panel><p className="text-xs text-mist">খরচ</p><p className="font-display text-3xl">{formatTaka(spent)}</p></Panel>
        <Panel><p className="text-xs text-mist">হাতে থাকে</p><p className="font-display text-3xl text-gold">{formatTaka(earned - spent)}</p></Panel>
      </div>
      <Panel><MoneyCharts spent={spent} earned={earned} slices={slices} /></Panel>
      <Panel>
        <h2 className="font-display text-2xl">বাজেট</h2>
        <div className="mt-4 grid gap-3">
          {expenseCategories.map((category) => {
            const limit = budgets.find((item) => item.category === category)?.limit ?? 0;
            const amount = slices.find((item) => item.category === category)?.amount ?? 0;
            const ratio = percent(amount, limit);
            return (
              <div key={category}>
                <div className="mb-1 flex justify-between text-sm"><span>{expenseLabels[category]}</span><span className="text-mist">{formatTaka(amount)} / {formatTaka(limit)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-forest"><div className="h-full" style={{ width: `${Math.min(ratio, 100)}%`, background: expenseColors[category] }} /></div>
                <p className="mt-1 text-xs text-muted">{expenseHints[category]}{ratio >= 90 ? " · বাজেট প্রায় শেষ" : ""}</p>
              </div>
            );
          })}
        </div>
      </Panel>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setEditing(null); setOpen("expense"); }}>খরচ যোগ</Button>
        <Button variant="ghost" onClick={() => { setEditing(null); setOpen("income"); }}>আয় যোগ</Button>
        <Button variant="ghost" onClick={async () => { const response = await fetch("/api/bills/refresh", { method: "POST" }); const body = await response.json(); setMessage(body.message); router.refresh(); }}>বিল হালনাগাদ</Button>
      </div>
      {message && <p className="text-sm text-mist">{message}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-2xl">এই মাসের খরচ</h2>
          <ul className="mt-3 divide-y divide-line/70">
            {expenses.length === 0 && <li className="py-4 text-sm text-mist">এই মাসে খরচ নেই।</li>}
            {expenses.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1"><span className="block">{item.notes}</span><span className="text-xs text-mist">{expenseLabels[item.category as keyof typeof expenseLabels]} · {item.date}</span></span>
                <span>{formatTaka(item.amount)}</span>
                <button type="button" className="text-xs text-gold" onClick={() => { setEditing(item); setOpen("expense"); }}>ঠিক করুন</button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-display text-2xl">ইউটিলিটি বিল</h2>
          <ul className="mt-3 divide-y divide-line/70">
            {bills.map((bill) => (
              <li key={bill.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block">{providerLabels[bill.provider as keyof typeof providerLabels]}</span>
                  <span className="text-xs text-mist">{bill.accountNo} · {bill.isPaid ? "পরিশোধিত" : `${formatNumber(bill.days ?? 0)} দিন`}</span>
                </span>
                <span>{formatTaka(bill.amount)}</span>
                {!bill.isPaid && <Button onClick={() => { setPay(bill); setMethod("BKASH"); }}>পরিশোধ</Button>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Modal open={open !== null} title={open === "income" ? "আয় যোগ" : editing ? "খরচ সংশোধন" : "খরচ যোগ"} onClose={() => { setOpen(null); setEditing(null); }}>
        <form className="grid gap-3" onSubmit={saveMoney}>
          {open === "expense" && (
            <Field label="খাত">
              <select name="category" className={inputClass} defaultValue={editing?.category ?? "GROCERY"}>
                {expenseCategories.map((item) => <option key={item} value={item}>{expenseLabels[item]}</option>)}
              </select>
            </Field>
          )}
          {open === "income" && <Field label="উৎস"><input name="category" className={inputClass} defaultValue="বেতন" /></Field>}
          <Field label="পরিমাণ"><input name="amount" className={inputClass} inputMode="decimal" defaultValue={editing?.amount ?? ""} required /></Field>
          <Field label="তারিখ"><input type="date" name="date" className={inputClass} defaultValue={editing?.date ?? `${month}-01`} required /></Field>
          <Field label="মাধ্যম">
            <select name="paymentMethod" className={inputClass} defaultValue={editing?.paymentMethod ?? "CASH"}>
              {paymentMethods.map((item) => <option key={item} value={item}>{paymentLabels[item]}</option>)}
            </select>
          </Field>
          <Field label="নোট"><input name="notes" className={inputClass} defaultValue={editing?.notes ?? ""} /></Field>
          <Button type="submit" disabled={pending}>{pending ? "রাখা হচ্ছে..." : "সংরক্ষণ"}</Button>
        </form>
      </Modal>
      <Modal open={pay !== null} title="পেমেন্ট সিমুলেটর" onClose={() => setPay(null)}>
        <p className="text-sm leading-7 text-mist">বিকাশ, নগদ বা রকেটের মতো দেখিয়ে বিল বন্ধ করা হবে। কোনো টাকা কাটা হবে না।</p>
        <Field label="মাধ্যম">
          <select className={`${inputClass} mt-3`} value={method} onChange={(event) => setMethod(event.target.value)}>
            <option value="BKASH">বিকাশ</option>
            <option value="NAGAD">নগদ অ্যাপ</option>
            <option value="ROCKET">রকেট</option>
          </select>
        </Field>
        <Button className="mt-4" onClick={payBill} disabled={pending}>নিশ্চিত করুন</Button>
      </Modal>
    </div>
  );
}
