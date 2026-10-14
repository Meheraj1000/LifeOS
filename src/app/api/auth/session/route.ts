import { clearSession, normalizePhone, setSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api";

export async function POST(request: Request) {
  const body = await readJson(request);
  const phone = normalizePhone(String(body?.phone ?? ""));
  if (!/^01\d{9}$/.test(phone)) {
    return Response.json({ error: "১১ সংখ্যার মোবাইল নম্বর দিন, যেমন ০১৭১১২২৩৩৪৪।" }, { status: 400 });
  }
  const name = String(body?.name ?? "").trim();
  const user = await prisma.user.upsert({
    where: { phone },
    update: name ? { name } : {},
    create: { phone, name: name || "নতুন ব্যবহারকারী", district: "ঢাকা" },
  });
  await setSession(user.id);
  return Response.json({ id: user.id, name: user.name, phone: user.phone });
}

export async function DELETE() {
  await clearSession();
  return Response.json({ ok: true });
}
