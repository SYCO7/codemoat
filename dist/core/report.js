import * as core from "@actions/core";
const DEFAULT_API_URL = "https://codemoat.vercel.app";
// Best-effort: reporting to the dashboard must never fail or slow down a
// user's CI beyond the timeout below. Every failure path is a core.warning,
// never a thrown error — callers only invoke this when api-key is set, so a
// dashboard outage can't affect anyone who hasn't opted in.
export async function reportScan(result, ctx) {
    const url = `${ctx.apiUrl || DEFAULT_API_URL}/api/report`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${ctx.apiKey}` },
            body: JSON.stringify({
                repo: ctx.repoFullName,
                commitSha: ctx.commitSha,
                branch: ctx.branch,
                prNumber: ctx.prNumber,
                result,
            }),
            signal: controller.signal,
        });
        if (!res.ok) {
            core.warning(`CodeMoat: dashboard reporting failed (${res.status})`);
        }
    }
    catch (err) {
        core.warning(`CodeMoat: dashboard reporting failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    finally {
        clearTimeout(timer);
    }
}
//# sourceMappingURL=report.js.map