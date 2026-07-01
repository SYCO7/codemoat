import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { scan } from "../core/scan.js";
import { run } from "../core/exec.js";
import { reportScan } from "../core/report.js";
const COMMENT_MARKER = "<!-- codemoat-scan-report -->";
const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"];
const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const SEVERITY_EMOJI = {
    critical: "\u{1F534}",
    high: "\u{1F7E0}",
    medium: "\u{1F7E1}",
    low: "\u{1F535}",
    info: "\u{26AA}",
};
async function getChangedFiles(cwd, baseSha) {
    const { stdout } = await run("git", ["diff", "--name-only", "--diff-filter=ACMR", baseSha, "HEAD"], {
        cwd,
        acceptExitCodes: [0],
    });
    return stdout
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
}
function renderComment(findings, durationMs) {
    const lines = [COMMENT_MARKER, "## CodeMoat scan results", ""];
    if (findings.length === 0) {
        lines.push("No issues found in the changed files.");
    }
    else {
        const bySeverity = SEVERITY_ORDER.map((s) => [s, findings.filter((f) => f.severity === s).length]).filter(([, count]) => count > 0);
        lines.push(`Found **${findings.length}** issue(s): ` +
            bySeverity.map(([s, c]) => `${SEVERITY_EMOJI[s]} ${c} ${s}`).join(", "));
        lines.push("");
        lines.push("| Severity | File | Line | Rule | CWE | Description | Suggested fix |");
        lines.push("|---|---|---|---|---|---|---|");
        for (const f of findings) {
            const desc = f.description.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").slice(0, 200);
            const fix = f.suggestedFix ? `\`${f.suggestedFix.replace(/\|/g, "\\|").slice(0, 100)}\`` : "-";
            lines.push(`| ${SEVERITY_EMOJI[f.severity]} ${f.severity} | \`${f.file}\` | ${f.line} | \`${f.ruleId}\` | ${f.cwe ?? "-"} | ${desc} | ${fix} |`);
        }
    }
    lines.push("");
    lines.push(`_Scanned via Semgrep + Gitleaks + CodeMoat AI ruleset in ${(durationMs / 1000).toFixed(1)}s._`);
    return lines.join("\n");
}
async function upsertComment(octokit, owner, repo, issueNumber, body) {
    const { data: comments } = await octokit.rest.issues.listComments({ owner, repo, issue_number: issueNumber });
    const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));
    if (existing) {
        await octokit.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
    }
    else {
        await octokit.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body });
    }
}
async function main() {
    const token = core.getInput("github-token") || process.env.GITHUB_TOKEN || "";
    const failOnSeverity = (core.getInput("fail-on-severity") || "none").toLowerCase();
    const extraConfigsInput = core.getInput("semgrep-configs");
    const extraSemgrepConfigs = extraConfigsInput
        ? extraConfigsInput.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    const pr = github.context.payload.pull_request;
    const cwd = process.env.GITHUB_WORKSPACE || process.cwd();
    if (!pr) {
        core.info("CodeMoat: no pull_request payload found — nothing to scan.");
        return;
    }
    const baseSha = pr.base.sha;
    const changedFiles = await getChangedFiles(cwd, baseSha);
    if (changedFiles.length === 0) {
        core.info("CodeMoat: no changed files to scan.");
        return;
    }
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const repoRoot = join(__dirname, "..", "..");
    const aiRulesConfig = join(repoRoot, "src", "rules");
    const result = await scan({
        cwd,
        targets: changedFiles,
        baseRef: baseSha,
        aiRulesConfig,
        extraSemgrepConfigs,
    });
    core.setOutput("findings-count", result.findings.length);
    core.setOutput("critical-count", result.findings.filter((f) => f.severity === "critical").length);
    if (token) {
        const octokit = github.getOctokit(token);
        const { owner, repo } = github.context.repo;
        const body = renderComment(result.findings, result.durationMs);
        await upsertComment(octokit, owner, repo, pr.number, body);
    }
    else {
        core.warning("CodeMoat: no github-token available, skipping PR comment.");
    }
    const apiKey = core.getInput("api-key");
    if (apiKey) {
        const { owner, repo } = github.context.repo;
        await reportScan(result, {
            apiKey,
            apiUrl: core.getInput("api-url") || undefined,
            repoFullName: `${owner}/${repo}`,
            commitSha: pr.head.sha,
            branch: pr.head.ref,
            prNumber: pr.number,
        });
    }
    if (failOnSeverity !== "none") {
        const threshold = SEVERITY_RANK[failOnSeverity];
        if (threshold !== undefined) {
            const shouldFail = result.findings.some((f) => SEVERITY_RANK[f.severity] <= threshold);
            if (shouldFail) {
                core.setFailed(`CodeMoat: found findings at or above severity "${failOnSeverity}".`);
            }
        }
    }
}
main().catch((err) => {
    core.setFailed(err instanceof Error ? err.message : String(err));
});
//# sourceMappingURL=index.js.map