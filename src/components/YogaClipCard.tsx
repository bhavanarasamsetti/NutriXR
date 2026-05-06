import type { YogaClip } from "../data/yogaClips";

type YogaClipCardProps = {
  clip: YogaClip;
  onPlay: (clip: YogaClip) => void;
  ctaLabel: string;
};

export default function YogaClipCard({ clip, onPlay, ctaLabel }: YogaClipCardProps) {
  return (
    <article className="yoga-card">
      <div className="yoga-thumb">
        <img src={clip.thumbnail} alt={`${clip.title} thumbnail`} />
      </div>
      <div className="yoga-card-body">
        <h3>{clip.title}</h3>
        <div className="yoga-tags">
          <span className="yoga-tag">{clip.goal}</span>
          <span className="yoga-tag">{clip.duration}</span>
          <span className="yoga-tag">{clip.level}</span>
        </div>
        <button className="yoga-play" type="button" onClick={() => onPlay(clip)}>
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}
