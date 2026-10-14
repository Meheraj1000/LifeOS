"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, ClipboardList, Home, Landmark, MessageCircle, Search, ShieldCheck, Wallet } from "lucide-react";
import { cn, formatWeekday, toISODate } from "@/lib/format";

const nav = [
  { href: "/dashboard", label: "ওভারভিউ", icon: Home },
  { href: "/dashboard/chat", label: "কথা", icon: MessageCircle },
  { href: "/dashboard/vault", label: "ভল্ট", icon: ShieldCheck },
  { href: "/dashboard/finance", label: "আয়-ব্যয়", icon: Wallet },
  { href: "/dashboard/services", label: "সেবা", icon: Landmark },
  { href: "/dashboard/tasks", label: "রুটিন", icon: ClipboardList },
];

type ShellProps = {
  user: { name: string; phone: string };
  alerts: number;
  notifications: { id: string; title: string; body: string; status: string; channel: string }[];
  search: { href: string; title: string; meta: string }[];
  children: React.ReactNode;
};

function subscribeClock(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}

export function DashboardShell({ user, alerts, notifications, search, children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<"search" | "bell" | null>(null);
  const today = useSyncExternalStore(subscribeClock, () => formatWeekday(toISODate(new Date())), () => "");
  const box = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const needle = query.trim();
    if (!needle) return [];
    return search.filter((item) => `${item.title} ${item.meta}`.includes(needle)).slice(0, 8);
  }, [query, search]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <aside className="sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col border-r border-line/80 bg-canopy/80 px-4 py-6 lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 px-2">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/70 font-display text-sm text-gold">জীবন</span>
            <span>
              <span className="block font-semibold">LifeOS <span className="text-gold">BD</span></span>
              <span className="block text-[11px] text-mist">আপনার দৈনন্দিন সহকারী</span>
            </span>
          </Link>
          <nav className="mt-8 grid gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm", active ? "bg-moss text-cream shadow-[inset_3px_0_0_#e0b45a]" : "text-mist hover:bg-leaf")}>
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/dashboard/vault" && alerts > 0 && <span className="rounded-full bg-coral px-2 text-[11px] text-forest">{alerts.toLocaleString("bn-BD")}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-line px-1 pt-4">
            <p className="text-sm">{user.name}</p>
            <p className="text-xs text-mist">{user.phone}</p>
            <button type="button" onClick={logout} className="mt-3 text-xs text-gold">লগ আউট</button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header ref={box} className="sticky top-0 z-30 flex items-center gap-3 border-b border-line/80 bg-forest/80 px-4 py-3 backdrop-blur sm:px-6">
            <Link href="/dashboard" className="font-semibold lg:hidden">LifeOS <span className="text-gold">BD</span></Link>
            <label className="relative ml-auto hidden w-full max-w-sm md:block">
              <span className="flex items-center gap-2 rounded-xl border border-line bg-canopy px-3 py-2 text-mist">
                <Search size={16} />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setOpen("search"); }} onFocus={() => setOpen("search")} placeholder="নথি বা কাজ খুঁজুন" className="w-full bg-transparent text-sm text-cream outline-none" />
              </span>
              {open === "search" && query.trim() && (
                <div className="absolute top-12 z-20 w-full overflow-hidden rounded-2xl border border-line bg-canopy shadow-2xl">
                  {results.length === 0 && <p className="px-4 py-3 text-sm text-mist">কিছু পাওয়া যায়নি।</p>}
                  {results.map((item) => (
                    <button key={`${item.href}-${item.title}-${item.meta}`} type="button" className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-leaf" onClick={() => { router.push(item.href); setOpen(null); setQuery(""); }}>
                      <span><span className="block text-sm">{item.title}</span><span className="text-xs text-mist">{item.meta}</span></span>
                      <ChevronRight size={14} className="text-gold" />
                    </button>
                  ))}
                </div>
              )}
            </label>
            <div className="relative ml-auto md:ml-0">
              <button type="button" aria-label="সতর্কতা" onClick={() => setOpen(open === "bell" ? null : "bell")} className="relative rounded-xl border border-line p-2 text-mist">
                <Bell size={18} />
                {notifications.some((item) => item.status === "QUEUED") && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-coral" />}
              </button>
              {open === "bell" && (
                <div className="absolute right-0 z-20 mt-2 w-80 max-w-[80vw] rounded-2xl border border-line bg-canopy p-3 shadow-2xl">
                  <p className="text-sm">নোটিফিকেশন</p>
                  <div className="mt-2 grid max-h-80 gap-2 overflow-auto">
                    {notifications.length === 0 && <p className="text-sm text-mist">এখন কোনো সতর্কতা নেই।</p>}
                    {notifications.map((item) => (
                      <div key={item.id} className="rounded-xl bg-forest/70 px-3 py-2">
                        <p className="text-sm">{item.title}</p>
                        <p className="text-xs leading-5 text-mist">{item.body}</p>
                        <p className="mt-1 text-[11px] text-gold">{item.channel === "SMS" ? "এসএমএস" : "অ্যাপ"} · {item.status === "QUEUED" ? "অপেক্ষমাণ" : "পাঠানো"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="hidden text-xs text-mist xl:block">{today}</p>
          </header>
          <main className="px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canopy/95 backdrop-blur lg:hidden">
        <ul className="grid grid-cols-6 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className={cn("flex flex-col items-center gap-1 py-2 text-[10px]", active ? "text-gold" : "text-mist")}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
