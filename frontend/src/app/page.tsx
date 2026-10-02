import { cookies } from "next/headers";
import { getCurrentUser, AuthUser } from "@/lib/auth";
import { LandingView } from "@/components/landing/LandingView";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";

export default async function Page() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let user: AuthUser | null = null;
  if (cookieHeader) {
    try {
      user = await getCurrentUser({ cookieHeader });
    } catch {
      // Fail-safe: if backend is down or error occurs, treat as unauthenticated
      user = null;
    }
  }

  if (user) {
    return <HomeDashboard user={user} />;
  }

  return <LandingView />;
}

