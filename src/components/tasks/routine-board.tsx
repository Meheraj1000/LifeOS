"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button, Field, inputClass, Panel } from "@/components/ui";
import { cn, formatDate } from "@/lib/format";
import { priorities, priorityLabels, taskCategories, taskLabels } from "@/lib/labels";
import type { TaskView } from "@/lib/present";

type Member = { id: string; name: string; relation: string; medicalHistory: string | null; documents: string[] };

export function RoutineBoard({ tasks, members, today }: { tasks: TaskView[]; members: Member[]; today: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const visible = tasks.filter((task) => filter === "all" || task.category === filter);

  async function toggle(task: TaskView) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    });
    router.refresh();
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form.entries()), isRecurring: form.get("isRecurring") === "on" }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "যোগ হয়নি।");
      return;
    }
    event.currentTarget.reset();
    setMessage("কাজটি যোগ হয়েছে।");
    router.refresh();
  }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "সদস্য যোগ হয়নি।");
      return;
    }
    event.currentTarget.reset();
    setMessage("পরিবারের সদস্য যোগ হয়েছে।");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Panel>
        <form className="grid gap-3 lg:grid-cols-4" onSubmit={addTask}>
          <Field label="নতুন কাজ"><input name="title" className={inputClass} required placeholder="যেমন: বাড়ি ভাড়া" /></Field>
          <Field label="ধরন">
            <select name="category" className={inputClass}>{taskCategories.map((item) => <option key={item} value={item}>{taskLabels[item]}</option>)}</select>
          </Field>
          <Field label="তারিখ"><input type="date" name="dueDate" className={inputClass} defaultValue={today} required /></Field>
          <Field label="গুরুত্ব">
            <select name="priority" className={inputClass} defaultValue="MEDIUM">{priorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-mist"><input type="checkbox" name="isRecurring" /> প্রতি মাসে আবার</label>
          <Button type="submit">যোগ করুন</Button>
        </form>
        {message && <p className="mt-3 text-sm text-mist">{message}</p>}
      </Panel>
      <div className="flex flex-wrap gap-2">
        <Filter on={filter === "all"} onClick={() => setFilter("all")}>সব</Filter>
        {taskCategories.map((item) => <Filter key={item} on={filter === item} onClick={() => setFilter(item)}>{taskLabels[item]}</Filter>)}
      </div>
      <Panel className="p-0">
        <ul>
          {visible.map((task) => {
            const overdue = !task.isCompleted && task.dueDate < today;
            return (
              <li key={task.id} className="flex items-center gap-3 border-b border-line/70 px-4 py-3 last:border-0">
                <button type="button" aria-label="অবস্থা বদলান" onClick={() => void toggle(task)} className={cn("grid h-6 w-6 place-items-center rounded-full border", task.isCompleted ? "border-mint bg-mint text-forest" : "border-line")}>
                  {task.isCompleted && <Check size={14} />}
                </button>
                <div className={cn("min-w-0 flex-1", task.isCompleted && "text-muted line-through")}>
                  <p className="text-sm">{task.title}</p>
                  <p className={cn("text-xs", overdue ? "text-coral" : "text-mist")}>{taskLabels[task.category as keyof typeof taskLabels]} · {priorityLabels[task.priority as keyof typeof priorityLabels]} · {task.dueDate === today ? "আজ" : formatDate(task.dueDate)}{task.isRecurring ? " · পুনরাবৃত্ত" : ""}</p>
                </div>
                <button type="button" className="text-xs text-mist" onClick={async () => { await fetch(`/api/tasks/${task.id}`, { method: "DELETE" }); router.refresh(); }}>মুছুন</button>
              </li>
            );
          })}
        </ul>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        {members.map((member) => (
          <Panel key={member.id}>
            <p className="text-xs text-gold">{member.relation}</p>
            <h2 className="font-display text-2xl">{member.name}</h2>
            <p className="mt-2 text-sm leading-7 text-mist">{member.medicalHistory || "স্বাস্থ্যের নোট এখনো নেই।"}</p>
            <p className="mt-2 text-xs text-mist">নথি: {member.documents.length ? member.documents.join(", ") : "নেই"}</p>
          </Panel>
        ))}
        <Panel>
          <h2 className="font-display text-2xl">সদস্য যোগ</h2>
          <form className="mt-3 grid gap-3" onSubmit={addMember}>
            <Field label="নাম"><input name="name" className={inputClass} required /></Field>
            <Field label="সম্পর্ক"><input name="relation" className={inputClass} required placeholder="যেমন: মা" /></Field>
            <Field label="স্বাস্থ্য নোট"><input name="medicalHistory" className={inputClass} /></Field>
            <Button type="submit">যোগ করুন</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

function Filter({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-sm", on ? "border-gold bg-gold/15 text-gold" : "border-line text-mist")}>{children}</button>;
}
