import { runSemgrep, DEFAULT_SEMGREP_CONFIGS } from "./semgrep.js";
import { runGitleaks } from "./gitleaks.js";
import type { Finding, ScanResult } from "./types.js";

export interface ScanOptions {
  cwd: string;
  /** Files changed in the PR/diff — semgrep is scoped to these; gitleaks scans the same commit range. */
  targets: string[];
  /** Base ref/commit to diff against, e.g. "origin/main" or a base SHA. */
  baseRef?: string;
  aiRulesConfig?: string;
  extraSemgrepConfigs?: string[];
}

const severityRank: Record<Finding["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const rankDiff = severityRank[a.severity] - severityRank[b.severity];
    if (rankDiff !== 0) return rankDiff;
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });
}

export async function scan(opts: ScanOptions): Promise<ScanResult> {
  const start = Date.now();

  if (opts.targets.length === 0) {
    return { findings: [], filesScanned: 0, durationMs: Date.now() - start };
  }

  const configs = [...DEFAULT_SEMGREP_CONFIGS, ...(opts.extraSemgrepConfigs ?? [])];
  if (opts.aiRulesConfig) configs.push(opts.aiRulesConfig);

  const [semgrepFindings, gitleaksFindings] = await Promise.all([
    runSemgrep({
      cwd: opts.cwd,
      targets: opts.targets,
      configs,
      baselineCommit: opts.baseRef,
    }),
    runGitleaks({
      cwd: opts.cwd,
      logOpts: opts.baseRef ? `${opts.baseRef}..HEAD` : undefined,
      noGit: !opts.baseRef,
    }),
  ]);

  const findings = sortFindings([...semgrepFindings, ...gitleaksFindings]).filter((f) =>
    opts.targets.includes(f.file)
  );

  return {
    findings,
    filesScanned: opts.targets.length,
    durationMs: Date.now() - start,
  };
}
