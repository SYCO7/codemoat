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

interface ConnectResult {
  repoId: string;
  apiKey: string;
  fullName: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function ConnectPage() {
  const [repos, setRepos] = useState<GithubRepoOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [connected, setConnected] = useState<ConnectResult | null>(null);
  const reduceMotion = useReducedMotion();

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
      setConnected({ repoId: body.repoId, apiKey: body.apiKey, fullName: repo.fullName });
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

    return (
      <MotionList className="space-y-6">
        <MotionItem>
          <h1 className="text-2xl font-semibold tracking-tight">{connected.fullName} connected</h1>
        </MotionItem>
        <MotionItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Copy your API key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Shown once — store it now. If lost, reconnect the repo to generate a new one.
              </p>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm">{connected.apiKey}</pre>
            </CardContent>
          </Card>
        </MotionItem>
        <MotionItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Add it as a repo secret</CardTitle>
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
              <CardTitle className="text-base">3. Reference it in your workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm">{workflowYaml}</pre>
            </CardContent>
          </Card>
        </MotionItem>
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
          {repos?.map((repo) => (
            <MotionItem key={repo.githubRepoId}>
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                transition={{ duration: 0.15, ease: easeOut }}
                className="flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{repo.fullName}</span>
                  {repo.isPrivate && <Badge variant="outline">Private — paid only</Badge>}
                </div>
                <motion.button
                  onClick={() => connect(repo)}
                  disabled={connecting === repo.githubRepoId || repo.isPrivate}
                  whileTap={reduceMotion || repo.isPrivate ? undefined : { scale: 0.96 }}
                  title={repo.isPrivate ? "Private repos need a paid plan — coming soon" : undefined}
                  className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {connecting === repo.githubRepoId ? "Connecting…" : "Connect"}
                </motion.button>
              </motion.div>
            </MotionItem>
          ))}
        </AnimatePresence>
      </MotionList>
    </div>
  );
}
