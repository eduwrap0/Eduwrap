"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SafeUser } from "@/types/auth";

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/fees", label: "Fee management", icon: "inr" },
    { href: "/admin/materials", label: "Course materials", icon: "folder-open" },
    { href: "/admin/blogs", label: "Blog management", icon: "newspaper-o" },
    { href: "/admin/gallery", label: "Image gallery", icon: "picture-o" },
    { href: "/admin/video-testimonials", label: "Video testimonials", icon: "video-camera" },
    { href: "/admin/seo", label: "SEO settings", icon: "search" },
    { href: "/admin/students", label: "Manage students", icon: "users" },
    { href: "/admin/faculty", label: "Manage faculty", icon: "user-md" },
  ];
  const facultyLinks = [
    { href: "/faculty/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/faculty/fees", label: "Fee collections", icon: "inr" },
    { href: "/faculty/materials", label: "Course materials", icon: "folder-open" },
    { href: "/faculty/students", label: "My students", icon: "users" },
    { href: "/faculty/students/new", label: "Register student", icon: "user-plus" },
  ];
  const links = user.role === "admin" ? adminLinks : user.role === "faculty" ? facultyLinks : [{ href: "/student/dashboard", label: "My dashboard", icon: "dashboard" }, { href: "/student/materials", label: "Course materials", icon: "folder-open" }];
  const home = user.role === "admin" ? "/admin/dashboard" : user.role === "faculty" ? "/faculty/dashboard" : "/student/dashboard";
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const currentPage = pathname === `/${user.role}/profile` ? (user.role === "student" ? "Change password" : "My profile") : links.find((link) => pathname === link.href)?.label || roleLabel;

  return (
    <div className={`app-layout portal-${user.role}`}>
      <aside className={`app-sidebar ${open ? "is-open" : ""}`} aria-label="Application navigation">
        <Link href={home} className="app-brand">
          <Image src="/assets/images/logo-dark-cf3f5756.webp" alt="EduWrap" width={180} height={40} priority />
        </Link>
        <p className="app-nav-label">Workspace</p>
        <nav className="app-nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""} onClick={() => setOpen(false)}>
              <i className={`fa fa-${link.icon}`} aria-hidden="true" /> {link.label}
            </Link>
          ))}
        </nav>
        <div className="app-sidebar-user">
          <span className={`app-avatar ${user.profileImageUrl ? "has-profile-image" : ""}`} style={user.profileImageUrl ? { backgroundImage: `url(${user.profileImageUrl})` } : undefined} aria-hidden="true">{!user.profileImageUrl && user.name.charAt(0).toUpperCase()}</span>
          <div><strong>{user.name}</strong><small>{roleLabel} account</small></div>
        </div>
      </aside>
      {open && <button className="app-sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-leading">
            <button type="button" className="app-menu-button" aria-label="Open navigation" onClick={() => setOpen(true)}><i className="fa fa-bars" aria-hidden="true" /></button>
            <nav className="app-history-nav" aria-label="Page history"><button type="button" aria-label="Go back" title="Back" onClick={() => window.history.back()}><i className="fa fa-arrow-left" /></button><button type="button" aria-label="Go forward" title="Forward" onClick={() => window.history.forward()}><i className="fa fa-arrow-right" /></button></nav>
            <div className="app-topbar-context"><span className="app-topbar-icon"><i className="fa fa-th-large" aria-hidden="true" /></span><div><small>{roleLabel} portal</small><strong>{currentPage}</strong></div></div>
          </div>
          <div className="app-topbar-actions"><div className="app-topbar-user d-none d-sm-flex"><span className={user.profileImageUrl ? "has-profile-image" : ""} style={user.profileImageUrl ? { backgroundImage: `url(${user.profileImageUrl})` } : undefined}>{!user.profileImageUrl && user.name.charAt(0).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div><Link href={`/${user.role}/profile`} className="app-topbar-profile-link" aria-label={user.role === "student" ? "Change my password" : "Open my profile"} aria-current={pathname === `/${user.role}/profile` ? "page" : undefined} title={user.role === "student" ? "Change password" : "My profile"}><i className={`fa fa-${user.role === "student" ? "key" : "user-circle"}`} aria-hidden="true" /><span>{user.role === "student" ? "Change password" : "My profile"}</span></Link><LogoutButton /></div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
