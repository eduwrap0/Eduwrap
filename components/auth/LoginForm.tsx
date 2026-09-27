"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";

interface LoginResponse {
  success: boolean;
  message: string;
  data?: { user: { role: "admin" | "faculty" | "student" } };
  errors?: Record<string, string[]>;
}

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = (await response.json()) as LoginResponse;
      if (!response.ok || !result.data) {
        setError(result.message || "Unable to log in.");
        setFieldErrors(result.errors || {});
        return;
      }
      const role = result.data.user.role;
      router.replace(role === "admin" ? "/admin/dashboard" : role === "faculty" ? "/faculty/dashboard" : "/student/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email address</label>
        <input id="email" name="email" type="email" autoComplete="username" className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`} required disabled={loading} />
        {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email[0]}</div>}
      </div>
      <div className="mb-4">
        <label htmlFor="password" className="form-label">Password</label>
        <PasswordField id="password" name="password" autoComplete="current-password" className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`} required disabled={loading} />
        {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password[0]}</div>}
      </div>
      <button type="submit" className="btn btn-brand w-100" disabled={loading}>
        {loading && <span className="spinner-border spinner-border-sm" aria-hidden="true" />} {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
