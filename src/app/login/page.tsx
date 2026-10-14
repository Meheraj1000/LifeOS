"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("01711223344");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "লগইন হয়নি।");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-gold/30 bg-canopy p-6">
        <p className="font-display text-sm text-gold">LifeOS BD</p>
        <h1 className="mt-2 font-display text-3xl">আবার স্বাগতম</h1>
        <p className="mt-2 text-sm leading-7 text-mist">মোবাইল নম্বর দিয়ে ঢুকুন। নমুনা হিসাব দেখতে ০১৭১১২২৩৩৪৪ ব্যবহার করুন।</p>
        <div className="mt-5">
          <Field label="মোবাইল নম্বর">
            <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
          </Field>
        </div>
        {error && <p className="mt-3 text-sm text-coral">{error}</p>}
        <Button className="mt-5 w-full" type="submit" disabled={pending}>{pending ? "ঢুকছি..." : "ঢুকুন"}</Button>
      </form>
    </main>
  );
}
