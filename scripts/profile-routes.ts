import { spawn, type ChildProcess } from "node:child_process";

async function waitForServer(url: string, timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function measureRoute(url: string): Promise<{ status: number; durationMs: number }> {
  const start = performance.now();
  const res = await fetch(url);
  const durationMs = Math.round(performance.now() - start);
  return { status: res.status, durationMs };
}

async function run() {
  const port = 3125;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Starting local production server on port ${port}...`);
  const serverProc: ChildProcess = spawn(
    "npx.cmd",
    ["next", "start", "-p", String(port)],
    {
      stdio: "pipe",
      shell: true,
      env: { ...process.env, PORT: String(port) },
    }
  );

  try {
    const ready = await waitForServer(`${baseUrl}/en/quran`);
    if (!ready) throw new Error("Server failed to respond within timeout");

    console.log("Server ready. Measuring representative routes (Production build)...\n");

    const routes = [
      { name: "Quran Index (/en/quran)", path: "/en/quran" },
      { name: "Short Surah (/en/quran/108)", path: "/en/quran/108" },
      { name: "Al-Baqarah (/en/quran/2)", path: "/en/quran/2" },
      { name: "Hadith Index (/en/hadith)", path: "/en/hadith" },
      { name: "Muslim Collection (/en/hadith/muslim)", path: "/en/hadith/muslim" },
      { name: "Bukhari Book 1 (/en/hadith/bukhari/book/1)", path: "/en/hadith/bukhari/book/1" },
      { name: "Bukhari Hadith 1 (/en/hadith/bukhari/1)", path: "/en/hadith/bukhari/1" },
      { name: "Muslim Hadith 8a (/en/hadith/muslim/8a)", path: "/en/hadith/muslim/8a" },
    ];

    console.log("Route | First Visit (ms) | Repeat Visit (ms) | Status");
    console.log("---------------------------------------------------------");

    for (const r of routes) {
      const url = `${baseUrl}${r.path}`;
      // First visit
      const first = await measureRoute(url);
      // Wait slightly
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Repeat visit
      const repeat = await measureRoute(url);

      console.log(`${r.name.padEnd(40)} | ${String(first.durationMs).padStart(16)} | ${String(repeat.durationMs).padStart(17)} | ${first.status}`);
    }
  } finally {
    serverProc.kill();
  }
}

run().catch((err) => {
  console.error("Profiling failed:", err);
  process.exit(1);
});

