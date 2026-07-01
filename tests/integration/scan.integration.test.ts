import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { scan } from "../../src/core/scan.js";

// Requires `semgrep` and `gitleaks` on PATH — same binaries the Action/CLI shell out to.
// This exercises the real CLI invocations and real JSON parsing, not mocks.

// compiled test lives at dist-tests/tests/integration/ — three levels up is the real repo root.
const REPO_ROOT = join(import.meta.dirname, "..", "..", "..");

test("scan() finds the AI-ruleset vulnerability in each sample/vulnerable file, and nothing in samples/safe", async () => {
  const vulnerableTargets = [
    "samples/vulnerable/cors-wildcard.js",
    "samples/vulnerable/debug-route.js",
    "samples/vulnerable/eval-injection.js",
    "samples/vulnerable/insecure-deserialize.py",
    "samples/vulnerable/insecure-yaml.py",
    "samples/vulnerable/jwt-bypass.js",
    "samples/vulnerable/path-traversal.js",
    "samples/vulnerable/ssrf.js",
    "samples/vulnerable/weak-credential.py",
    "samples/vulnerable/flask-debug.py",
    "samples/vulnerable/django_settings.py",
    "samples/vulnerable/commented-auth.js",
  ];

  // Registry packs (p/security-audit etc.) independently flag several of these same constructs too,
  // so we assert the AI ruleset specifically fires per-file, not a total finding count.
  const isCodemoatRule = (ruleId: string) => ruleId.includes("codemoat-");

  const vulnResult = await scan({ cwd: REPO_ROOT, targets: vulnerableTargets, aiRulesConfig: "src/rules" });
  const filesWithAiFinding = new Set(vulnResult.findings.filter((f) => isCodemoatRule(f.ruleId)).map((f) => f.file));
  for (const target of vulnerableTargets) {
    assert.ok(filesWithAiFinding.has(target), `expected an AI-ruleset finding in ${target}`);
  }

  const safeTargets = vulnerableTargets.map((t) => t.replace("samples/vulnerable/", "samples/safe/"));
  const safeResult = await scan({ cwd: REPO_ROOT, targets: safeTargets, aiRulesConfig: "src/rules" });
  const aiFindingsInSafe = safeResult.findings.filter((f) => isCodemoatRule(f.ruleId));
  assert.equal(
    aiFindingsInSafe.length,
    0,
    `expected zero AI-ruleset findings in safe samples, got: ${aiFindingsInSafe.map((f) => `${f.file}:${f.ruleId}`).join(", ")}`
  );
});

test("scan() detects a real hardcoded secret via gitleaks and a real command-injection flaw via semgrep registry rules", async () => {
  const result = await scan({
    cwd: REPO_ROOT,
    targets: ["tests/fixtures/mixed-vuln.py"],
  });

  const gitleaksCount = result.findings.filter((f) => f.source === "gitleaks").length;
  const semgrepCount = result.findings.filter((f) => f.source === "semgrep").length;
  assert.ok(gitleaksCount >= 1, "expected at least one gitleaks finding");
  assert.ok(semgrepCount >= 1, "expected at least one semgrep finding");
});
