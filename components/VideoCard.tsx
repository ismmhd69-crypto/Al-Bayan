"use client";

import { useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import type { VideoSuggestion } from "@/lib/sources/youtube-rules";

export type VideoLabels = {
  play: string;
  minutes: string;
  privacy: string;
  youtube: string;
  channels: Record<string, string>;
};

// One video from an approved channel. Privacy: nothing loads from YouTube until the visitor
// presses play (no thumbnail, no player); then the privacy-enhanced player (youtube-nocookie.com).
export default function VideoCard({ v, labels }: { v: VideoSuggestion; labels: VideoLabels }) {
  const [playing, setPlaying] = useState(false);
  return (
    <li>
      <p className="hadith-meta">
        <span className="hadith-collection">{labels.channels[v.channelId] ?? ""}</span>
        <span>
          {v.minutes} {labels.minutes}
        </span>
      </p>
      <p className="quote-title" lang="ar" dir="rtl" translate="no">
        {v.title}
      </p>
      {playing ? (
        <div className="video-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0`}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <>
          <button type="button" className="video-play" onClick={() => setPlaying(true)}>
            <PlayCircle aria-hidden="true" />
            {labels.play}
          </button>
          <p className="verse-by">{labels.privacy}</p>
        </>
      )}
      <a className="verse-link" href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer">
        {labels.youtube}
        <ExternalLink aria-hidden="true" />
      </a>
    </li>
  );
}
