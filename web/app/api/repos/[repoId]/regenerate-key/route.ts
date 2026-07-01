import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-key";

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
    .select("id")
    .single();

  if (error || !repo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ apiKey: key });
}
