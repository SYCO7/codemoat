// Ported from src/action/index.ts — keep in sync by hand (see lib/types.ts note).
import type { Severity } from "./types";

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

export const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: "\u{1F534}",
  high: "\u{1F7E0}",
  medium: "\u{1F7E1}",
  low: "\u{1F535}",
  info: "\u{26AA}",
};

export function cweUrl(cwe: string): string | null {
  const match = cwe.match(/CWE-(\d+)/);
  return match ? `https://cwe.mitre.org/data/definitions/${match[1]}.html` : null;
}
