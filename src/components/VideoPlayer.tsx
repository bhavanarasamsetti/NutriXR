import type { YogaClip } from "../data/yogaClips";

type VideoPlayerProps = {
  clip: YogaClip;
  onBack: () => void;
  onNext: () => void;
};

export default function VideoPlayer({ clip, onBack, onNext }: VideoPlayerProps) {
  return (
    <div className="yoga-player">
      <header className="yoga-player-header">
        <button className="yoga-back" type="button" onClick={onBack}>
          Back to Yoga Hub
        </button>
        <div className="yoga-player-title">
          <h2>{clip.title}</h2>
          <p>
            Goal: {clip.goal} | Duration: {clip.duration} | Level: {clip.level}
          </p>
        </div>
      </header>
      <div className="yoga-video-shell">
        <video
          key={clip.videoSrc}
          src={clip.videoSrc}
          controls
          playsInline
          preload="metadata"
        />
      </div>
      <div className="yoga-player-actions">
        <button className="yoga-secondary" type="button" onClick={onNext}>
          Next clip
        </button>
      </div>
    </div>
  );
}
