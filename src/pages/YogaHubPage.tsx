import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import YogaClipCard from "../components/YogaClipCard";
import VideoPlayer from "../components/VideoPlayer";
import useWebXRSupport from "../utils/useWebXRSupport";
import {
  yogaClips,
  yogaDurations,
  yogaGoals,
  yogaLevels,
  type YogaClip
} from "../data/yogaClips";

type Mode = "video" | "list";

const defaultFilters = {
  goal: "all",
  duration: "all",
  level: "all"
};

export default function YogaHubPage() {
  const navigate = useNavigate(); 

  const { supported, checking, isMobile } = useWebXRSupport();
  const canUseAR = supported && isMobile;

  const [filters, setFilters] = useState(defaultFilters);
  const [selectedClip, setSelectedClip] = useState<YogaClip | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [arEnabled, setArEnabled] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setArEnabled(canUseAR);
  }, [canUseAR]);

  useEffect(() => {
    const message = sessionStorage.getItem("nutrixr-yoga-ar-error");
    if (!message) return;

    sessionStorage.removeItem("nutrixr-yoga-ar-error");
    setNotice(message);

    const lastId = sessionStorage.getItem("nutrixr-yoga-last-clip-id");
    if (lastId) {
      const match = yogaClips.find((clip) => clip.id === lastId);
      if (match) {
        setSelectedClip(match);
        setMode("video");
      }
    }
  }, []);

  const filteredClips = useMemo(() => {
    return yogaClips.filter((clip) => {
      if (filters.goal !== "all" && clip.goal !== filters.goal) return false;
      if (filters.duration !== "all" && clip.duration !== filters.duration) return false;
      if (filters.level !== "all" && clip.level !== filters.level) return false;
      return true;
    });
  }, [filters.goal, filters.duration, filters.level]);

  const playLabel = useMemo(() => {
    if (arEnabled && canUseAR) return "Play in AR";
    return "Play Video";
  }, [arEnabled, canUseAR]);

  const openYogaAR = (clip: YogaClip) => {
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const target = `${base}/yoga-ar.html`;
    const index = yogaClips.findIndex((item) => item.id === clip.id);

    const payload = {
      clips: yogaClips,
      index: index >= 0 ? index : 0,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem("nutrixr-yoga-payload", JSON.stringify(payload));
      sessionStorage.setItem("nutrixr-yoga-last-clip-id", clip.id);
    } catch {
      setNotice("Unable to start AR mode. Switching to video mode.");
      setMode("video");
      setSelectedClip(clip);
      return;
    }

    window.location.assign(target);
  };

  const startClip = (clip: YogaClip) => {
    setSelectedClip(clip);

    if (arEnabled && canUseAR) {
      openYogaAR(clip);
      return;
    }

    setMode("video");
  };

  const handleNext = () => {
    if (!selectedClip) return;
    const index = yogaClips.findIndex((clip) => clip.id === selectedClip.id);
    const nextClip = yogaClips[(index + 1) % yogaClips.length];
    setSelectedClip(nextClip);
  };

  const handleExit = () => {
    setMode("list");
    setNotice("");
  };

  if (mode === "video" && selectedClip) {
    return (
      <section className="yoga-hub">
        {notice && <div className="yoga-notice">{notice}</div>}
        <VideoPlayer
          clip={selectedClip}
          onBack={handleExit}
          onNext={handleNext}
        />
      </section>
    );
  }

  return (
    <section className="yoga-hub">
      <header className="yoga-header">
        <button  
          onClick={() => navigate("/Dashboard")} 
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "white",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ← Back
        </button>

        <div>
          <h1>Yoga Hub</h1>
          <p>Short yoga clips for your health goals</p>
        </div>

        <div className="yoga-toggle">
          <label className={`yoga-switch ${!canUseAR ? "disabled" : ""}`}>
            <input
              type="checkbox"
              checked={arEnabled}
              onChange={(e) => setArEnabled(e.target.checked)}
              disabled={!canUseAR}
            />
            <span>AR mode</span>
          </label>

          {!canUseAR && !checking && (
            <span className="yoga-helper">
              AR mode needs a mobile WebXR browser.
            </span>
          )}
        </div>
      </header>

      <div className="yoga-filters">
        <label>
          Goal
          <select
            value={filters.goal}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, goal: e.target.value }))
            }
          >
            <option value="all">All</option>
            {yogaGoals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </label>

        <label>
          Duration
          <select
            value={filters.duration}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, duration: e.target.value }))
            }
          >
            <option value="all">All</option>
            {yogaDurations.map((duration) => (
              <option key={duration} value={duration}>
                {duration}
              </option>
            ))}
          </select>
        </label>

        <label>
          Level
          <select
            value={filters.level}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, level: e.target.value }))
            }
          >
            <option value="all">All</option>
            {yogaLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredClips.length === 0 ? (
        <div className="yoga-empty">
          No clips match the filters. Adjust the selections to see more.
        </div>
      ) : (
        <div className="yoga-grid">
          {filteredClips.map((clip) => (
            <YogaClipCard
              key={clip.id}
              clip={clip}
              onPlay={startClip}
              ctaLabel={playLabel}
            />
          ))}
        </div>
      )}
    </section>
  );
}