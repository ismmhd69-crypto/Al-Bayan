import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedJobValue = { version: 1; keyId: string; nonce: string; tag: string; ciphertext: string };
const MAX_BYTES = 8 * 1024 * 1024;
const isBase64 = (value: string) => /^[A-Za-z0-9+/]*={0,2}$/.test(value)
  && Buffer.from(value, "base64").toString("base64") === value;

/** A stable operator-provided key is required. Never generate a replacement on worker restart. */
export function researchJobEncryption(keyId: string, base64Key: string) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(keyId) || !isBase64(base64Key)
    || Buffer.from(base64Key, "base64").length !== 32) throw new Error("invalid_job_encryption_key");
  const key = Buffer.from(base64Key, "base64");
  const associatedData = (jobId: string, purpose: string) => {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(jobId) || !/^[a-zA-Z0-9_:-]{1,160}$/.test(purpose)) {
      throw new Error("invalid_job_encryption_scope");
    }
    return Buffer.from(JSON.stringify(["bayan-research", 1, keyId, jobId, purpose]));
  };
  return {
    seal(jobId: string, purpose: string, value: unknown): EncryptedJobValue {
      const plain = JSON.stringify(value);
      if (typeof plain !== "string" || Buffer.byteLength(plain) > MAX_BYTES) throw new Error("invalid_job_value");
      const nonce = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key, nonce);
      cipher.setAAD(associatedData(jobId, purpose));
      const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
      return { version: 1, keyId, nonce: nonce.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
    },
    open(jobId: string, purpose: string, envelope: EncryptedJobValue): unknown {
      if (envelope.version !== 1 || envelope.keyId !== keyId || typeof envelope.ciphertext !== "string"
        || envelope.ciphertext.length > Math.ceil(MAX_BYTES / 3) * 4
        || typeof envelope.nonce !== "string" || envelope.nonce.length !== 16
        || typeof envelope.tag !== "string" || envelope.tag.length !== 24
        || ![envelope.nonce, envelope.tag, envelope.ciphertext].every(v => typeof v === "string" && isBase64(v))
        || Buffer.from(envelope.nonce, "base64").length !== 12 || Buffer.from(envelope.tag, "base64").length !== 16) {
        throw new Error("invalid_job_envelope");
      }
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.nonce, "base64"));
      decipher.setAAD(associatedData(jobId, purpose));
      decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]).toString("utf8"));
    },
  };
}
