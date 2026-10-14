"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-display text-3xl">তথ্য আনা যায়নি</h1>
      <p className="mt-3 text-sm leading-7 text-mist">ডাটাবেস বা নেটওয়ার্ক একটু ব্যস্ত থাকতে পারে। আবার চেষ্টা করুন।</p>
      <button type="button" onClick={reset} className="mt-5 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-forest">আবার চেষ্টা</button>
    </div>
  );
}
