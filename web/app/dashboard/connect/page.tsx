import { createClient } from "@/lib/supabase/server";
import { ConnectPageClient } from "./connect-page-client";

export default async function ConnectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: org } = await supabase.from("orgs").select("plan").eq("owner_id", user!.id).single();

  return <ConnectPageClient orgPlan={org?.plan ?? "free"} />;
}
