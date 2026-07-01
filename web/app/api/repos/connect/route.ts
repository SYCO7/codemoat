import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateApiKey } from "@/lib/api-key";
import { autoSetupRepo } from "@/lib/github-secrets";

const bodySchema = z.object({
  githubRepoId: z.number(),
  fullName: z.string(),
  owner: z.string(),
  isPrivate: z.boolean(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { githubRepoId, fullName, owner, isPrivate } = parsed.data;

  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .select("id, plan")
    .eq("owner_id", user.id)
    .single();
  if (orgError || !org) {
    return NextResponse.json({ error: "no org" }, { status: 404 });
  }

  if (isPrivate && org.plan !== "paid") {
    return NextResponse.json(
      { error: "private_repos_require_paid_plan", message: "Private repos need a paid plan — upgrade in Settings." },
      { status: 402 }
    );
  }

  const { key, hash, prefix } = generateApiKey();

  const { data: repo, error: insertError } = await supabase
    .from("repos")
    .insert({
      org_id: org.id,
      github_repo_id: githubRepoId,
      full_name: fullName,
      owner,
      is_private: isPrivate,
      plan: org.plan,
      api_key_hash: hash,
      api_key_prefix: prefix,
    })
    .select("id")
    .single();

  if (insertError || !repo) {
    const isDuplicate = insertError?.code === "23505";
    if (!isDuplicate) console.error("repo insert failed:", insertError);
    return NextResponse.json(
      { error: isDuplicate ? "already_connected" : "insert_failed" },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  // Best-effort auto-wiring: create the repo secret + workflow file so the
  // user doesn't have to hand-copy anything. profiles.github_access_token
  // has SELECT revoked for anon/authenticated, so only the service client
  // can read it back.
  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("github_access_token")
    .eq("id", user.id)
    .single();

  let autoSetup = null;
  const token = profile?.github_access_token as string | null;
  if (token) {
    autoSetup = await autoSetupRepo(token, owner, fullName.split("/")[1] ?? fullName, key);
  }

  // apiKey is returned exactly once — it is never stored in plaintext anywhere.
  return NextResponse.json({ repoId: repo.id, apiKey: key, autoSetup });
}
