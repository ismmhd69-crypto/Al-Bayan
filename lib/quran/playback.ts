export type AudioPlaybackStatus = "loading" | "playing" | "paused" | "error";

export interface ActivePlayback {
  verseNumber: number;
  status: AudioPlaybackStatus;
}

export interface AudioPlaybackCallbacks {
  onStatusChange: (playback: ActivePlayback | null) => void;
  onError?: (error: unknown) => void;
}

export interface AudioInstance {
  play: () => Promise<void>;
  pause: () => void;
  src: string;
  onplaying: (() => void) | null;
  onwaiting: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
}

export type AudioFactory = (url: string) => AudioInstance;

const defaultAudioFactory: AudioFactory = (url: string) => {
  return new Audio(url) as unknown as AudioInstance;
};

export class AudioPlaybackController {
  private currentSession = 0;
  private activePlayback: ActivePlayback | null = null;
  private currentAudio: AudioInstance | null = null;
  private isReleased = false;
  private audioFactory: AudioFactory;

  constructor(audioFactory: AudioFactory = defaultAudioFactory) {
    this.audioFactory = audioFactory;
  }

  public getSessionId(): number {
    return this.currentSession;
  }

  public getActivePlayback(): ActivePlayback | null {
    return this.activePlayback;
  }

  public toggleVerse(
    verse: { verseNumber: number; audioUrl: string | null },
    callbacks: AudioPlaybackCallbacks
  ): void {
    if (this.isReleased) return;

    if (!verse.audioUrl) {
      // Missing or invalid audio URL: strictly do not attempt playback
      return;
    }

    // If clicking the verse that is already active
    if (this.activePlayback?.verseNumber === verse.verseNumber) {
      if (this.activePlayback.status === "playing") {
        this.currentAudio?.pause();
        this.activePlayback = { verseNumber: verse.verseNumber, status: "paused" };
        callbacks.onStatusChange(this.activePlayback);
        return;
      }

      if (this.activePlayback.status === "paused") {
        this.activePlayback = { verseNumber: verse.verseNumber, status: "loading" };
        callbacks.onStatusChange(this.activePlayback);

        const session = this.currentSession;
        const audio = this.currentAudio;
        if (!audio) return;

        audio
          .play()
          .then(() => {
            if (this.isReleased || this.currentSession !== session) return;
            this.activePlayback = { verseNumber: verse.verseNumber, status: "playing" };
            callbacks.onStatusChange(this.activePlayback);
          })
          .catch((err) => {
            if (this.isReleased || this.currentSession !== session) return;
            callbacks.onError?.(err);
            this.activePlayback = { verseNumber: verse.verseNumber, status: "error" };
            callbacks.onStatusChange(this.activePlayback);
          });
        return;
      }

      if (this.activePlayback.status === "loading") {
        return; // Already loading this verse
      }
      // If status === "error", fall through to retry
    }

    // Starting a new verse (or retrying):
    // Invalidate old callbacks before clearing the old audio source
    this.currentSession++;
    const session = this.currentSession;

    if (this.currentAudio) {
      const oldAudio = this.currentAudio;
      oldAudio.onplaying = null;
      oldAudio.onwaiting = null;
      oldAudio.onended = null;
      oldAudio.onerror = null;
      oldAudio.pause();
      oldAudio.src = "";
      this.currentAudio = null;
    }

    this.activePlayback = { verseNumber: verse.verseNumber, status: "loading" };
    callbacks.onStatusChange(this.activePlayback);

    const audio = this.audioFactory(verse.audioUrl);
    this.currentAudio = audio;

    audio.onplaying = () => {
      if (this.isReleased || this.currentSession !== session) return;
      this.activePlayback = { verseNumber: verse.verseNumber, status: "playing" };
      callbacks.onStatusChange(this.activePlayback);
    };

    audio.onwaiting = () => {
      if (this.isReleased || this.currentSession !== session) return;
      if (this.activePlayback?.verseNumber === verse.verseNumber) {
        this.activePlayback = { verseNumber: verse.verseNumber, status: "loading" };
        callbacks.onStatusChange(this.activePlayback);
      }
    };

    audio.onended = () => {
      if (this.isReleased || this.currentSession !== session) return;
      // Stop at the end of the selected verse (automatic continuation disabled)
      this.activePlayback = null;
      callbacks.onStatusChange(null);
      if (this.currentAudio === audio) {
        this.currentAudio = null;
      }
    };

    audio.onerror = () => {
      if (this.isReleased || this.currentSession !== session) return;
      this.activePlayback = { verseNumber: verse.verseNumber, status: "error" };
      callbacks.onStatusChange(this.activePlayback);
    };

    audio
      .play()
      .then(() => {
        if (this.isReleased || this.currentSession !== session) return;
        this.activePlayback = { verseNumber: verse.verseNumber, status: "playing" };
        callbacks.onStatusChange(this.activePlayback);
      })
      .catch((err) => {
        if (this.isReleased || this.currentSession !== session) return;
        callbacks.onError?.(err);
        this.activePlayback = { verseNumber: verse.verseNumber, status: "error" };
        callbacks.onStatusChange(this.activePlayback);
      });
  }

  public stopAndRelease(): void {
    this.isReleased = true;
    this.currentSession++;

    if (this.currentAudio) {
      const oldAudio = this.currentAudio;
      oldAudio.onplaying = null;
      oldAudio.onwaiting = null;
      oldAudio.onended = null;
      oldAudio.onerror = null;
      oldAudio.pause();
      oldAudio.src = "";
      this.currentAudio = null;
    }
  }
}

