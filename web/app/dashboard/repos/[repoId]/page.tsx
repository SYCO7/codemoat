import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionList, MotionItem } from "@/components/motion-list";
import { RepoActions } from "@/components/repo-actions";

export default async function RepoDetailPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params;
  const supabase = await createClient();

  const { data: repo } = await supabase
    .from("repos")
    .select("id, full_name, is_private, api_key_prefix")
    .eq("id", repoId)
    .maybeSingle();

  if (!repo) notFound();

  const { data: scans } = await supabase
    .from("scans")
    .select("id, commit_sha, branch, pr_number, findings_count, critical_count, created_at")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{repo.full_name}</h1>
        {repo.is_private && <Badge variant="outline">Private</Badge>}
      </div>
      {repo.api_key_prefix && (
        <p className="text-xs text-muted-foreground">
          API key: <code className="rounded bg-muted px-1.5 py-0.5">{repo.api_key_prefix}…</code>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage</CardTitle>
        </CardHeader>
        <CardContent>
          <RepoActions repoId={repoId} fullName={repo.full_name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan history</CardTitle>
        </CardHeader>
        <CardContent>
          {!scans || scans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scans yet. Add the API key to a workflow and open a PR to see results here.
            </p>
          ) : (
            <MotionList className="space-y-2">
              {scans.map((scan) => (
                <MotionItem key={scan.id}>
                  <Link
                    href={`/dashboard/repos/${repoId}/scans/${scan.id}`}
                    className="flex items-center justify-between rounded-md border border-border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_10px_30px_-15px_rgba(167,139,250,0.4)]"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <code className="text-muted-foreground">{scan.commit_sha.slice(0, 8)}</code>
                      {scan.branch && <span className="text-muted-foreground">{scan.branch}</span>}
                      {scan.pr_number && <span className="text-muted-foreground">#{scan.pr_number}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {scan.critical_count > 0 && (
                        <span className="text-destructive">{scan.critical_count} critical</span>
                      )}
                      <span>{scan.findings_count} findings</span>
                      <span>{new Date(scan.created_at).toLocaleString()}</span>
                    </div>
                  </Link>
                </MotionItem>
              ))}
            </MotionList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
