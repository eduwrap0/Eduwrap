import { AppShell } from "@/components/auth/AppShell";
import { requirePageRole } from "@/lib/auth";
import { toSafeUser } from "@/models/User";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole("student");
  return <AppShell user={toSafeUser(user)}>{children}</AppShell>;
}

