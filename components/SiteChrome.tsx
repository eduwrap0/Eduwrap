"use client";

import { usePathname } from "next/navigation";
import { FixedContacts } from "@/components/FixedContacts";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollToTop } from "@/components/ScrollToTop";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApplicationPage = pathname === "/login" || pathname.startsWith("/admin/") || pathname.startsWith("/faculty/") || pathname.startsWith("/student/");

  if (isApplicationPage) return <>{children}</>;
  return (
    <>
      <Header />
      {children}
      <Footer />
      <FixedContacts />
      <ScrollToTop />
    </>
  );
}
