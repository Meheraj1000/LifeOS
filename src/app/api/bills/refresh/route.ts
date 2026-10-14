import { refreshViews, requireUser } from "@/lib/api";
import { presentBill } from "@/lib/present";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { user, error } = await requireUser();
  if (!user) return error;
  await prisma.utilityBill.updateMany({
    where: { userId: user.id, isPaid: false },
    data: { lastFetchedAt: new Date() },
  });
  const bills = await prisma.utilityBill.findMany({ where: { userId: user.id }, orderBy: { dueDate: "asc" } });
  refreshViews();
  return Response.json({
    bills: bills.map(presentBill),
    message: "বিলের সর্বশেষ অবস্থা আনা হয়েছে। এটি সংরক্ষিত হিসাব থেকে হালনাগাদ, সরাসরি বিদ্যুৎ অফিসের সংযোগ নয়।",
  });
}
