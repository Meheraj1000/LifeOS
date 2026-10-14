import { daysLeft } from "@/lib/dates";
import { documentLabels, providerLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";

export async function syncDocumentStatuses(userId: string) {
  const documents = await prisma.document.findMany({ where: { userId } });
  const now = new Date();
  await Promise.all(
    documents.map(async (document) => {
      const days = daysLeft(document.expiryDate, now);
      const status = days === null ? "ACTIVE" : days < 0 ? "EXPIRED" : days < 60 ? "EXPIRING" : "ACTIVE";
      if (status !== document.status) {
        await prisma.document.update({ where: { id: document.id }, data: { status } });
      }
    }),
  );
}

export async function queueDueAlerts(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const now = new Date();
  const stamp = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const documents = await prisma.document.findMany({ where: { userId, expiryDate: { not: null } } });

  for (const document of documents) {
    const days = daysLeft(document.expiryDate, now);
    if (days === null || days >= 15) continue;
    const dedupeKey = `doc:${document.id}:${stamp}`;
    const label = documentLabels[document.category as keyof typeof documentLabels] ?? document.title;
    const when = days < 0 ? "মেয়াদ ইতিমধ্যে শেষ" : `আর ${formatNumber(days)} দিন বাকি`;
    await prisma.notification.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {},
      create: {
        userId,
        channel: "SMS",
        status: "QUEUED",
        phone: user.phone,
        title: `${label} নবায়ন`,
        body: `${document.holderName}-এর ${document.title}: ${when}। অনুগ্রহ করে কাগজ গুছিয়ে নিন।`,
        dedupeKey,
      },
    });
  }

  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 3);
  const bills = await prisma.utilityBill.findMany({
    where: { userId, isPaid: false, dueDate: { lte: horizon } },
  });
  for (const bill of bills) {
    const dedupeKey = `bill:${bill.id}`;
    const provider = providerLabels[bill.provider as keyof typeof providerLabels] ?? bill.provider;
    await prisma.notification.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {},
      create: {
        userId,
        channel: "SMS",
        status: "QUEUED",
        phone: user.phone,
        title: `${provider} বিল`,
        body: `${provider} বিল ${formatNumber(bill.amount)} টাকা। অ্যাকাউন্ট ${bill.accountNo}। সময়ের মধ্যে পরিশোধ করলে বিলম্ব ফি এড়ানো যায়।`,
        dedupeKey,
      },
    });
  }
}
