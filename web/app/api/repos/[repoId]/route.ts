import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS scopes this to repos the signed-in user owns. Cascades to scans/findings.
  const { error, count } = await supabase.from("repos").delete({ count: "exact" }).eq("id", repoId);

  if (error) {
    console.error("repo delete failed:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
