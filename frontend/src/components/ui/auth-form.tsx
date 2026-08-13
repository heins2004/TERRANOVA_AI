"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { submitAuth } from "@/lib/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

const pageContent = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to continue building smarter cities with TERRANOVA AI.",
    action: "Sign In",
    alternateLabel: "Need an account?",
    alternateHref: "/register",
    alternateAction: "Create one",
  },
  register: {
    title: "Create your account",
    subtitle: "Register a user profile that can access the TERRANOVA AI platform.",
    action: "Create Account",
    alternateLabel: "Already registered?",
    alternateHref: "/login",
    alternateAction: "Sign in",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const content = pageContent[mode];
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response =
        mode === "register"
          ? await submitAuth(mode, {
              full_name: fullName.trim(),
              email: email.trim(),
              password,
            })
          : await submitAuth(mode, {
              email: email.trim(),
              password,
            });

      login(response);
      setSuccessMessage(response.message);
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hero-panel relative hidden overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_80%_35%,rgba(255,255,255,0.18),transparent_26%)]" />
        <div className="relative flex w-full flex-col justify-between p-12 text-primary-foreground">
          <div className="rounded-full border border-white/25 px-4 py-2 text-sm tracking-[0.24em] uppercase w-fit">
            TERRANOVA AI
          </div>
          <div className="max-w-xl space-y-6">
            <p className="text-sm uppercase tracking-[0.32em] text-white/75">
              Urban Intelligence Platform
            </p>
            <h1 className="text-5xl font-semibold leading-tight">
              Connected planning for faster, cleaner city decisions.
            </h1>
            <p className="max-w-lg text-lg leading-8 text-white/78">
              FastAPI manages secure authentication, PostgreSQL stores citizen
              user records, and this Next.js frontend keeps each route aligned
              with the backend session boundary.
            </p>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden px-6 py-12 sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#dbe9ff,transparent_42%),linear-gradient(180deg,#f8fbff,#eff5fd)]" />
        <div className="glass-card relative z-10 w-full max-w-xl rounded-[2rem] p-8 sm:p-10">
          <div className="mb-8 space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-secondary">
              Secure Access
            </p>
            <h2 className="text-3xl font-semibold text-foreground">
              {content.title}
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              {content.subtitle}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Full Name
                </span>
                <div className="field-shell rounded-2xl px-4 py-3">
                  <input
                    className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Email Address
              </span>
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@organization.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Password
              </span>
              <div className="field-shell rounded-2xl px-4 py-3">
                <input
                  className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                {successMessage}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-primary px-5 py-3.5 text-base font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : content.action}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {content.alternateLabel}{" "}
            <Link
              className="font-semibold text-primary transition hover:opacity-80"
              href={content.alternateHref}
            >
              {content.alternateAction}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
