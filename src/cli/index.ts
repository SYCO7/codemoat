#!/usr/bin/env node
import { parseArgs } from "node:util";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { scan } from "../core/scan.js";
import { run } from "../core/exec.js";
import type { Finding } from "../core/types.js";

const SEVERITY_RANK: Record<Finding["severity"], number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const SEVERITY_LABEL: Record<Finding["severity"], string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
  info: "INFO",
};

function printUsage(): void {
  console.log(`codemoat scan — scan changed files for AI-generated-code security issues

Usage:
  codemoat scan [options]

Options:
  --base <ref>       Diff against this git ref (e.g. origin/main). Default: uncommitted + untracked changes.
  --path <dir>       Repo directory to scan. Default: current directory.
  --fail-on <sev>    Exit non-zero if a finding at or above this severity is found: critical|high|medium|low|none. Default: high.
  --all              Scan every tracked file instead of just the diff.
  -h, --help         Show this help.
`);
}

async function resolveGitTargets(cwd: string, base: string | undefined, all: boolean): Promise<{ targets: string[]; baseRef?: string }> {
  if (all) {
    const { stdout } = await run("git", ["ls-files"], { cwd, acceptExitCodes: [0] });
    return { targets: stdout.split("\n").map((l) => l.trim()).filter(Boolean) };
  }

  if (base) {
    const { stdout: mergeBase } = await run("git", ["merge-base", base, "HEAD"], { cwd, acceptExitCodes: [0] });
    const baseSha = mergeBase.trim();
    const { stdout } = await run("git", ["diff", "--name-only", "--diff-filter=ACMR", baseSha, "HEAD"], {
      cwd,
      acceptExitCodes: [0],
    });
    return { targets: stdout.split("\n").map((l) => l.trim()).filter(Boolean), baseRef: baseSha };
  }

  const { stdout: tracked } = await run("git", ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"], {
    cwd,
    acceptExitCodes: [0],
  });
  const { stdout: untracked } = await run("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd,
    acceptExitCodes: [0],
  });
  const targets = [...tracked.split("\n"), ...untracked.split("\n")].map((l) => l.trim()).filter(Boolean);
  return { targets };
}

function printFindings(findings: Finding[], cwd: string): void {
  if (findings.length === 0) {
    console.log("No issues found.");
    return;
  }
  for (const f of findings) {
    console.log(`\n${SEVERITY_LABEL[f.severity]}  ${f.file}:${f.line}  [${f.ruleId}]${f.cwe ? ` (${f.cwe})` : ""}`);
    console.log(`  ${f.description}`);
    if (f.suggestedFix) console.log(`  suggested fix: ${f.suggestedFix}`);
  }
  console.log(`\n${findings.length} issue(s) found.`);
}

async function runScanCommand(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      base: { type: "string" },
      path: { type: "string" },
      "fail-on": { type: "string", default: "high" },
      all: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return 0;
  }

  const cwd = values.path ? join(process.cwd(), values.path) : process.cwd();
  const failOn = String(values["fail-on"]).toLowerCase();

  const { targets, baseRef } = await resolveGitTargets(cwd, values.base as string | undefined, Boolean(values.all));

  if (targets.length === 0) {
    console.log("No changed files to scan.");
    return 0;
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(__dirname, "..", "..");
  const aiRulesConfig = join(repoRoot, "src", "rules");

  console.log(`Scanning ${targets.length} file(s)${baseRef ? ` against base ${baseRef.slice(0, 8)}` : ""}...`);
  const result = await scan({ cwd, targets, baseRef, aiRulesConfig });

  printFindings(
    result.findings,
    cwd
  );

  if (failOn !== "none") {
    const threshold = SEVERITY_RANK[failOn as Finding["severity"]];
    if (threshold === undefined) {
      console.error(`Unknown --fail-on severity: ${failOn}`);
      return 2;
    }
    const shouldFail = result.findings.some((f) => SEVERITY_RANK[f.severity] <= threshold);
    if (shouldFail) return 1;
  }
  return 0;
}

async function mainCli(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "-h" || command === "--help") {
    printUsage();
    process.exit(0);
  }

  if (command === "scan") {
    const code = await runScanCommand(rest);
    process.exit(code);
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(2);
}

mainCli().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(2);
});
