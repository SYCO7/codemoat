import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface GithubRepo {
  id: number;
  full_name: string;
  owner: { login: string };
  private: boolean;
  permissions?: { push?: boolean };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // profiles.github_access_token has SELECT revoked for anon/authenticated —
  // only a service-role client can read it back.
  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("github_access_token")
    .eq("id", user.id)
    .single();

  const token = profile?.github_access_token as string | null;
  if (!token) {
    return NextResponse.json(
      { error: "no_github_token", message: "Sign out and back in to grant repo access." },
      { status: 409 }
    );
  }

  const repos: GithubRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&page=${page}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "github_api_error", status: res.status }, { status: 502 });
    }
    const pageRepos = (await res.json()) as GithubRepo[];
    repos.push(...pageRepos);
    if (pageRepos.length < 100) break;
  }

  return NextResponse.json({
    repos: repos
      .filter((r) => r.permissions?.push !== false)
      .map((r) => ({
        githubRepoId: r.id,
        fullName: r.full_name,
        owner: r.owner.login,
        isPrivate: r.private,
      })),
  });
}
