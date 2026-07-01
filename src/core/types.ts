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
