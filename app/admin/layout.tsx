import { AppShell } from "@/components/auth/AppShell";
import { requirePageRole } from "@/lib/auth";
import { toSafeUser } from "@/models/User";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole("admin");
  return <AppShell user={toSafeUser(user)}>{children}</AppShell>;
}

