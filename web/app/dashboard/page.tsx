import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionList, MotionItem } from "@/components/motion-list";
import { FolderGit2, ScanSearch, ShieldAlert, TriangleAlert, Inbox, Plus } from "lucide-react";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "critical";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "critical" && value > 0 ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <div className={`font-heading text-3xl font-bold ${tone === "critical" && value > 0 ? "text-destructive" : ""}`}>
        {value}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, plan")
    .eq("owner_id", user!.id)
    .single();

  const { data: repos } = await supabase
    .from("repos")
    .select("id, full_name, is_private, plan")
    .eq("org_id", org?.id ?? "")
    .order("created_at", { ascending: false });

  const reposWithLastScan = await Promise.all(
    (repos ?? []).map(async (repo) => {
      const { data: allScans } = await supabase
        .from("scans")
        .select("findings_count, critical_count, created_at")
        .eq("repo_id", repo.id)
        .order("created_at", { ascending: false });
      return { ...repo, scans: allScans ?? [] };
    })
  );

  const totalScans = reposWithLastScan.reduce((sum, r) => sum + r.scans.length, 0);
  const totalFindings = reposWithLastScan.reduce((sum, r) => sum + r.scans.reduce((s, sc) => s + sc.findings_count, 0), 0);
  const totalCritical = reposWithLastScan.reduce((sum, r) => sum + r.scans.reduce((s, sc) => s + sc.critical_count, 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{org?.name ?? "Your org"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.user_metadata?.user_name ?? user?.email}
          </p>
        </div>
        <Badge
          variant="outline"
          className={org?.plan === "paid" ? "border-primary text-primary" : "text-muted-foreground"}
        >
          {org?.plan === "paid" ? "Paid" : "Free"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={FolderGit2} label="Repos" value={reposWithLastScan.length} />
        <StatCard icon={ScanSearch} label="Scans" value={totalScans} />
        <StatCard icon={ShieldAlert} label="Findings" value={totalFindings} />
        <StatCard icon={TriangleAlert} label="Critical" value={totalCritical} tone="critical" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Repos</CardTitle>
          <Link
            href="/dashboard/connect"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Connect a repo
          </Link>
        </CardHeader>
        <CardContent>
          {reposWithLastScan.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border p-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No repos connected yet. Scan history will show up here once you connect one.
              </p>
              <Link
                href="/dashboard/connect"
                className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Connect a repo
              </Link>
            </div>
          ) : (
            <MotionList className="space-y-2">
              {reposWithLastScan.map((repo) => {
                const lastScan = repo.scans[0];
                return (
                  <MotionItem key={repo.id}>
                    <Link
                      href={`/dashboard/repos/${repo.id}`}
                      className="flex items-center justify-between rounded-md border border-border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_10px_30px_-15px_rgba(167,139,250,0.4)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{repo.full_name}</span>
                        {repo.is_private && <Badge variant="outline">Private</Badge>}
                      </div>
                      {lastScan ? (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lastScan.critical_count > 0 && (
                            <span className="text-destructive">{lastScan.critical_count} critical</span>
                          )}
                          <span>{lastScan.findings_count} findings</span>
                          <span>{timeAgo(lastScan.created_at)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No scans yet</span>
                      )}
                    </Link>
                  </MotionItem>
                );
              })}
            </MotionList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
