"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { GitHubIcon } from "@/components/github-icon";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: "repo read:user",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="ambient-glow" aria-hidden="true">
        <span className="blob-a" />
        <span className="blob-b" />
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-2 font-heading text-lg font-semibold tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          CodeMoat
        </div>

        <h1 className="mb-2 font-heading text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Connect with GitHub to see scan history across your repos.
        </p>

        <motion.button
          onClick={signIn}
          disabled={loading}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_0_0_rgba(167,139,250,0)] transition-shadow duration-200 hover:shadow-[0_8px_30px_-6px_rgba(167,139,250,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GitHubIcon className="h-[18px] w-[18px]" />
          {loading ? "Redirecting…" : "Sign in with GitHub"}
        </motion.button>

        {error && (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          Signing in only creates an account for the dashboard — your Action keeps
          working without one.
        </p>
      </motion.div>
    </div>
  );
}
