import { test } from "node:test";
import assert from "node:assert/strict";
import { mapSeverity, firstCwe, normalizeRuleId } from "../../src/core/semgrep.js";
import { normalizeGitleaksFinding } from "../../src/core/gitleaks.js";
import { sortFindings } from "../../src/core/scan.js";
import type { Finding } from "../../src/core/types.js";

test("mapSeverity maps semgrep severities to the normalized scale", () => {
  assert.equal(mapSeverity("ERROR"), "high");
  assert.equal(mapSeverity("WARNING"), "medium");
  assert.equal(mapSeverity("INFO"), "low");
  assert.equal(mapSeverity("error"), "high", "should be case-insensitive");
  assert.equal(mapSeverity("SOMETHING_UNKNOWN"), "medium", "unknown severities default to medium");
});

test("normalizeRuleId strips the runner's absolute config-path prefix off CodeMoat rule ids", () => {
  assert.equal(
    normalizeRuleId("home.runner.work._actions.SYCO7.codemoat.v1.src.rules.codemoat-cors-wildcard-credentials"),
    "codemoat-cors-wildcard-credentials"
  );
  assert.equal(normalizeRuleId("src.rules.codemoat-weak-hardcoded-credential"), "codemoat-weak-hardcoded-credential");
});

test("normalizeRuleId leaves real dotted registry rule ids untouched", () => {
  assert.equal(
    normalizeRuleId("python.lang.security.audit.subprocess-shell-true.subprocess-shell-true"),
    "python.lang.security.audit.subprocess-shell-true.subprocess-shell-true"
  );
});

test("mapSeverity also passes through CodeMoat's own CRITICAL/HIGH/MEDIUM/LOW rule severities", () => {
  assert.equal(mapSeverity("CRITICAL"), "critical");
  assert.equal(mapSeverity("HIGH"), "high");
  assert.equal(mapSeverity("MEDIUM"), "medium");
  assert.equal(mapSeverity("LOW"), "low");
});

test("firstCwe extracts just the CWE id from a registry-style metadata string", () => {
  assert.equal(
    firstCwe(["CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')"]),
    "CWE-78"
  );
  assert.equal(firstCwe([]), undefined);
  assert.equal(firstCwe(undefined), undefined);
});

test("normalizeGitleaksFinding maps the real gitleaks JSON schema to our Finding shape", () => {
  const finding = normalizeGitleaksFinding({
    RuleID: "github-pat",
    Description: "Uncovered a GitHub Personal Access Token",
    StartLine: 6,
    EndLine: 6,
    Match: "ghp_xxx",
    Secret: "ghp_xxx",
    File: "vuln.py",
    Fingerprint: "vuln.py:github-pat:6",
  });

  assert.deepEqual(finding, {
    file: "vuln.py",
    line: 6,
    endLine: 6,
    severity: "critical",
    cwe: "CWE-798",
    ruleId: "github-pat",
    description: "Uncovered a GitHub Personal Access Token",
    source: "gitleaks",
  });
});

test("sortFindings orders by severity, then file, then line", () => {
  const findings: Finding[] = [
    { file: "b.py", line: 5, severity: "low", ruleId: "r1", description: "d", source: "semgrep" },
    { file: "a.py", line: 10, severity: "critical", ruleId: "r2", description: "d", source: "gitleaks" },
    { file: "a.py", line: 2, severity: "critical", ruleId: "r3", description: "d", source: "gitleaks" },
    { file: "a.py", line: 1, severity: "high", ruleId: "r4", description: "d", source: "semgrep" },
  ];

  const sorted = sortFindings(findings);

  assert.deepEqual(
    sorted.map((f) => `${f.severity}:${f.file}:${f.line}`),
    ["critical:a.py:2", "critical:a.py:10", "high:a.py:1", "low:b.py:5"]
  );
});
