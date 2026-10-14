"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";
import type { ExpiryTone } from "@/lib/format";

const tones: Record<ExpiryTone, string> = {
  red: "bg-coral/15 text-coral border-coral/30",
  yellow: "bg-amber/15 text-amber border-amber/30",
  green: "bg-mint/15 text-mint border-mint/30",
  safe: "bg-mint/10 text-mint border-mint/20",
};

export function ExpiryBadge({ tone, label }: { tone: ExpiryTone; label: string }) {
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>{label}</span>;
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-line/80 bg-canopy/90 p-5 shadow-[inset_0_1px_0_rgba(243,215,161,0.06)]", className)}>
      {children}
    </section>
  );
}

export function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs tracking-[0.18em] text-gold uppercase">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl leading-snug text-cream sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm leading-7 text-mist">{text}</p>
    </header>
  );
}

const buttonStyles = {
  primary: "bg-gold text-forest hover:bg-gold-soft",
  ghost: "border border-line bg-transparent text-mist hover:border-gold/50 hover:text-cream",
  danger: "border border-coral/40 bg-coral/10 text-coral hover:bg-coral/20",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-forest/70 px-3 py-2.5 text-sm text-cream outline-none placeholder:text-muted focus:border-gold";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-mist">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/65 p-0 sm:place-items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-canopy p-5 sm:max-w-lg sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl text-cream">{title}</h2>
          <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="rounded-lg p-1 text-mist hover:text-cream">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
