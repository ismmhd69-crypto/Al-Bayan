import { createHmac, randomBytes } from "node:crypto";

/** The secret quota codes are made with. Empty when the server has none, so admission fails closed. */
export const quotaSecret = () => process.env.ASK_QUOTA_SECRET?.trim() || process.env.ASK_FOLLOW_UP_SECRET?.trim() || "";

/** The browser cookie's signing key must be the same on every server instance and after a restart, or a
 * visitor's question count would reset whenever another instance answered (Codex review, 2026-11-12).
 * Random per process only when the server has no secret (local development). */
export function ownerSigningSecret(): string {
  const secret = quotaSecret();
  return secret ? createHmac("sha256", secret).update("bayan-research-owner-v1").digest("base64") : randomBytes(32).toString("base64");
}
