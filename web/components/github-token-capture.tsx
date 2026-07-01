"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Mounted once in the dashboard layout. provider_token is only ever present
// on the auth event fired right after an OAuth redirect completes — capture
// and hand it to the server immediately, never store it client-side.
export function GithubTokenCapture() {
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.provider_token) {
        fetch("/api/auth/github-token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ providerToken: session.provider_token }),
        }).catch(() => {
          // best-effort — Stage B's connect-a-repo flow will prompt a
          // re-login if this never landed
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
