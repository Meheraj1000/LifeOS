import { refreshViews, requireUser } from "@/lib/api";
import { dateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (!user) return error;
  const members = await prisma.familyMember.findMany({
    where: { userId: user.id },
    include: { documents: true, tasks: true },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      relation: member.relation,
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : null,
      medicalHistory: member.medicalHistory,
      documents: member.documents.length,
      openTasks: member.tasks.filter((task) => !task.isCompleted).length,
    })),
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (!user) return error;
  const body = (await request.json()) as { name?: string; relation?: string; medicalHistory?: string; dateOfBirth?: string };
  if (!body.name?.trim() || !body.relation?.trim()) {
    return Response.json({ error: "নাম ও সম্পর্ক লিখুন।" }, { status: 400 });
  }
  const member = await prisma.familyMember.create({
    data: {
      userId: user.id,
      name: body.name.trim(),
      relation: body.relation.trim(),
      medicalHistory: body.medicalHistory?.trim() || null,
      dateOfBirth: body.dateOfBirth ? dateOnly(body.dateOfBirth) : null,
    },
  });
  refreshViews();
  return Response.json({ member }, { status: 201 });
}
