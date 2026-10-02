// Approved YouTube channels (Mo's decision, 2026-09-28: "Level 1 + Level 2").
// Videos may only come from these channels, and each video must still be approved before it shows.
// Level 1: confirmed by the scholar's own official website. Level 2: official institution by its own
// description, not (yet) confirmed by a website link. Research notes in HANDOFF.md.

export type ApprovedChannel = {
  channelId: string; // YouTube channel id (stable, unlike handles)
  handle: string;
  name: string;
  scholarId: string; // public.scholars id
  level: 1 | 2;
  evidence: string;
};

export const APPROVED_CHANNELS: ApprovedChannel[] = [
  {
    channelId: "UCiiJRwQ0MUaQo8ZZuf18pPw",
    handle: "@al.shikh.ibnbaz",
    name: "القناة الرسمية لموقع سماحة الشيخ عبدالعزيز بن باز",
    scholarId: "ibn-baz",
    level: 1,
    evidence: "binbaz.org.sa embeds this channel's videos (checked 2026-09-28)",
  },
  {
    channelId: "UCwMocSKEbLav6SZvwzTvDbQ",
    handle: "@alalbanyportal",
    name: "بوابة تراث الإمام الألباني",
    scholarId: "al-albani",
    level: 1,
    evidence: "al-albany.com embeds this channel's videos (checked 2026-09-28)",
  },
  {
    channelId: "UCtF3YygTiodnYSw8vD3UJtQ",
    handle: "@ibnothaimeentv",
    name: "قناة الشيخ محمد ابن عثيمين الرسمية",
    scholarId: "ibn-uthaymeen",
    level: 2,
    evidence: "describes itself as the channel of the Shaykh's foundation (satellite channel since 1429H); no link from binothaimeen.net found",
  },
  {
    channelId: "UCYZkmbBbVMWxB1gyioTPLIA",
    handle: "@binbaz1425",
    name: "قناة مؤسسة عبد العزيز بن باز الخيرية الرسمية",
    scholarId: "ibn-baz",
    level: 2,
    evidence: "describes itself as the official channel of the Abdul-Aziz ibn Baz Charitable Foundation; no link from binbaz.org.sa found",
  },
];

export const approvedChannelIds = new Set(APPROVED_CHANNELS.map((c) => c.channelId));
