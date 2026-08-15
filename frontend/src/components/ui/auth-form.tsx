"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { AuthVisual } from "@/components/layout/auth-visual";
import { submitAuth } from "@/lib/auth";

type AuthMode = "login" | "register";
type AuthFormProps = { mode: AuthMode };

const pageContent = {
  login: { action: "Access System", alternateLabel: "Unregistered Node?", alternateHref: "/register", alternateAction: "Initialize Registration" },
  register: { action: "Create Account", alternateLabel: "Already have an account?", alternateHref: "/login", alternateAction: "Sign In" },
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
          ? await submitAuth(mode, { full_name: fullName.trim(), email: email.trim(), password })
          : await submitAuth(mode, { email: email.trim(), password });

      login(response);
      setSuccessMessage(response.message);
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "login") {
    return <><AuthVisual mode={mode} /><main className="relative z-10 flex min-h-screen w-full items-center justify-start p-[32px] lg:pl-[80px]"><div className="relative w-full max-w-[500px] rounded-xl border border-white/10 bg-white/5 p-[48px] shadow-2xl backdrop-blur-[25px]"><div className="absolute top-0 left-0 h-4 w-4 border-t border-l border-primary-container opacity-50" /><div className="absolute right-0 bottom-0 h-4 w-4 border-r border-b border-primary-container opacity-50" /><div className="mb-[48px]"><h1 className="mb-[4px] font-display-md text-display-md tracking-tighter text-primary uppercase">TERRANOVA AI</h1><p className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant"><span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-container" />Orchestrating the Urban Future</p></div><form className="space-y-[24px]" onSubmit={handleSubmit}><AuthInput id="email" type="email" placeholder="System ID / Email" value={email} onChange={setEmail} /><AuthInput id="password" type="password" placeholder="Access Key" value={password} onChange={setPassword} minLength={8} /><FormMessages errorMessage={errorMessage} successMessage={successMessage} /><button className="w-full rounded border border-primary-container/60 px-[24px] py-[12px] font-label-caps text-label-caps tracking-widest text-primary uppercase transition-all hover:bg-primary-container/15 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : content.action}</button></form><AlternateLink content={content} /></div></main></>;
  }

  return <><AuthVisual mode={mode} /><main className="relative z-20 flex min-h-screen w-full items-center justify-end px-[32px] py-[32px] md:px-[80px] lg:px-[12%]"><aside className="relative mr-auto hidden h-96 flex-col justify-between md:flex"><div className="max-w-xs space-y-[48px]"><div className="space-y-2"><h2 className="font-label-caps text-label-caps tracking-widest text-primary opacity-80">CITIZEN ACCESS INCLUDES</h2><div className="h-px w-12 bg-primary-container/50" /></div><div className="space-y-[24px]">{[["visibility", "View development projects"], ["forum", "Submit feedback & proposals"], ["analytics", "Track project progress"]].map(([icon, label]) => <div key={icon} className="group flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded border border-primary-container/30 bg-primary-container/5"><span className="material-symbols-outlined text-sm text-primary">{icon}</span></div><span className="font-data-mono text-sm text-on-surface-variant transition-colors group-hover:text-on-surface">{label}</span></div>)}</div></div></aside><div className="relative w-full max-w-md rounded-xl border border-white/10 bg-surface-bright/10 p-[48px] shadow-2xl backdrop-blur-[40px]"><div className="mb-[48px]"><h1 className="mb-[4px] font-display-md text-display-md tracking-tight text-on-surface">Citizen Access</h1><p className="font-data-mono text-data-mono text-on-surface-variant">Initialize identity matrix</p></div><form className="space-y-[24px]" onSubmit={handleSubmit}><AuthInput id="fullName" label="Full Name" type="text" value={fullName} onChange={setFullName} /><AuthInput id="email" label="Email Address" type="email" value={email} onChange={setEmail} /><AuthInput id="password" label="Password" type="password" value={password} onChange={setPassword} minLength={8} /><FormMessages errorMessage={errorMessage} successMessage={successMessage} /><button className="group flex w-full items-center justify-center gap-2 rounded border border-primary-container/80 bg-primary-container/5 px-6 py-3 text-primary transition-all duration-300 hover:bg-primary-container/20 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isSubmitting}><span className="font-label-caps text-label-caps tracking-widest">{isSubmitting ? "Submitting..." : content.action}</span><span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span></button></form><AlternateLink content={content} compact /><div className="mt-[48px] border-t border-white/5 pt-[12px] text-center"><p className="font-data-mono text-[11px] text-outline-variant">New accounts are created with standard citizen access.</p></div></div></main></>;
}

type AuthInputProps = { id: string; label?: string; type: string; placeholder?: string; value: string; onChange: (value: string) => void; minLength?: number };

function AuthInput({ id, label, type, placeholder, value, onChange, minLength }: AuthInputProps) {
  const inputClass = label ? "w-full border-0 border-b border-primary-container/30 bg-transparent px-0 py-2 font-body-md text-on-surface outline-none transition-all focus:border-primary focus:bg-primary-container/5 focus:ring-0" : "w-full border-b-2 border-outline-variant bg-white/[0.03] px-[12px] py-[12px] font-data-mono text-data-mono text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary-container";
  return <div className="group relative"><label htmlFor={id} className={label ? "mb-1 block font-label-caps text-label-caps text-on-surface-variant transition-colors group-focus-within:text-primary" : "sr-only"}>{label ?? id}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} minLength={minLength} required className={inputClass} /></div>;
}

function FormMessages({ errorMessage, successMessage }: { errorMessage: string; successMessage: string }) {
  return <>{errorMessage ? <div className="border border-danger/30 bg-danger/10 px-[12px] py-[12px] font-data-mono text-sm text-danger">{errorMessage}</div> : null}{successMessage ? <div className="border border-success/30 bg-success/10 px-[12px] py-[12px] font-data-mono text-sm text-success">{successMessage}</div> : null}</>;
}

function AlternateLink({ content, compact = false }: { content: (typeof pageContent)[AuthMode]; compact?: boolean }) {
  return <div className={compact ? "mt-[24px] text-center" : "mt-[48px] border-t border-white/5 pt-[24px] text-center"}><p className="font-data-mono text-data-mono text-on-surface-variant">{content.alternateLabel}{" "}<Link className={compact ? "text-primary underline decoration-white/20 underline-offset-4 transition hover:text-primary-container" : "border-b border-primary/30 pb-px text-primary transition hover:text-primary-container"} href={content.alternateHref}>{content.alternateAction}</Link></p></div>;
}
