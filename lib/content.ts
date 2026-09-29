import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import { approvedChannelIds } from "@/lib/sources/youtube-channels";
import type { VideoSuggestion } from "@/lib/sources/youtube-rules";

// Reads published content with the public key. Row-level security only lets it see
// published rows, and it can never write.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export type CategoryId = "belief" | "science" | "preservation" | "women" | "history";
export const categoryOrder: CategoryId[] = ["belief", "science", "preservation", "women", "history"];

export type TopicSummary = { id: string; category: CategoryId; title: string; question: string };
export type Topic = TopicSummary & {
  status: "preparing" | "automatic" | "scholar_reviewed";
  related: { id: string; title: string }[];
};

type TopicRow = {
  id: string;
  category: CategoryId;
  popular_rank: number | null;
  topic_texts: { title: string; question: string; answer_status: Topic["status"] }[];
};

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Could not load ${what} from the database: ${error?.message ?? "no data"}`);
}

async function loadTopics(lang: Locale): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("id, category, popular_rank, topic_texts!inner(title, question, answer_status)")
    .eq("topic_texts.lang", lang)
    .order("sort");
  if (error || !data) fail("topics", error);
  return data as TopicRow[];
}

const summary = (r: TopicRow): TopicSummary => ({
  id: r.id,
  category: r.category,
  title: r.topic_texts[0].title,
  question: r.topic_texts[0].question,
});

export async function getTopics(lang: Locale): Promise<TopicSummary[]> {
  return (await loadTopics(lang)).map(summary);
}

export async function getPopularQuestions(lang: Locale, limit = 4): Promise<string[]> {
  return (await loadTopics(lang))
    .filter((r) => r.popular_rank !== null)
    .sort((a, b) => a.popular_rank! - b.popular_rank!)
    .slice(0, limit)
    .map((r) => r.topic_texts[0].question);
}

export async function getTopicIds(): Promise<string[]> {
  const { data, error } = await supabase.from("topics").select("id");
  if (error || !data) fail("topic ids", error);
  return data.map((r) => r.id as string);
}

export async function getTopic(id: string, lang: Locale): Promise<Topic | null> {
  const rows = await loadTopics(lang);
  const row = rows.find((r) => r.id === id);
  if (!row) return null;

  const { data: rel, error } = await supabase
    .from("topic_related")
    .select("related_id")
    .eq("topic_id", id)
    .order("sort");
  if (error || !rel) fail("related topics", error);

  const byId = new Map(rows.map((r) => [r.id, r]));
  return {
    ...summary(row),
    status: row.topic_texts[0].answer_status,
    related: rel.flatMap(({ related_id }) => {
      const r = byId.get(related_id as string);
      return r ? [{ id: r.id, title: r.topic_texts[0].title }] : [];
    }),
  };
}

type TopicVideoRow = {
  sort: number;
  videos: {
    youtube_id: string;
    channel_id: string | null;
    title: string;
    duration_seconds: number | null;
    language: string | null;
  } | null;
};

/** Videos linked to a topic (scripts/link-topic-videos.ts). Row-level security only returns approved videos. */
export async function getTopicVideos(topicId: string): Promise<VideoSuggestion[]> {
  const { data, error } = await supabase
    .from("topic_videos")
    .select("sort, videos(youtube_id, channel_id, title, duration_seconds, language)")
    .eq("topic_id", topicId)
    .order("sort");
  if (error) fail("topic videos", error);
  return ((data as unknown as TopicVideoRow[]) ?? [])
    .map((r) => r.videos)
    .filter((v): v is NonNullable<TopicVideoRow["videos"]> => !!v && !!v.channel_id && approvedChannelIds.has(v.channel_id))
    .map((v) => ({
      youtubeId: v.youtube_id,
      channelId: v.channel_id!,
      title: v.title,
      minutes: Math.max(1, Math.round((v.duration_seconds ?? 60) / 60)),
      language: v.language === "en" || v.language === "de" ? v.language : "ar",
    }));
}

/** Approved scholars' names in the three languages, by id (public table). */
export async function getScholarNames(): Promise<Record<string, { ar: string; en: string; de: string }>> {
  const { data, error } = await supabase.from("scholars").select("id, name_ar, name_en, name_de").eq("approved", true);
  if (error) fail("scholars", error);
  return Object.fromEntries(((data ?? []) as { id: string; name_ar: string; name_en: string; name_de: string }[])
    .map((s) => [s.id, { ar: s.name_ar, en: s.name_en, de: s.name_de }]));
}
