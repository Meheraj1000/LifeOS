"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-display text-4xl">একটু সমস্যা হয়েছে</h1>
      <p className="mt-3 text-sm leading-7 text-mist">পাতাটি এখন খোলা যাচ্ছে না। আবার চেষ্টা করলে অনেক সময় ঠিক হয়ে যায়।</p>
      <button type="button" onClick={reset} className="mt-6 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-forest">
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}
