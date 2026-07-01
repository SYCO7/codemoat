# CodeMoat

Security scanner for AI-generated code. CodeMoat scans your pull request diffs
for the vulnerability classes AI coding assistants (Claude Code, Cursor,
Copilot, and friends) actually introduce — hardcoded secrets, injection
flaws, insecure deserialization, and a set of AI-agent-specific footguns like
wildcard CORS, disabled auth middleware, and forgotten debug routes — and
posts a single, updating PR comment with severity, CWE reference, and a
suggested fix.

CodeMoat doesn't reinvent static analysis. It wraps two established
open-source engines and adds one thing they don't have:

- **[Semgrep](https://semgrep.dev)** — pattern-based SAST, using real
  registry rulesets (`p/security-audit`, `p/owasp-top-ten`, `p/secrets`).
- **[Gitleaks](https://github.com/gitleaks/gitleaks)** — secret detection.
- **CodeMoat AI ruleset** — 12 Semgrep rules targeting failure patterns
  specific to AI-agent-written code (see [below](#the-ai-ruleset)).

Every finding ships a real CWE ID, cross-linked to
[cwe.mitre.org](https://cwe.mitre.org).

## Why

Published, independent research consistently finds AI-generated code
introduces vulnerabilities at a high rate:

- Veracode's [2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
  found AI-generated code introduced OWASP Top 10 security flaws in **45%**
  of tests across 100+ LLMs.
- NYU Tandon's ["Asleep at the Keyboard?"](https://cyber.nyu.edu/2021/10/15/ccs-researchers-find-github-copilot-generates-vulnerable-code-40-of-the-time/)
  study found **~40%** of 1,692 GitHub Copilot-generated programs across 89
  scenarios contained exploitable bugs or design flaws.
- A 2025 empirical study of real Copilot-generated code in GitHub projects
  ([arXiv:2310.02059](https://arxiv.org/abs/2310.02059)) found security
  weaknesses in **29.5%** of Python and **24.2%** of JavaScript snippets.

Generic SAST tools catch some of this, but miss the patterns that are
specific to how coding agents fail — a CORS wildcard added to unblock a
frontend, an auth check commented out "temporarily" while debugging, a
`/debug` route scaffolded and never removed. CodeMoat's AI ruleset targets
exactly that gap.

## Install (GitHub Action)

Add a workflow that runs on pull requests:

```yaml
# .github/workflows/codemoat.yml
name: CodeMoat

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: SYCO7/codemoat@v1
        with:
          fail-on-severity: high # critical | high | medium | low | none
```

> `fetch-depth: 0` is required so CodeMoat can diff against the PR's base
> commit — a shallow checkout won't have it.

Replace `SYCO7/codemoat` with wherever you publish this repo; see
[Publishing](#publishing) below.

### Action inputs

| Input | Default | Description |
|---|---|---|
| `github-token` | `${{ github.token }}` | Token used to read PR file lists and post/update the results comment. |
| `fail-on-severity` | `none` | Minimum severity that fails the check: `critical`, `high`, `medium`, `low`, or `none`. |
| `semgrep-configs` | *(empty)* | Comma-separated extra Semgrep registry configs to run in addition to the defaults. |

### Action outputs

| Output | Description |
|---|---|
| `findings-count` | Total number of findings reported. |
| `critical-count` | Number of critical-severity findings. |

## Install (CLI)

Run CodeMoat locally before you push — no GitHub Action required:

```bash
npx codemoat scan
```

By default this scans your uncommitted + untracked changes. Useful flags:

```
codemoat scan [options]

  --base <ref>       Diff against this git ref (e.g. origin/main).
  --path <dir>       Repo directory to scan. Default: current directory.
  --fail-on <sev>    Exit non-zero at or above this severity: critical|high|medium|low|none. Default: high.
  --all               Scan every tracked file instead of just the diff.
```

Requires [`semgrep`](https://semgrep.dev/docs/getting-started/) and
[`gitleaks`](https://github.com/gitleaks/gitleaks#installing) on your `PATH`.

### Example output

```
Scanning 2 file(s) against base 4c1a9f2e...

CRITICAL  src/routes/upload.py:41  [codemoat-path-traversal-unsanitized] (CWE-22)
  A filesystem path is built by joining a directory with a raw request-supplied
  value. Without sanitizing the segment and verifying the resolved path stays
  inside the intended directory, an attacker can supply "../" sequences to read
  or write files outside the intended folder.

HIGH  src/middleware/cors.ts:12  [codemoat-cors-wildcard-credentials] (CWE-942)
  CORS is configured with a wildcard origin ("*") combined with credentials: true.

2 issue(s) found.
```

## The AI ruleset

Twelve Semgrep rules, each with a real CWE, each verified against a
hand-written vulnerable sample (true positive) and a fixed counterpart
(no false positive) — see `samples/vulnerable/` and `samples/safe/`.

| Rule | CWE |
|---|---|
| `codemoat-cors-wildcard-credentials` | [CWE-942](https://cwe.mitre.org/data/definitions/942.html) |
| `codemoat-debug-route-no-guard` | [CWE-489](https://cwe.mitre.org/data/definitions/489.html) |
| `codemoat-commented-auth-middleware` | [CWE-306](https://cwe.mitre.org/data/definitions/306.html) |
| `codemoat-flask-debug-mode-enabled` | [CWE-489](https://cwe.mitre.org/data/definitions/489.html) |
| `codemoat-django-debug-true` | [CWE-489](https://cwe.mitre.org/data/definitions/489.html) |
| `codemoat-weak-hardcoded-credential` | [CWE-259](https://cwe.mitre.org/data/definitions/259.html) |
| `codemoat-jwt-algorithms-none` | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| `codemoat-eval-request-input` | [CWE-95](https://cwe.mitre.org/data/definitions/95.html) |
| `codemoat-path-traversal-unsanitized` | [CWE-22](https://cwe.mitre.org/data/definitions/22.html) |
| `codemoat-insecure-pickle-deserialize` | [CWE-502](https://cwe.mitre.org/data/definitions/502.html) |
| `codemoat-insecure-yaml-load` | [CWE-502](https://cwe.mitre.org/data/definitions/502.html) |
| `codemoat-ssrf-unvalidated-url` | [CWE-918](https://cwe.mitre.org/data/definitions/918.html) |

## Free vs. paid

| | Free | Paid (coming soon) |
|---|---|---|
| Public repos | Unlimited scans | — |
| Private repos | — | ✅ |

Paid tier is a waitlist stub for now — no billing is wired up yet.

## Development

```bash
npm install
npm run build      # tsc -> dist/
npm test           # unit + integration tests (requires semgrep + gitleaks on PATH)
npm run typecheck
```

Requires Node 20+, [`semgrep`](https://semgrep.dev) and
[`gitleaks`](https://github.com/gitleaks/gitleaks) installed locally to run
the test suite (the integration tests shell out to the real binaries — no
mocks).

## Contributing

Issues and PRs welcome. If you're adding a rule to the AI ruleset, it needs:

1. A real CWE ID (link it, don't guess the number).
2. A vulnerable sample in `samples/vulnerable/` and a safe counterpart in
   `samples/safe/`.
3. A passing run of `semgrep scan --validate --config src/rules/`.

## License

MIT — see [LICENSE](./LICENSE).
