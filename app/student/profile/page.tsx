import type { Metadata } from "next";
import { AccountProfileSettings } from "@/components/auth/AccountProfileSettings";
import { requirePageRole } from "@/lib/auth";
import { toSafeUser } from "@/models/User";

export const metadata: Metadata = { title: "Change Password", robots: { index: false, follow: false } };

export default async function StudentProfileSettingsPage() {
  const user = await requirePageRole("student");
  return <AccountProfileSettings user={toSafeUser(user)} passwordOnly />;
}
