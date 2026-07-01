import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateApiKey } from "@/lib/api-key";
import { autoSetupRepo } from "@/lib/github-secrets";

export async function POST(request: Request, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { key, hash, prefix } = generateApiKey();

  // RLS ("repos: via org ownership") already scopes this update to repos the
  // signed-in user owns — no separate ownership check needed here.
  const { data: repo, error } = await supabase
    .from("repos")
    .update({ api_key_hash: hash, api_key_prefix: prefix })
    .eq("id", repoId)
    .select("id, owner, full_name")
    .single();

  if (error || !repo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Rotating the key invalidates the old one everywhere it's in use — re-run
  // the same auto-wiring as connect so the repo's GitHub secret matches the
  // new key instead of silently going stale.
  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("github_access_token")
    .eq("id", user.id)
    .single();

  let autoSetup = null;
  const token = profile?.github_access_token as string | null;
  if (token) {
    autoSetup = await autoSetupRepo(token, repo.owner, repo.full_name.split("/")[1] ?? repo.full_name, key);
  }

  return NextResponse.json({ apiKey: key, autoSetup });
}
