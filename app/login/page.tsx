import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser, roleHome } from "@/lib/auth";

export const metadata: Metadata = { title: "Login", robots: { index: false, follow: false } };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-split" aria-labelledby="login-heading">
        <Link href="/" className="auth-back-link" aria-label="Back to home">
          <span aria-hidden="true">&larr;</span> Back to home
        </Link>

        <div className="auth-visual" aria-hidden="true">
          <Image
            src="/assets/images/Eduwrap-login image.webp"
            alt=""
            width={1536}
            height={1024}
            className="auth-visual-image"
            priority
            sizes="(max-width: 767px) 100vw, 55vw"
          />
        </div>

        <div className="auth-form-panel">
          <Image src="/assets/images/logo-dark-cf3f5756.webp" alt="EduWrap" width={210} height={48} className="auth-logo" />
          <p className="auth-eyebrow">Secure learning portal</p>
          <h1 id="login-heading">Welcome back</h1>
          <p className="text-muted mb-4">Sign in with the credentials provided for your account.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
