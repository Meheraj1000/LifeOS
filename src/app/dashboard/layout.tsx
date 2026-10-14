import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { loadShell } from "@/lib/load";
import { getCurrentUser } from "@/lib/session";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-mist">তথ্য আসছে...</p>}>
      <Frame>{children}</Frame>
    </Suspense>
  );
}

async function Frame({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const shell = await loadShell(user.id);
  return (
    <DashboardShell user={{ name: user.name, phone: user.phone }} alerts={shell.alerts} notifications={shell.notifications} search={shell.search}>
      {children}
    </DashboardShell>
  );
}
