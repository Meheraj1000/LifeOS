"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { Button, ExpiryBadge, Field, inputClass, Modal } from "@/components/ui";
import { cn } from "@/lib/format";
import { documentCategories, documentLabels } from "@/lib/labels";
import type { DocumentView } from "@/lib/present";

type Member = { id: string; name: string; relation: string };
type Draft = {
  id?: string;
  category: string;
  title: string;
  number: string;
  holderName: string;
  issueDate: string;
  expiryDate: string;
  familyMemberId: string;
  fileName: string;
  file: File | null;
  ocrNote: string;
};

const empty = (holder: string): Draft => ({
  category: "PASSPORT",
  title: documentLabels.PASSPORT,
  number: "",
  holderName: holder,
  issueDate: "",
  expiryDate: "",
  familyMemberId: "",
  fileName: "",
  file: null,
  ocrNote: "",
});

export function VaultBoard({ documents, members, holder }: { documents: DocumentView[]; members: Member[]; holder: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "alert" | "safe">("all");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty(holder));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const rows = documents.filter((document) => {
    if (category !== "all" && document.category !== category) return false;
    if (filter === "alert") return document.tone === "red" || document.tone === "yellow";
    if (filter === "safe") return document.tone === "green" || document.tone === "safe";
    return true;
  });

  async function onFile(file: File | null) {
    if (!file) return;
    setDraft((current) => ({ ...current, file, fileName: file.name }));
    const response = await fetch("/api/documents/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, category: draft.category }),
    });
    const payload = (await response.json()) as { number?: string; issueDate?: string; expiryDate?: string | null; note?: string; error?: string };
    if (!response.ok) {
      setError(payload.error ?? "ওসিআর পড়া যায়নি।");
      return;
    }
    setDraft((current) => ({
      ...current,
      file,
      fileName: file.name,
      number: payload.number || current.number,
      issueDate: payload.issueDate || current.issueDate,
      expiryDate: payload.expiryDate || "",
      ocrNote: payload.note ?? "",
    }));
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("category", draft.category);
    form.set("title", draft.title);
    form.set("number", draft.number);
    form.set("holderName", draft.holderName);
    form.set("issueDate", draft.issueDate);
    form.set("expiryDate", draft.expiryDate);
    form.set("familyMemberId", draft.familyMemberId);
    if (draft.file) form.set("file", draft.file);
    const response = await fetch(draft.id ? `/api/documents/${draft.id}` : "/api/documents", {
      method: draft.id ? "PATCH" : "POST",
      body: draft.id ? JSON.stringify({ ...draft, file: undefined }) : form,
      headers: draft.id ? { "Content-Type": "application/json" } : undefined,
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "সংরক্ষণ হয়নি।");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["all", "alert", "safe"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={cn("rounded-full border px-3 py-1.5 text-sm", filter === item ? "border-gold bg-gold/15 text-gold" : "border-line text-mist")}>
            {item === "all" ? "সব" : item === "alert" ? "সতর্কতা" : "নিরাপদ"}
          </button>
        ))}
        <select value={category} onChange={(event) => setCategory(event.target.value)} className={cn(inputClass, "w-auto")}>
          <option value="all">সব ধরন</option>
          {documentCategories.map((item) => <option key={item} value={item}>{documentLabels[item]}</option>)}
        </select>
        <Button className="ml-auto" onClick={() => { setDraft(empty(holder)); setError(""); setOpen(true); }}>নথি যোগ</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((document) => (
          <article key={document.id} className="rounded-3xl border border-line/80 bg-canopy p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gold">{documentLabels[document.category as keyof typeof documentLabels]}</p>
                <h2 className="font-display text-2xl">{document.title}</h2>
                <p className="text-sm text-mist">{document.holderName}</p>
              </div>
              <ExpiryBadge tone={document.tone} label={document.label} />
            </div>
            <p className="mt-3 text-sm">নম্বর: {document.number}</p>
            {document.fileName && <a className="mt-1 block text-xs text-gold" href={document.fileUrl ?? "#"}>{document.fileName}</a>}
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => { setDraft({ id: document.id, category: document.category, title: document.title, number: document.number, holderName: document.holderName, issueDate: document.issueDate ?? "", expiryDate: document.expiryDate ?? "", familyMemberId: document.familyMemberId ?? "", fileName: document.fileName ?? "", file: null, ocrNote: "" }); setOpen(true); }}>সম্পাদনা</Button>
              <Button variant="danger" onClick={async () => { await fetch(`/api/documents/${document.id}`, { method: "DELETE" }); router.refresh(); }}>মুছুন</Button>
            </div>
          </article>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-3xl border border-dashed border-gold/40 bg-canopy/70 p-5" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void onFile(event.dataTransfer.files[0] ?? null); }}>
        <FileUp className="text-gold" />
        <span>
          <span className="block text-sm">ফাইল ছেড়ে দিন, ওসিআর নম্বর ও তারিখ বসাবে</span>
          <span className="block text-xs text-mist">PDF, JPG বা PNG · সর্বোচ্চ ১০ এমবি</span>
        </span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => { void onFile(event.target.files?.[0] ?? null); event.target.value = ""; }} />
      </label>
      <Modal open={open} title={draft.id ? "নথি সম্পাদনা" : "নতুন নথি"} onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={save}>
          <Field label="ধরন">
            <select className={inputClass} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value, title: documentLabels[event.target.value as keyof typeof documentLabels] })}>
              {documentCategories.map((item) => <option key={item} value={item}>{documentLabels[item]}</option>)}
            </select>
          </Field>
          <Field label="শিরোনাম"><input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
          <Field label="ধারক"><input className={inputClass} value={draft.holderName} onChange={(event) => setDraft({ ...draft, holderName: event.target.value })} /></Field>
          <Field label="নম্বর"><input className={inputClass} value={draft.number} onChange={(event) => setDraft({ ...draft, number: event.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ইস্যু"><input type="date" className={inputClass} value={draft.issueDate} onChange={(event) => setDraft({ ...draft, issueDate: event.target.value })} /></Field>
            <Field label="মেয়াদ শেষ"><input type="date" className={inputClass} value={draft.expiryDate} onChange={(event) => setDraft({ ...draft, expiryDate: event.target.value })} /></Field>
          </div>
          <Field label="পরিবারের সদস্য">
            <select className={inputClass} value={draft.familyMemberId} onChange={(event) => setDraft({ ...draft, familyMemberId: event.target.value })}>
              <option value="">নিজের</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.relation}</option>)}
            </select>
          </Field>
          {draft.ocrNote && <p className="text-xs text-mist">{draft.ocrNote}</p>}
          {error && <p className="text-sm text-coral">{error}</p>}
          <Button type="submit" disabled={pending}>{pending ? "রাখা হচ্ছে..." : "সংরক্ষণ করুন"}</Button>
        </form>
      </Modal>
    </div>
  );
}
