"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 4000, style: { borderRadius: "12px", background: "#172033", color: "#fff", padding: "12px 16px" }, success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } }, error: { duration: 5000, iconTheme: { primary: "#ef4444", secondary: "#fff" } } }} />;
}
