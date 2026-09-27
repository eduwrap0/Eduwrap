"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button type="button" className="btn btn-outline-light btn-sm app-logout" onClick={logout} disabled={loading}>
      <i className="fa fa-sign-out" aria-hidden="true" /> {loading ? "Signing out…" : "Logout"}
    </button>
  );
}

