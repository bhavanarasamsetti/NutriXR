export type YogaGoal = "digestion" | "stress" | "energy" | "posture" | "sleep";
export type YogaDuration = "20s" | "1m" | "3m";
export type YogaLevel = "beginner" | "easy" | "medium";

export type YogaClip = {
  id: string;
  title: string;
  goal: YogaGoal;
  duration: YogaDuration;
  level: YogaLevel;
  thumbnail: string;
  videoSrc: string;
};

export const yogaGoals: YogaGoal[] = [
  "digestion",
  "stress",
  "energy",
  "posture",
  "sleep"
];

export const yogaDurations: YogaDuration[] = ["20s", "1m", "3m"];

export const yogaLevels: YogaLevel[] = ["beginner", "easy", "medium"];

const VIDEO_1 =
  "/videos/WhatsApp%20Video%202026-02-26%20at%2012.14.31%20PM.mp4";
const VIDEO_2 =
  "/videos/WhatsApp%20Video%202026-02-26%20at%2012.18.28%20PM.mp4";

export const yogaClips: YogaClip[] = [
  {
    id: "digest-20",
    title: "Gentle Twist ",
    goal: "digestion",
    duration: "20s",
    level: "beginner",
    thumbnail: "/images/yoga/digest_20.png",
    videoSrc: VIDEO_1
  },
  {
    id: "digest-1m",
    title: "Seated Flow ",
    goal: "digestion",
    duration: "1m",
    level: "easy",
    thumbnail: "/images/yoga/digest_1m.png",
    videoSrc: VIDEO_1
  },
  {
    id: "stress-3m",
    title: "Evening Calm Flow",
    goal: "stress",
    duration: "3m",
    level: "easy",
    thumbnail: "/images/yoga/stress_3m.png",
    videoSrc: VIDEO_2
  },
  {
    id: "energy-20",
    title: "Wake Up Stretch",
    goal: "energy",
    duration: "20s",
    level: "beginner",
    thumbnail: "/images/yoga/energy_20.png",
    videoSrc: VIDEO_1
  },
  {
    id: "energy-1m",
    title: "Quick Sun Flow",
    goal: "energy",
    duration: "1m",
    level: "easy",
    thumbnail: "/images/yoga/energy_1m.png",
    videoSrc: VIDEO_2
  },
  {
    id: "posture-1m",
    title: "Posture Reset Stack",
    goal: "posture",
    duration: "1m",
    level: "medium",
    thumbnail: "/images/yoga/posture_1m.png",
    videoSrc: VIDEO_2
  }
];
