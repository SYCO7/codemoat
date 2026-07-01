"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck, Zap, MessageSquareText, ArrowRight } from "lucide-react";
import { ScanGraphic } from "@/components/marketing/scan-graphic";
import { CountUp } from "@/components/marketing/count-up";
import { Reveal } from "@/components/marketing/reveal";
import { GitHubIcon } from "@/components/github-icon";

const RULES = [
  { title: "Wildcard CORS + credentials", desc: "an agent “fixes” a blocked frontend request by opening CORS to everyone.", cwe: "CWE-942" },
  { title: "Auth middleware commented out", desc: "disabled “temporarily” while debugging a route, never restored.", cwe: "CWE-306" },
  { title: "Debug routes left reachable", desc: "a scaffolded /debug endpoint with no environment guard.", cwe: "CWE-489" },
  { title: "Framework debug mode in prod", desc: "Flask/Django debug flags left on.", cwe: "CWE-489" },
  { title: "Weak seed credentials", desc: "“admin123” hardcoded in scaffolded setup code.", cwe: "CWE-259" },
  { title: "JWT verification bypass", desc: "algorithms: [\"none\"] accepts unsigned tokens.", cwe: "CWE-347" },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

export function MarketingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden">
      <div className="ambient-glow" aria-hidden="true">
        <span className="blob-a" />
        <span className="blob-b" />
      </div>

      <header className="relative z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
          <div className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
            CodeMoat
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/SYCO07/codemoat"
              target="_blank"
              rel="noopener"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <GitHubIcon className="h-4 w-4" /> GitHub
            </a>
            <Link
              href="/login"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              Sign in
            </Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-24 pt-8 md:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOut }}
          >
            <span className="mb-6 inline-block rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground/90" style={{ color: "var(--primary)" }}>
              Free for public repos
            </span>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Your AI coding agent ships fast.
              <br />
              It also ships vulnerabilities.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              CodeMoat scans every pull request for the security issues AI coding assistants
              actually introduce — before they merge.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-shadow duration-200 hover:shadow-[0_8px_30px_-6px_rgba(167,139,250,0.55)]"
              >
                Add to a repo — free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#install"
                className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-primary/50"
              >
                See install steps
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free forever for public repos. No signup required to try the Action.</p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
          >
            <ScanGraphic />
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="border-t border-border py-20">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-semibold tracking-tight">
              This isn&apos;t a hypothetical problem
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { n: 45, suffix: "%", body: "of tests across 100+ LLMs produced AI-generated code with an OWASP Top 10 flaw.", src: "Veracode, 2025 GenAI Code Security Report", href: "https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/" },
              { n: 40, prefix: "~", suffix: "%", body: "of 1,692 Copilot-generated programs across 89 scenarios contained an exploitable bug or design flaw.", src: "NYU Tandon, “Asleep at the Keyboard?”", href: "https://cyber.nyu.edu/2021/10/15/ccs-researchers-find-github-copilot-generates-vulnerable-code-40-of-the-time/" },
              { n: 29.5, suffix: "%", body: "of real-world Copilot-generated Python snippets in GitHub projects had a security weakness.", src: "“Security Weaknesses of Copilot-Generated Code,” 2025", href: "https://arxiv.org/abs/2310.02059" },
            ].map((s, i) => (
              <Reveal key={s.src} delay={i * 0.08}>
                <div className="h-full rounded-lg border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_40px_-20px_rgba(124,95,208,0.5)]">
                  <div className="font-heading text-4xl font-bold text-primary [text-shadow:0_0_24px_rgba(167,139,250,0.35)]">
                    <CountUp to={s.n} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{s.body}</p>
                  <a href={s.href} target="_blank" rel="noopener" className="mt-4 inline-block text-xs text-primary hover:underline">
                    {s.src} &rarr;
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-20">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-semibold tracking-tight">How it works</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { icon: Zap, title: "Open a PR", body: "CodeMoat runs automatically on pull_request and scopes every scan to just the changed lines — not the whole repo." },
              { icon: ShieldCheck, title: "Three engines, one pass", body: "Semgrep for pattern-based SAST, Gitleaks for secrets, and CodeMoat's own 12-rule pack for AI-agent-specific footguns." },
              { icon: MessageSquareText, title: "One clean PR comment", body: "Severity, file, line, CWE reference, and a suggested fix — in a single comment that updates in place. No spam." },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="h-full rounded-lg border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                    <s.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="mb-2 font-heading text-base font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-20">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-semibold tracking-tight">What generic scanners miss</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              CodeMoat&apos;s AI ruleset targets the specific ways coding agents fail — not textbook injection
              flaws, but the shortcuts an agent takes to get a feature working.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-3">
            {RULES.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.04}>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-primary/30">
                  <div>
                    <span className="font-medium">{r.title}</span>
                    <span className="text-muted-foreground"> — {r.desc}</span>
                  </div>
                  <span className="ml-4 shrink-0 rounded-full border border-primary/30 px-2.5 py-1 text-xs text-primary">
                    {r.cwe}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="install" className="border-t border-border py-20">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-semibold tracking-tight">Install</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-6 text-center text-muted-foreground">Add a workflow file to your repo:</p>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-card p-6 text-sm">
{`# .github/workflows/codemoat.yml
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
      - uses: SYCO07/codemoat@v1`}
            </pre>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-center text-muted-foreground">Or run it locally before you push, no CI required:</p>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-card p-6 text-sm">npx codemoat scan</pre>
          </Reveal>
        </section>

        <section className="border-t border-border py-20">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-semibold tracking-tight">Free vs. paid</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-4"></th>
                    <th className="px-5 py-4">Free</th>
                    <th className="px-5 py-4">
                      Paid <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">coming soon</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border">
                    <td className="px-5 py-4">Public repos</td>
                    <td className="px-5 py-4">Unlimited scans</td>
                    <td className="px-5 py-4 text-muted-foreground">—</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4">Private repos</td>
                    <td className="px-5 py-4 text-muted-foreground">—</td>
                    <td className="px-5 py-4 text-primary">Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Private-repo support is on the roadmap.{" "}
              <a href="https://github.com/SYCO07/codemoat" target="_blank" rel="noopener" className="text-primary hover:underline">
                Watch the repo
              </a>{" "}
              to get notified.
            </p>
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-10 text-center text-sm text-muted-foreground">
        <p>
          CodeMoat is MIT-licensed and built on{" "}
          <a href="https://semgrep.dev" target="_blank" rel="noopener" className="text-primary hover:underline">Semgrep</a>{" "}
          and{" "}
          <a href="https://github.com/gitleaks/gitleaks" target="_blank" rel="noopener" className="text-primary hover:underline">Gitleaks</a>.
        </p>
        <a href="https://github.com/SYCO07/codemoat" target="_blank" rel="noopener" className="mt-2 inline-block text-primary hover:underline">
          github.com/SYCO07/codemoat
        </a>
      </footer>
    </div>
  );
}
