import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// One-time capture of the GitHub OAuth provider_token right after sign-in.
// Supabase only surfaces provider_token client-side, right after the OAuth
// redirect completes (via onAuthStateChange) — it is not persisted or
// re-issued on later session refreshes, so this must run then or not at all.
// The column itself has SELECT revoked from anon/authenticated (see
// 0003_lock_github_token_column.sql) — this route can write it (RLS "self
// update" policy) but nothing running as the signed-in user can read it back.
export async function POST(request: Request) {
  const { providerToken } = await request.json().catch(() => ({ providerToken: null }));
  if (!providerToken || typeof providerToken !== "string") {
    return NextResponse.json({ error: "missing providerToken" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ github_access_token: providerToken })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
