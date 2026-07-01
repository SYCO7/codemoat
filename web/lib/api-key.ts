import { randomBytes, createHash } from "node:crypto";

const KEY_PREFIX = "cm_live_";

// 192 bits of entropy — same order of magnitude as a GitHub PAT / Stripe API
// key, high enough that hashing (not a slow KDF like bcrypt) is appropriate.
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = KEY_PREFIX + randomBytes(24).toString("base64url");
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 12);
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
