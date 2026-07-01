"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionList, MotionItem } from "@/components/motion-list";

interface GithubRepoOption {
  githubRepoId: number;
  fullName: string;
  owner: string;
  isPrivate: boolean;
}

interface AutoSetupResult {
  secretCreated: boolean;
  workflowCreated: boolean;
  workflowAlreadyExisted: boolean;
  warning?: string;
}

interface ConnectResult {
  repoId: string;
  apiKey: string;
  fullName: string;
  autoSetup: AutoSetupResult | null;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export function ConnectPageClient({ orgPlan }: { orgPlan: string }) {
  const [repos, setRepos] = useState<GithubRepoOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [connected, setConnected] = useState<ConnectResult | null>(null);
  const reduceMotion = useReducedMotion();
  const canConnectPrivate = orgPlan === "paid";

  useEffect(() => {
    fetch("/api/github/repos")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? body.error ?? "failed to load repos");
        setRepos(body.repos);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  async function connect(repo: GithubRepoOption) {
    setConnecting(repo.githubRepoId);
    setError(null);
    try {
      const res = await fetch("/api/repos/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          githubRepoId: repo.githubRepoId,
          fullName: repo.fullName,
          owner: repo.owner,
          isPrivate: repo.isPrivate,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? body.error ?? "failed to connect");
      setConnected({
        repoId: body.repoId,
        apiKey: body.apiKey,
        fullName: repo.fullName,
        autoSetup: body.autoSetup ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(null);
    }
  }

  if (connected) {
    const workflowYaml = `- uses: actions/checkout@v7
  with:
    fetch-depth: 0
- uses: SYCO7/codemoat@v1
  with:
    api-key: \${{ secrets.CODEMOAT_API_KEY }}`;

    const fullyAutomatic =
      connected.autoSetup?.secretCreated &&
      (connected.autoSetup?.workflowCreated || connected.autoSetup?.workflowAlreadyExisted);

    return (
      <MotionList className="space-y-6">
        <MotionItem>
          <h1 className="text-2xl font-semibold tracking-tight">{connected.fullName} connected</h1>
        </MotionItem>

        {fullyAutomatic ? (
          <MotionItem>
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="text-base">Set up automatically</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  CodeMoat added the <code className="rounded bg-muted px-1.5 py-0.5">CODEMOAT_API_KEY</code>{" "}
                  repo secret and{" "}
                  {connected.autoSetup?.workflowCreated
                    ? "committed a workflow file"
                    : "found your workflow already wired up"}{" "}
                  — nothing left to do. Open a pull request on{" "}
                  <span className="text-foreground">{connected.fullName}</span> and CodeMoat scans it.
                </p>
              </CardContent>
            </Card>
          </MotionItem>
        ) : (
          <MotionItem>
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-base">Couldn&apos;t finish automatic setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Auto-wiring the repo secret/workflow failed
                  {connected.autoSetup?.warning ? ` (${connected.autoSetup.warning})` : ""} — finish it
                  manually with the steps below.
                </p>
              </CardContent>
            </Card>
          </MotionItem>
        )}

        <MotionItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your API key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Shown once — save a copy. If lost, reconnect the repo to generate a new one (this also
                re-runs the automatic setup above).
              </p>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm">{connected.apiKey}</pre>
            </CardContent>
          </Card>
        </MotionItem>

        {!fullyAutomatic && (
          <>
            <MotionItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Manual step 1: add the repo secret</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    GitHub repo → Settings → Secrets and variables → Actions → New repository secret →
                    name it <code className="rounded bg-muted px-1.5 py-0.5">CODEMOAT_API_KEY</code>, paste the key above.
                  </p>
                </CardContent>
              </Card>
            </MotionItem>
            <MotionItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Manual step 2: add the workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm">{workflowYaml}</pre>
                </CardContent>
              </Card>
            </MotionItem>
          </>
        )}

        <MotionItem>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Back to dashboard
          </Link>
        </MotionItem>
      </MotionList>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Connect a repo</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!repos && !error && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[60px] animate-pulse rounded-md border border-border bg-muted/30" />
          ))}
        </div>
      )}
      {repos && repos.length === 0 && (
        <p className="text-sm text-muted-foreground">No repos found on your GitHub account.</p>
      )}
      <MotionList className="space-y-2">
        <AnimatePresence>
          {repos?.map((repo) => {
            const locked = repo.isPrivate && !canConnectPrivate;
            return (
              <MotionItem key={repo.githubRepoId}>
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  transition={{ duration: 0.15, ease: easeOut }}
                  className="flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{repo.fullName}</span>
                    {repo.isPrivate && (
                      <Badge variant="outline">{locked ? "Private — needs Pro" : "Private"}</Badge>
                    )}
                  </div>
                  <motion.button
                    onClick={() => connect(repo)}
                    disabled={connecting === repo.githubRepoId || locked}
                    whileTap={reduceMotion || locked ? undefined : { scale: 0.96 }}
                    title={locked ? "Private repos need the Pro plan — upgrade in Settings" : undefined}
                    className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {connecting === repo.githubRepoId ? "Connecting…" : "Connect"}
                  </motion.button>
                </motion.div>
              </MotionItem>
            );
          })}
        </AnimatePresence>
      </MotionList>
    </div>
  );
}
