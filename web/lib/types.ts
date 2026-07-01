// Mirrors src/core/types.ts in the repo root (the Action/CLI package).
// Duplicated here because web/ is a separate Next.js project that can't cleanly
// import across the package boundary — keep these two in sync by hand.

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingSource = "semgrep" | "gitleaks" | "codemoat-ai-ruleset";

export interface Finding {
  file: string;
  line: number;
  endLine?: number;
  severity: Severity;
  cwe?: string;
  ruleId: string;
  description: string;
  suggestedFix?: string;
  source: FindingSource;
}

export interface ScanResult {
  findings: Finding[];
  filesScanned: number;
  durationMs: number;
}

export type Plan = "free" | "paid";
