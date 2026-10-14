import { Suspense } from "react";
import { redirect } from "next/navigation";
import { VaultBoard } from "@/components/vault/vault-board";
import { PageIntro } from "@/components/ui";
import { loadVault } from "@/lib/load";
import { getCurrentUser } from "@/lib/session";

export default function VaultPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mist">ভল্ট আসছে...</p>}>
      <Vault />
    </Suspense>
  );
}

async function Vault() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await loadVault(user.id);
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="ভল্ট" title="ডকুমেন্ট ও মেয়াদ" text="এনআইডি, পাসপোর্ট, খতিয়ান, নামজারি, লাইসেন্স, টিন, ফিটনেস ও ট্রেড লাইসেন্স। ১৫ দিনের কম হলে লাল, ৬০ দিনের কম হলে হলুদ। হিসাব সার্ভারের সময় থেকে।" />
      <VaultBoard documents={data.documents} members={data.members} holder={user.name} />
    </div>
  );
}
