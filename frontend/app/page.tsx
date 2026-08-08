import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="glass-card w-full max-w-3xl rounded-[2rem] p-10">
        <p className="text-sm font-medium uppercase tracking-[0.32em] text-secondary">
          TERRANOVA AI
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">
          Authentication flow is connected.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
          Use the routes below to register a user in PostgreSQL through FastAPI
          and then log in from the Next.js frontend.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            className="rounded-2xl bg-primary px-5 py-3 text-center font-semibold text-primary-foreground transition hover:opacity-95"
            href="/register"
          >
            Open Register
          </Link>
          <Link
            className="rounded-2xl border border-border bg-surface px-5 py-3 text-center font-semibold text-foreground transition hover:bg-surface-muted"
            href="/login"
          >
            Open Login
          </Link>
        </div>
      </div>
    </main>
  );
}
