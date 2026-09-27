import { AppShell } from "@/components/auth/AppShell";
import { requirePageRole } from "@/lib/auth";
import { toSafeUser } from "@/models/User";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole("faculty");
  return <AppShell user={toSafeUser(user)}>{children}</AppShell>;
}
