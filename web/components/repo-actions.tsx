"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";

export function RepoActions({ repoId, fullName }: { repoId: string; fullName: string }) {
  const router = useRouter();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<"regen" | "delete" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setBusy("regen");
    setError(null);
    try {
      const res = await fetch(`/api/repos/${repoId}/regenerate-key`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "failed");
      setNewKey(body.apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/repos/${repoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to disconnect");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {newKey ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            New key generated — the old one stopped working immediately. Shown once:
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm">{newKey}</pre>
        </div>
      ) : (
        <button
          onClick={regenerate}
          disabled={busy !== null}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${busy === "regen" ? "animate-spin" : ""}`} />
          Regenerate API key
        </button>
      )}

      {confirmingDelete ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <span className="text-sm">Disconnect {fullName}? This deletes its scan history too.</span>
          <button
            onClick={disconnect}
            disabled={busy !== null}
            className="ml-auto cursor-pointer rounded-md bg-destructive px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === "delete" ? "Disconnecting…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirmingDelete(false)}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-destructive transition-colors hover:border-destructive/50"
        >
          <Trash2 className="h-4 w-4" />
          Disconnect repo
        </button>
      )}
    </div>
  );
}
