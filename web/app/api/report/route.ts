import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { hashApiKey } from "@/lib/api-key";
import type { ScanResult } from "@/lib/types";

const findingSchema = z.object({
  file: z.string(),
  line: z.number(),
  endLine: z.number().optional(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  cwe: z.string().optional(),
  ruleId: z.string(),
  description: z.string(),
  suggestedFix: z.string().optional(),
  source: z.enum(["semgrep", "gitleaks", "codemoat-ai-ruleset"]),
});

const bodySchema = z.object({
  repo: z.string(),
  commitSha: z.string(),
  branch: z.string().optional(),
  prNumber: z.number().optional(),
  result: z.object({
    findings: z.array(findingSchema),
    filesScanned: z.number(),
    durationMs: z.number(),
  }),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!apiKey) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { commitSha, branch, prNumber, result } = parsed.data;

  const supabase = createServiceClient();
  const { data: repo, error: repoError } = await supabase
    .from("repos")
    .select("id")
    .eq("api_key_hash", hashApiKey(apiKey))
    .single();

  if (repoError || !repo) {
    return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  }

  const { data: scanId, error: rpcError } = await supabase.rpc("report_scan", {
    p_repo_id: repo.id,
    p_commit_sha: commitSha,
    p_branch: branch ?? null,
    p_pr_number: prNumber ?? null,
    p_duration_ms: (result as ScanResult).durationMs,
    p_findings: (result as ScanResult).findings,
  });

  if (rpcError) {
    // errcode 54000 is our own rate-limit guard in report_scan() — safe to
    // surface. Anything else is an internal DB detail; log server-side only.
    if (rpcError.code === "54000") {
      return NextResponse.json({ error: "rate limited" }, { status: 429 });
    }
    console.error("report_scan failed:", rpcError);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scanId });
}
