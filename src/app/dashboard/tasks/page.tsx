import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RoutineBoard } from "@/components/tasks/routine-board";
import { PageIntro } from "@/components/ui";
import { todayIso } from "@/lib/dates";
import { loadRoutine } from "@/lib/load";
import { getCurrentUser } from "@/lib/session";

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mist">রুটিন আসছে...</p>}>
      <Routine />
    </Suspense>
  );
}

async function Routine() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await loadRoutine(user.id);
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="দিনযাপন" title="কাজ, স্বাস্থ্য ও পরিবার" text="বিল, পরীক্ষা, চাকরি, ডাক্তার, ভাড়া, কাজের মেয়ের বেতন ও যান সার্ভিসিং। জরুরি ট্যাগ ও মাসিক পুনরাবৃত্তি আছে।" />
      <RoutineBoard tasks={data.tasks} members={data.members} today={todayIso()} />
    </div>
  );
}
