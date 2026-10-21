import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const RESEARCH_COOKIE = "bayan_research_v1";
export function researchOwners(base64Secret: string) {
  const secret = Buffer.from(base64Secret, "base64");
  if (secret.length !== 32 || secret.toString("base64") !== base64Secret)
    throw new Error("research_owner_secret_required");
  const hash = (purpose: string, value: string) =>
    createHmac("sha256", secret)
      .update(JSON.stringify([purpose, value]))
      .digest("hex");
  const validCookie = (value: string | undefined) => {
    if (!value || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(value)) return false;
    return timingSafeEqual(
      Buffer.from(value.slice(65), "hex"),
      Buffer.from(hash("cookie", value.slice(0, 64)), "hex"),
    );
  };
  return {
    mint() {
      const token = randomBytes(32).toString("hex");
      return `${token}.${hash("cookie", token)}`;
    },
    anonymous(cookie: string | undefined) {
      return validCookie(cookie)
        ? hash("anonymous", cookie!.slice(0, 64))
        : null;
    },
    user(id: string) {
      if (!id || id.length > 128) throw new Error("invalid_research_user");
      return hash("user", id);
    },
    scope(owner: string) {
      return hash("browser-scope", owner).slice(0, 32);
    },
    rate(forwarded: string | null) {
      return hash("rate", forwarded?.split(",")[0]?.trim() || "local");
    },
    dedupe(owner: string, key: string) {
      return hash("submission", JSON.stringify([owner, key]));
    },
    request(value: unknown) {
      return hash("request", JSON.stringify(value));
    },
  };
}
