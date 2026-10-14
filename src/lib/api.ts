import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: Response.json({ error: "অনুগ্রহ করে আবার লগইন করুন।" }, { status: 401 }) };
  }
  return { user, error: null };
}

export function refreshViews() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vault");
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/services");
}

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
