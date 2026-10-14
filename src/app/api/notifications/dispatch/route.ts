import { queueDueAlerts } from "@/lib/alerts";
import { refreshViews, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { user, error } = await requireUser();
  if (!user) return error;
  await queueDueAlerts(user.id);
  const queued = await prisma.notification.findMany({ where: { userId: user.id, status: "QUEUED" } });
  if (queued.length === 0) {
    return Response.json({ sent: 0, message: "পাঠানোর মতো নতুন সতর্কতা নেই।" });
  }
  await prisma.notification.updateMany({
    where: { userId: user.id, status: "QUEUED" },
    data: { status: "SENT" },
  });
  refreshViews();
  return Response.json({
    sent: queued.length,
    simulator: true,
    message: "এসএমএস সিমুলেটরে পাঠানো হয়েছে। কোনো বাস্তব বার্তা যায়নি।",
    items: queued.map((item) => ({ title: item.title, body: item.body, phone: item.phone })),
  });
}
