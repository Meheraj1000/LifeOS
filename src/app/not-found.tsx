import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm text-gold">৪০৪</p>
      <h1 className="mt-2 font-display text-4xl">এই পাতাটি খুঁজে পাওয়া যায়নি</h1>
      <p className="mt-3 text-sm leading-7 text-mist">হয়তো ঠিকানাটি বদলে গেছে। ওভারভিউ থেকে আবার শুরু করতে পারেন।</p>
      <Link href="/" className="mt-6 inline-flex rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-forest">
        ওভারভিউতে ফিরুন
      </Link>
    </div>
  );
}
