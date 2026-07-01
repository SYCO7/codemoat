import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEVERITY_EMOJI, cweUrl } from "@/lib/severity";
import type { Severity } from "@/lib/types";
import { MotionList, MotionItem } from "@/components/motion-list";

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ repoId: string; scanId: string }>;
}) {
  const { scanId } = await params;
  const supabase = await createClient();

  const { data: scan } = await supabase
    .from("scans")
    .select("id, commit_sha, branch, pr_number, duration_ms, created_at")
    .eq("id", scanId)
    .maybeSingle();

  if (!scan) notFound();

  const { data: findings } = await supabase
    .from("findings")
    .select("id, file, line, severity, cwe, rule_id, description, suggested_fix, source")
    .eq("scan_id", scanId)
    .order("severity", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Scan <code>{scan.commit_sha.slice(0, 8)}</code>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {scan.branch && `${scan.branch} · `}
          {scan.pr_number && `PR #${scan.pr_number} · `}
          {new Date(scan.created_at).toLocaleString()} · {(scan.duration_ms / 1000).toFixed(1)}s
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Findings ({findings?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!findings || findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues found.</p>
          ) : (
            <MotionList className="space-y-3">
              {findings.map((f) => {
                const cweLink = f.cwe ? cweUrl(f.cwe) : null;
                return (
                  <MotionItem key={f.id}>
                    <div className="rounded-md border border-border p-4 transition-colors hover:border-primary/30">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span>{SEVERITY_EMOJI[f.severity as Severity]}</span>
                        <span className="font-medium uppercase">{f.severity}</span>
                        <code className="text-muted-foreground">
                          {f.file}:{f.line}
                        </code>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{f.rule_id}</code>
                        {f.cwe &&
                          (cweLink ? (
                            <a href={cweLink} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">
                              {f.cwe}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">{f.cwe}</span>
                          ))}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                      {f.suggested_fix && (
                        <p className="mt-2 text-sm">
                          <span className="text-muted-foreground">Suggested fix: </span>
                          <code className="rounded bg-muted px-1.5 py-0.5">{f.suggested_fix}</code>
                        </p>
                      )}
                    </div>
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
