import type { Metadata } from "next";
import { AccountProfileSettings } from "@/components/auth/AccountProfileSettings";
import { requirePageRole } from "@/lib/auth";
import { toSafeUser } from "@/models/User";

export const metadata: Metadata = { title: "My Profile", robots: { index: false, follow: false } };

export default async function AdminProfilePage() {
  const user = await requirePageRole("admin");
  return <AccountProfileSettings user={toSafeUser(user)} />;
}

