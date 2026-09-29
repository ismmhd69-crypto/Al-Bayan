import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-only: stores Mo's review decision in the prepared answer file. Never available on the live site.
const devOnly = () => process.env.NODE_ENV !== "production";
const FOLDERS = { topic: "data/topic-answers" } as const;

export async function POST(request: Request) {
  if (!devOnly()) return NextResponse.json({ status: "not_found" }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { kind?: unknown; id?: unknown; status?: unknown; note?: unknown } | null;
  const kind = body?.kind === "topic" ? "topic" : null;
  const id = typeof body?.id === "string" && /^[a-z0-9-]{1,60}$/.test(body.id) ? body.id : null;
  const status = body?.status === "approved" || body?.status === "rejected" || body?.status === "draft" ? body.status : null;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (!kind || !id || !status) return NextResponse.json({ status: "bad_request" }, { status: 400 });
  const file = path.join(process.cwd(), FOLDERS[kind], `${id}.json`);
  try {
    const data = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
    data.status = status;
    data.reviewed_at = new Date().toISOString();
    if (note) data.review_note = note;
    await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
