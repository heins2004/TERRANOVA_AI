import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HomeDashboard } from "@/components/home-dashboard";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser({ cookieHeader: cookieStore.toString() });

  if (!user) {
    redirect("/login");
  }

  return <HomeDashboard user={user} />;
}
