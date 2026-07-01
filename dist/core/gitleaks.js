import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { run } from "./exec.js";
export function normalizeGitleaksFinding(f) {
    return {
        file: f.File,
        line: f.StartLine,
        endLine: f.EndLine,
        severity: "critical",
        cwe: "CWE-798",
        ruleId: f.RuleID,
        description: f.Description,
        source: "gitleaks",
    };
}
export async function runGitleaks(opts) {
    const reportPath = join(tmpdir(), `codemoat-gitleaks-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    const args = ["detect", "-s", ".", "-f", "json", "-r", reportPath, "--exit-code", "0"];
    if (opts.noGit)
        args.push("--no-git");
    if (opts.logOpts)
        args.push(`--log-opts=${opts.logOpts}`);
    try {
        await run("gitleaks", args, { cwd: opts.cwd, acceptExitCodes: [0] });
        const raw = await readFile(reportPath, "utf-8").catch(() => "[]");
        const parsed = raw.trim() ? JSON.parse(raw) : [];
        return parsed.map(normalizeGitleaksFinding);
    }
    finally {
        await unlink(reportPath).catch(() => { });
    }
}
//# sourceMappingURL=gitleaks.js.map