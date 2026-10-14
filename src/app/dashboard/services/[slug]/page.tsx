import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { GuideWizard } from "@/components/services/guide-wizard";
import { loadGuide } from "@/lib/load";
import { getCurrentUser } from "@/lib/session";

type Props = { params: Promise<{ slug: string }> };

export default function GuidePage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-mist">নির্দেশনা আসছে...</p>}>
      <Guide params={params} />
    </Suspense>
  );
}

async function Guide({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { slug } = await params;
  const guide = await loadGuide(user.id, slug);
  if (!guide) notFound();
  return <GuideWizard guide={guide} />;
}
