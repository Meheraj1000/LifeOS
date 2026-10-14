import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { isoDate } from "@/lib/dates";

const root = path.join(process.cwd(), "storage", "uploads");

export async function saveUpload(userId: string, id: string, file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("ফাইলটি ১০ এমবির বেশি।");
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (file.type && !allowed.includes(file.type)) throw new Error("অনুগ্রহ করে PDF, JPG বা PNG দিন।");
  const safe = file.name.replace(/[^\w.\-]/g, "_").slice(0, 80) || "file";
  const relative = path.join(userId, `${id}-${safe}`);
  const absolute = path.join(root, relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, Buffer.from(await file.arrayBuffer()));
  return { fileName: file.name, stored: `storage:${relative.replaceAll("\\", "/")}` };
}

export async function readUpload(stored: string) {
  if (!stored.startsWith("storage:")) return null;
  const relative = stored.slice("storage:".length);
  const absolute = path.join(root, relative);
  return readFile(absolute);
}

export async function removeUpload(stored: string | null) {
  if (!stored?.startsWith("storage:")) return;
  const relative = stored.slice("storage:".length);
  await unlink(path.join(root, relative)).catch(() => undefined);
}

export function simulateOcr(fileName: string, category: string) {
  const digits = (fileName.match(/\d+/g) ?? []).join("").padEnd(8, "4").slice(0, 12);
  const issue = new Date();
  const issueDate = isoDate(new Date(Date.UTC(issue.getFullYear() - 2, issue.getMonth(), issue.getDate(), 12)));
  const permanent = category === "NID" || category === "LAND_KHATIAN" || category === "TIN";
  const shift = category === "PASSPORT" ? 12 : 40;
  const expiry = new Date();
  const expiryDate = permanent
    ? null
    : isoDate(new Date(Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate() + shift, 12)));
  return {
    number: digits,
    issueDate,
    expiryDate,
    confidence: 0.84,
    note: "এটি ওসিআর সিমুলেশন। নম্বর ও তারিখ অনুগ্রহ করে মূল কাগজের সঙ্গে মিলিয়ে নিন।",
  };
}
