import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingPage } from "./(marketing)/marketing-page";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already redirects signed-in users away from "/" to /dashboard —
  // this is a defensive fallback, not the primary gate.
  if (user) redirect("/dashboard");

  return <MarketingPage />;
}
