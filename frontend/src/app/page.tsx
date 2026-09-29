import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LandingView } from "@/components/landing/LandingView";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser({ cookieHeader: cookieStore.toString() });

  if (user) {
    redirect("/dashboard");
  }

  return <LandingView />;
}
