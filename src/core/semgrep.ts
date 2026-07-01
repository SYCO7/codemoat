import { run } from "./exec.js";
import type { Finding, Severity } from "./types.js";

export const DEFAULT_SEMGREP_CONFIGS = ["p/security-audit", "p/owasp-top-ten", "p/secrets"];

export interface SemgrepOptions {
  cwd: string;
  targets: string[];
  configs?: string[];
  baselineCommit?: string;
}

interface SemgrepResultRow {
  check_id: string;
  path: string;
  start: { line: number; col: number };
  end: { line: number; col: number };
  extra: {
    message: string;
    severity: string;
    fix?: string;
    metadata?: {
      cwe?: string[];
      [key: string]: unknown;
    };
  };
}

interface SemgrepOutput {
  results: SemgrepResultRow[];
  errors: unknown[];
}

// Registry rules (e.g. p/security-audit) emit extra.severity as ERROR/WARNING/INFO.
// CodeMoat's own rules use the newer CRITICAL/HIGH/MEDIUM/LOW scheme, which Semgrep
// also accepts in rule YAML and passes through to extra.severity unchanged.
export function mapSeverity(sev: string): Severity {
  switch (sev.toUpperCase()) {
    case "CRITICAL":
      return "critical";
    case "ERROR":
    case "HIGH":
      return "high";
    case "WARNING":
    case "MEDIUM":
      return "medium";
    case "INFO":
    case "LOW":
      return "low";
    default:
      return "medium";
  }
}

export function firstCwe(cwe?: string[]): string | undefined {
  if (!cwe || cwe.length === 0) return undefined;
  // metadata.cwe entries look like "CWE-78: Improper Neutralization of ..." — keep just the id.
  const match = cwe[0].match(/^CWE-\d+/);
  return match ? match[0] : cwe[0];
}

// When --config points at a local directory, Semgrep prefixes check_id with
// a dotted version of the config's absolute filesystem path (e.g. on a GH
// Actions runner: "home.runner.work._actions.SYCO7.codemoat.v1.src.rules.
// codemoat-cors-wildcard-credentials"). Strip that down to just the rule's
// own id. Registry rule ids (which are legitimately dotted, e.g.
// "python.lang.security.audit.subprocess-shell-true...") are left alone.
export function normalizeRuleId(checkId: string): string {
  const match = checkId.match(/codemoat-[a-z0-9-]+$/);
  return match ? match[0] : checkId;
}

export async function runSemgrep(opts: SemgrepOptions): Promise<Finding[]> {
  const configs = opts.configs ?? DEFAULT_SEMGREP_CONFIGS;
  const args = ["scan", "--json", "--metrics=off"];
  for (const c of configs) args.push("--config", c);
  if (opts.baselineCommit) args.push("--baseline-commit", opts.baselineCommit);
  args.push(...opts.targets);

  // semgrep scan exits 0 by default even with findings (--error not passed); 1 covers older/edge behavior.
  const { stdout } = await run("semgrep", args, { cwd: opts.cwd, acceptExitCodes: [0, 1] });
  const parsed: SemgrepOutput = JSON.parse(stdout);

  return parsed.results.map((r) => ({
    file: r.path,
    line: r.start.line,
    endLine: r.end.line,
    severity: mapSeverity(r.extra.severity),
    cwe: firstCwe(r.extra.metadata?.cwe),
    ruleId: normalizeRuleId(r.check_id),
    description: r.extra.message,
    suggestedFix: r.extra.fix,
    source: "semgrep" as const,
  }));
}
