import { PrismaClient, type ExpenseCategory } from "@prisma/client";
import { guides } from "./guides";

const prisma = new PrismaClient();

function onDay(offset: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12));
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  const phone = "01711223344";
  const user = await prisma.user.upsert({
    where: { phone },
    update: { name: "রহিম আহমেদ", nid: "198812345678", district: "ঢাকা" },
    create: { phone, name: "রহিম আহমেদ", nid: "198812345678", district: "ঢাকা" },
  });

  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.assistantLog.deleteMany({ where: { userId: user.id } });
  await prisma.serviceProgress.deleteMany({ where: { userId: user.id } });
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.document.deleteMany({ where: { userId: user.id } });
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.income.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.utilityBill.deleteMany({ where: { userId: user.id } });
  await prisma.familyMember.deleteMany({ where: { userId: user.id } });

  const wife = await prisma.familyMember.create({
    data: { userId: user.id, name: "ফারহানা আহমেদ", relation: "স্ত্রী", medicalHistory: "ঋতুস্রাবজনিত রক্তশূন্যতা। ছয় মাস পরপর রক্ত পরীক্ষা।" },
  });
  const child = await prisma.familyMember.create({
    data: {
      userId: user.id,
      name: "তানভীর আহমেদ",
      relation: "সন্তান",
      dateOfBirth: new Date(Date.UTC(2016, 3, 12, 12)),
      medicalHistory: "নিয়মিত টিকা চলমান। ধুলোয় হাঁপানি হয়।",
    },
  });

  await prisma.document.createMany({
    data: [
      { userId: user.id, category: "NID", title: "জাতীয় পরিচয়পত্র", number: "198812345678", holderName: user.name, issueDate: new Date(Date.UTC(2018, 2, 12, 12)), status: "ACTIVE" },
      { userId: user.id, category: "PASSPORT", title: "ই-পাসপোর্ট", number: "A01234567", holderName: user.name, issueDate: onDay(-1800), expiryDate: onDay(12), status: "EXPIRING" },
      { userId: user.id, category: "DRIVING_LICENSE", title: "ড্রাইভিং লাইসেন্স", number: "DK2021004582", holderName: user.name, issueDate: onDay(-1500), expiryDate: onDay(40), status: "EXPIRING" },
      { userId: user.id, category: "LAND_KHATIAN", title: "খতিয়ান — বাড্ডা", number: "খতিয়ান ১২৪ · দাগ ৪২", holderName: user.name, issueDate: new Date(Date.UTC(2016, 5, 2, 12)), status: "ACTIVE" },
      { userId: user.id, category: "LAND_NAMJARI", title: "নামজারি খসড়া", number: "মিউটেশন-২০২৪-১৮", holderName: user.name, status: "ACTIVE" },
      { userId: user.id, category: "TIN", title: "টিন সনদ", number: "123456789012", holderName: user.name, issueDate: new Date(Date.UTC(2019, 7, 1, 12)), status: "ACTIVE" },
      { userId: user.id, category: "VEHICLE_FITNESS", title: "বাইকের ফিটনেস", number: "DHA-12-4582", holderName: user.name, expiryDate: onDay(90), status: "ACTIVE" },
      { userId: user.id, category: "TRADE_LICENSE", title: "ট্রেড লাইসেন্স", number: "DNCC-TL-2291", holderName: user.name, expiryDate: onDay(20), status: "EXPIRING" },
      { userId: user.id, category: "PASSPORT", title: "ই-পাসপোর্ট", number: "B07654321", holderName: wife.name, familyMemberId: wife.id, expiryDate: onDay(180), status: "ACTIVE" },
    ],
  });

  const month = monthKey();
  const budgets: Array<{ category: ExpenseCategory; limit: number }> = [
    { category: "UTILITY", limit: 6000 },
    { category: "GROCERY", limit: 8000 },
    { category: "EDUCATION", limit: 5000 },
    { category: "HEALTHCARE", limit: 3000 },
    { category: "TRAVEL", limit: 2500 },
    { category: "EMI", limit: 4000 },
    { category: "OTHER", limit: 2000 },
  ];
  await prisma.budget.createMany({ data: budgets.map((item) => ({ userId: user.id, month, ...item })) });

  await prisma.income.create({
    data: { userId: user.id, amount: 65000, category: "বেতন", paymentMethod: "BANK", date: onDay(-10), notes: "মাসিক বেতন" },
  });
  await prisma.expense.createMany({
    data: [
      { userId: user.id, amount: 2450, category: "UTILITY", paymentMethod: "BKASH", date: onDay(-12), notes: "ডেসকো বিদ্যুৎ বিল", source: "manual" },
      { userId: user.id, amount: 860, category: "UTILITY", paymentMethod: "CASH", date: onDay(-11), notes: "ওয়াসা পানির বিল", source: "manual" },
      { userId: user.id, amount: 1760, category: "GROCERY", paymentMethod: "CASH", date: onDay(-8), notes: "সাপ্তাহিক বাজার", source: "manual" },
      { userId: user.id, amount: 3500, category: "EDUCATION", paymentMethod: "BKASH", date: onDay(-6), notes: "তানভীরের স্কুল বেতন", source: "manual" },
      { userId: user.id, amount: 540, category: "TRAVEL", paymentMethod: "CASH", date: onDay(-4), notes: "অফিস যাতায়াত", source: "manual" },
      { userId: user.id, amount: 650, category: "HEALTHCARE", paymentMethod: "NAGAD", date: onDay(-2), notes: "মায়ের ওষুধ", source: "manual" },
    ],
  });

  await prisma.utilityBill.createMany({
    data: [
      { userId: user.id, provider: "DESCO", accountNo: "14023991", amount: 2380, dueDate: onDay(2), isPaid: false },
      { userId: user.id, provider: "WASA", accountNo: "W-55821", amount: 740, dueDate: onDay(8), isPaid: false },
      { userId: user.id, provider: "TITAS", accountNo: "TG-19022", amount: 980, dueDate: onDay(-3), isPaid: true, paidAt: onDay(-4), paymentMethod: "BKASH", reference: "SIM-TITAS-1001" },
      { userId: user.id, provider: "INTERNET", accountNo: "NET-442", amount: 1200, dueDate: onDay(18), isPaid: false },
    ],
  });

  await prisma.task.createMany({
    data: [
      { userId: user.id, title: "ডেসকো বিল পরিশোধ", category: "BILL", dueDate: onDay(2), priority: "HIGH", isRecurring: true, recurrence: "monthly" },
      { userId: user.id, title: "তানভীরের অর্ধবার্ষিক পরীক্ষা", category: "EXAM", dueDate: onDay(7), priority: "HIGH", familyMemberId: child.id },
      { userId: user.id, title: "চাকরির আবেদন ফি জমা", category: "JOB", dueDate: onDay(5), priority: "MEDIUM" },
      { userId: user.id, title: "তানভীরের টিকা", category: "HEALTH", dueDate: onDay(14), priority: "MEDIUM", familyMemberId: child.id, notes: "স্থানীয় টিকা কেন্দ্র, বিকাল ৪টা" },
      { userId: user.id, title: "ফারহানার রক্ত পরীক্ষা", category: "HEALTH", dueDate: onDay(9), priority: "MEDIUM", familyMemberId: wife.id },
      { userId: user.id, title: "বাড়ি ভাড়া", category: "HOME", dueDate: onDay(3), priority: "HIGH", isRecurring: true, recurrence: "monthly", notes: "১৮,০০০ টাকা" },
      { userId: user.id, title: "কাজের মেয়ের বেতন", category: "HOME", dueDate: onDay(1), priority: "MEDIUM", isRecurring: true, recurrence: "monthly", notes: "৪,৫০০ টাকা" },
      { userId: user.id, title: "বাইক সার্ভিসিং", category: "VEHICLE", dueDate: onDay(11), priority: "LOW" },
    ],
  });

  for (const guide of guides) {
    await prisma.civicServiceGuide.upsert({
      where: { slug: guide.slug },
      update: guide,
      create: guide,
    });
  }

  console.log(`Seeded ${user.name} (${user.phone})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
