import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { GithubTokenCapture } from "@/components/github-token-capture";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const login = (user?.user_metadata?.user_name as string | undefined) ?? user?.email ?? "account";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="relative flex min-h-screen">
      <div className="ambient-glow opacity-50" aria-hidden="true">
        <span className="blob-a" />
        <span className="blob-b" />
      </div>
      <GithubTokenCapture />
      <DashboardSidebar login={login} avatarUrl={avatarUrl} />
      <main className="relative z-10 flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
