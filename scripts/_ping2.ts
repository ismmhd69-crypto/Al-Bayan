import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  for (const model of ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Say ok" }] }] }),
    });
    const body = await res.text();
    const msg = (() => { try { return JSON.parse(body).error?.message ?? "ok"; } catch { return body.slice(0, 120); } })();
    console.log(model, res.status, msg.slice(0, 260).replace(/\s+/g, " "));
  }
}
main();
