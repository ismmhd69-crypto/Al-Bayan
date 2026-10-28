import type { MetadataRoute } from "next";
import { getSiteUrl, LAUNCH_LOCALES, buildLanguageAlternates } from "@/lib/seo";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import { steps } from "@/data/steps";
import { learningLessons } from "@/lib/learning/course";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const staticPaths = [
    "",
    "/ask",
    "/topics",
    "/start",
    "/about",
    "/support",
    "/privacy",
  ];

  const topicPaths = Object.keys(TOPIC_ANSWERS).map((id) => `/topics/${id}`);
  const answerPaths = steps
    .filter((s) => Boolean(s.answerId))
    .map((s) => `/answers/${s.answerId}`);
  const lessonPaths = learningLessons.map((lesson) => `/start/${lesson.id}`);

  const allPaths = [...staticPaths, ...topicPaths, ...answerPaths, ...lessonPaths];
  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    const alternates = buildLanguageAlternates(path);

    for (const lang of LAUNCH_LOCALES) {
      const url = `${baseUrl}/${lang}${path}`;
      const isHome = path === "";
      const isContent =
        path.startsWith("/topics/") ||
        path.startsWith("/answers/") ||
        path.startsWith("/start/");

      entries.push({
        url,
        changeFrequency: isHome ? "daily" : isContent ? "weekly" : "monthly",
        priority: isHome ? 1.0 : isContent ? 0.8 : 0.6,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  return entries;
}
