import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFruitNutrition } from "../api/wikidata";
import "./FruitCompare.css";

function normalize(s = "") {
  return String(s).trim().toLowerCase();
}

function classifyNutrient(name = "") {
  const n = normalize(name);

  if (n.includes("energy") || n.includes("calorie") || n.includes("kcal")) return "Energy";
  if (n.includes("vitamin")) return "Vitamins";

  const minerals = [
    "calcium",
    "iron",
    "magnesium",
    "potassium",
    "sodium",
    "zinc",
    "phosphorus",
    "copper",
    "manganese",
    "selenium",
  ];
  if (minerals.some((m) => n.includes(m))) return "Minerals";

  if (n.includes("protein")) return "Macros";
  if (n.includes("fat")) return "Macros";
  if (n.includes("carbohydrate") || n.includes("carb")) return "Macros";
  if (n.includes("fiber") || n.includes("fibre")) return "Macros";
  if (n.includes("sugar")) return "Sugar";

  return "Other";
}

function fmt(val) {
  if (typeof val === "number") return val.toFixed(2);
  if (val == null || val === "") return "--";
  return String(val);
}

const CLASS_ORDER = ["Energy", "Macros", "Minerals", "Vitamins", "Sugar", "Other"];
const CLASS_COLOR = {
  Energy: "#F97316",
  Macros: "#F59E0B",
  Minerals: "#EC4899",
  Vitamins: "#6366F1",
  Sugar: "#10B981",
  Other: "#94A3B8",
};

// ---------- TEXT FIT HELPERS (keeps text inside circles) ----------
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function splitToTwoLines(text, maxCharsPerLine) {
  const t = String(text || "").trim();
  if (!t) return [""];

  // If already short
  if (t.length <= maxCharsPerLine) return [t];

  // Prefer splitting by spaces
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    // Single long token: hard-split
    return [t.slice(0, maxCharsPerLine - 1) + "…", ""].filter(Boolean);
  }

  let line1 = "";
  let i = 0;
  while (i < parts.length) {
    const next = line1 ? `${line1} ${parts[i]}` : parts[i];
    if (next.length > maxCharsPerLine) break;
    line1 = next;
    i++;
  }
  const line2 = parts.slice(i).join(" ");
  if (!line2) return [line1];

  if (line2.length <= maxCharsPerLine) return [line1, line2];

  // Truncate second line if still too long
  return [line1, line2.slice(0, maxCharsPerLine - 1) + "…"];
}

function estimateTextWidthPx(text, fontSize) {
  // rough but works: avg ~0.56em per char
  return String(text || "").length * fontSize * 0.56;
}

function fitFontSizeForCircle(lines, subtitle, r, baseTitleSize, baseSubSize) {
  const pad = 10;
  const maxW = (r - pad) * 2;

  let titleSize = baseTitleSize;
  let subSize = baseSubSize;

  // shrink title first
  for (let k = 0; k < 8; k++) {
    const widestTitle = Math.max(...lines.map((l) => estimateTextWidthPx(l, titleSize)));
    const subW = subtitle ? estimateTextWidthPx(subtitle, subSize) : 0;

    if (Math.max(widestTitle, subW) <= maxW) break;
    titleSize = Math.max(9.5, titleSize - 0.9);
    subSize = Math.max(9, subSize - 0.7);
  }

  return { titleSize, subSize };
}

// ---------- COLLISION / FORCE LAYOUT (prevents overlaps) ----------
function relaxLayout(nodes, {
  width,
  height,
  margin = 56,
  iters = 90,
  padding = 10,
  spring = 0.06,
  repel = 0.65,
} = {}) {
  const clampX = (x) => clamp(x, margin, width - margin);
  const clampY = (y) => clamp(y, margin, height - margin);

  // nodes: {x,y,r, ax,ay, pinned?}
  for (let t = 0; t < iters; t++) {
    // 1) spring back to anchor
    for (const n of nodes) {
      if (n.pinned) continue;
      n.x += (n.ax - n.x) * spring;
      n.y += (n.ay - n.y) * spring;
      n.x = clampX(n.x);
      n.y = clampY(n.y);
    }

    // 2) collision resolution (all nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

        const minDist = a.r + b.r + padding;
        if (dist >= minDist) continue;

        const push = (minDist - dist) * 0.5 * repel;
        const ux = dx / dist;
        const uy = dy / dist;

        if (!a.pinned) {
          a.x = clampX(a.x - ux * push);
          a.y = clampY(a.y - uy * push);
        }
        if (!b.pinned) {
          b.x = clampX(b.x + ux * push);
          b.y = clampY(b.y + uy * push);
        }
      }
    }
  }
  return nodes;
}

function NodeBubble({
  x,
  y,
  r,
  title,
  subtitle,
  accent = "#CBD5E1",
  opacity = 1,
  bold = false,
  onClick,
}) {
  // Wrap title to two lines and fit font sizes
  const isSmall = r <= 28;
  const maxCharsPerLine = isSmall ? 10 : 12;
  const lines = splitToTwoLines(title, maxCharsPerLine);

  const baseTitleSize = isSmall ? 12 : 14;
  const baseSubSize = isSmall ? 10.5 : 12;
  const { titleSize, subSize } = fitFontSizeForCircle(lines, subtitle, r, baseTitleSize, baseSubSize);

  // vertical layout inside circle
  const hasTwo = lines.length === 2;
  const titleY1 = hasTwo ? y - 6 : y - 4;
  const titleY2 = hasTwo ? y + 8 : null;
  const subY = subtitle ? (hasTwo ? y + 22 : y + 14) : null;

  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default", opacity }}>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={accent} strokeWidth={2.2} />

      <text
        x={x}
        y={titleY1}
        textAnchor="middle"
        fontSize={titleSize}
        fontWeight={bold ? 950 : 850}
        fill="#0F172A"
        style={{ userSelect: "none" }}
      >
        {lines[0]}
      </text>

      {hasTwo ? (
        <text
          x={x}
          y={titleY2}
          textAnchor="middle"
          fontSize={titleSize}
          fontWeight={bold ? 950 : 850}
          fill="#0F172A"
          style={{ userSelect: "none" }}
        >
          {lines[1]}
        </text>
      ) : null}

      {subtitle ? (
        <text
          x={x}
          y={subY}
          textAnchor="middle"
          fontSize={subSize}
          fontWeight={800}
          fill="#64748B"
          style={{ userSelect: "none" }}
        >
          {subtitle}
        </text>
      ) : null}
    </g>
  );
}

export default function AdaptiveLayout() {
  const navigate = useNavigate();

  const [fruits, setFruits] = useState([]);
  const [selectedFruit, setSelectedFruit] = useState(null);

  const [nutrients, setNutrients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [layoutMode, setLayoutMode] = useState("AUTO");
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadFruits() {
      try {
        const modules = import.meta.glob("../data/*.js");
        const inlineKey = Object.keys(modules).find((k) => k.endsWith("fruits.inline.js"));
        const imagesKey = Object.keys(modules).find((k) => k.endsWith("fruits.images.js"));
        const fallbackKey = Object.keys(modules).find((k) => k.endsWith("fruits.js"));

        let mod = null;
        if (inlineKey) mod = await modules[inlineKey]();
        else if (imagesKey) mod = await modules[imagesKey]();
        else if (fallbackKey) mod = await modules[fallbackKey]();
        else mod = { default: [] };

        if (!active) return;

        const list = mod.default || [];
        setFruits(list);
        setSelectedFruit(list[0] || null);
      } catch (e) {
        console.error("Failed to load fruits", e);
      }
    }

    loadFruits();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNutrition() {
      if (!selectedFruit?.name) return;
      setLoading(true);
      setNutrients([]);

      try {
        const data = await getFruitNutrition(selectedFruit.name);
        if (cancelled) return;
        setNutrients(data?.nutrients || []);
      } catch (e) {
        if (cancelled) return;
        setNutrients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNutrition();
    return () => {
      cancelled = true;
    };
  }, [selectedFruit]);

  const enriched = useMemo(() => {
    return (nutrients || []).map((n) => ({
      ...n,
      semanticClass: classifyNutrient(n?.name || ""),
    }));
  }, [nutrients]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of enriched) {
      const c = item.semanticClass || "Other";
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(item);
    }

    const cats = Array.from(map.keys()).sort((a, b) => {
      const ai = CLASS_ORDER.indexOf(a);
      const bi = CLASS_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return { cats, map };
  }, [enriched]);

  const nodeCount = useMemo(() => 1 + grouped.cats.length + enriched.length, [grouped.cats.length, enriched.length]);
  const categoryCount = grouped.cats.length;

  const Graph = () => {
    const width = 1120;
    const baseHeight = 760;

    const mode =
      layoutMode === "AUTO" ? (enriched.length > 12 ? "HIERARCHICAL" : "RADIAL") : layoutMode;

    const maxStack = Math.max(1, ...grouped.cats.map((c) => (grouped.map.get(c) || []).length));
    const height = mode === "HIERARCHICAL" ? Math.max(baseHeight, 360 + maxStack * 84) : baseHeight;

    const cx = width / 2;
    const cy = height / 2;

    const fruitEmoji = selectedFruit?.emoji || "🍎";
    const fruitName = selectedFruit?.name || "Fruit";

    const cats = grouped.cats;
    const catCount = Math.max(1, cats.length);

    const root = mode === "HIERARCHICAL" ? { x: cx, y: 120 } : { x: cx, y: cy + 35 };

    const margin = 70;
    const clampX = (x) => clamp(x, margin, width - margin);
    const clampY = (y) => clamp(y, margin, height - margin);

    // ---- Base placements
    const catPositions = cats.map((c, i) => {
      if (mode === "RADIAL") {
        const angle = (Math.PI * 2 * i) / catCount - Math.PI / 2;
        const rCat = Math.min(410, Math.max(310, 230 + catCount * 18, height * 0.34));
        const squashY = 0.90;
        const x = root.x + rCat * Math.cos(angle);
        const y = root.y + (rCat * squashY) * Math.sin(angle);

        return { c, i, a: angle, x: clampX(x), y: clampY(y) };
      }

      const span = Math.min(960, width - 180);
      const startX = cx - span / 2;
      const x = startX + (span * (i + 0.5)) / catCount;
      const y = 280;
      return { c, i, x, y };
    });

    // Nutrient placement: full rings around each category (better spacing)
    const nutrientPositions = [];
    for (const cp of catPositions) {
      const items = grouped.map.get(cp.c) || [];
      const n = items.length;

      for (let j = 0; j < n; j++) {
        const it = items[j];

        if (mode === "HIERARCHICAL") {
          // two-column grid per category to avoid vertical overlaps
          const col = j % 2;
          const row = Math.floor(j / 2);
          const x = cp.x + (col === 0 ? -70 : 70);
          const y = cp.y + 130 + row * 86;
          nutrientPositions.push({ it, x, y, parent: cp });
          continue;
        }

        // RADIAL: rings, evenly distributed
        const ringSize = n <= 8 ? 8 : n <= 14 ? 10 : 12;
        const ring = Math.floor(j / ringSize);
        const pos = j % ringSize;
        const inRingCount = Math.min(ringSize, n - ring * ringSize);

        const a0 = cp.a + Math.PI; // prefer opposite direction of root-to-cat to open space
        const step = (Math.PI * 2) / inRingCount;
        const a = a0 + step * pos;

        const rNut = 120 + ring * 70;

        const x = clampX(cp.x + rNut * Math.cos(a));
        const y = clampY(cp.y + rNut * Math.sin(a));
        nutrientPositions.push({ it, x, y, parent: cp });
      }
    }

    // ---- Build nodes for relaxation (categories + nutrients), keep anchors
    const catR = 44;
    const nutR = mode === "RADIAL" ? 28 : 30;

    const allNodes = [];

    // categories
    const relaxedCat = catPositions.map((cp) => {
      const node = {
        key: `cat-${cp.c}`,
        kind: "cat",
        c: cp.c,
        x: cp.x,
        y: cp.y,
        ax: cp.x,
        ay: cp.y,
        r: catR,
        a: cp.a,
      };
      allNodes.push(node);
      return node;
    });

    // nutrients
    const relaxedNut = nutrientPositions.map((np) => {
      const node = {
        key: `nut-${np.it.id || np.it.name}-${np.parent.c}`,
        kind: "nut",
        it: np.it,
        parentC: np.parent.c,
        x: np.x,
        y: np.y,
        ax: np.x,
        ay: np.y,
        r: nutR,
      };
      allNodes.push(node);
      return node;
    });

    // Keep root pinned (acts as an obstacle)
    allNodes.push({
      key: "root",
      kind: "root",
      x: root.x,
      y: root.y,
      ax: root.x,
      ay: root.y,
      r: 54,
      pinned: true,
    });

    // Relax only in RADIAL (hierarchical already grid-based)
    if (mode === "RADIAL") {
      relaxLayout(allNodes, {
        width,
        height,
        margin: 66,
        iters: 120,
        padding: 12,
        spring: 0.055,
        repel: 0.75,
      });
    }

    // Map back positions
    const catPosByKey = new Map(relaxedCat.map((n) => [n.key, n]));
    const nutPosByKey = new Map(relaxedNut.map((n) => [n.key, n]));

    const showHighlight = (c) => {
      if (!selectedClass) return true;
      return selectedClass === c;
    };

    return (
      <div
        className="panel"
        style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 14 }}
      >
        <div className="panel-head" style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="panel-title">Graph view</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="status-pill">Nodes: {nodeCount}</span>
            <span className="status-pill">Categories: {categoryCount}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            borderRadius: 16,
            border: "1px solid #EEF2F7",
            background: "radial-gradient(900px 420px at 50% 0%, #EEF2FF 0%, #FFFFFF 55%, #F8FAFC 100%)",
            overflow: "hidden",
          }}
        >
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="640" style={{ display: "block" }}>
            {/* Root -> Categories */}
            {cats.map((c) => {
              const cp = catPosByKey.get(`cat-${c}`);
              if (!cp) return null;
              const op = showHighlight(c) ? 1 : 0.16;
              return (
                <line
                  key={`fc-${c}`}
                  x1={root.x}
                  y1={root.y + 18}
                  x2={cp.x}
                  y2={cp.y - 28}
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  opacity={op}
                />
              );
            })}

            {/* Category -> Nutrients */}
            {relaxedNut.map((np) => {
              const parent = catPosByKey.get(`cat-${np.parentC}`);
              if (!parent) return null;
              const op = showHighlight(np.parentC) ? 1 : 0.16;
              return (
                <line
                  key={`cn-${np.key}`}
                  x1={parent.x}
                  y1={parent.y + 28}
                  x2={np.x}
                  y2={np.y - 24}
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  opacity={op}
                />
              );
            })}

            {/* Root */}
            <g>
              <text x={root.x} y={root.y - 58} textAnchor="middle" fontSize="54" style={{ userSelect: "none" }}>
                {fruitEmoji}
              </text>
              <text
                x={root.x}
                y={root.y + 10}
                textAnchor="middle"
                fontSize="20"
                fontWeight="950"
                fill="#0F172A"
                style={{ userSelect: "none" }}
              >
                {fruitName}
              </text>
            </g>

            {/* Categories */}
            {cats.map((c) => {
              const count = (grouped.map.get(c) || []).length;
              const accent = CLASS_COLOR[c] || "#CBD5E1";
              const cp = catPosByKey.get(`cat-${c}`);
              if (!cp) return null;

              const op = showHighlight(c) ? 1 : 0.22;

              return (
                <NodeBubble
                  key={`cat-${c}`}
                  x={cp.x}
                  y={cp.y}
                  r={catR}
                  title={c}
                  subtitle={String(count)}
                  accent={accent}
                  opacity={op}
                  bold
                  onClick={() => setSelectedClass((prev) => (prev === c ? null : c))}
                />
              );
            })}

            {/* Nutrients */}
            {relaxedNut.map((np) => {
              const c = np.parentC;
              const accent = CLASS_COLOR[c] || "#CBD5E1";
              const op = showHighlight(c) ? 1 : 0.22;

              return (
                <NodeBubble
                  key={np.key}
                  x={np.x}
                  y={np.y}
                  r={nutR}
                  title={np.it.name}
                  subtitle={`${fmt(np.it.amount)} ${np.it.unit ?? ""}`}
                  accent={accent}
                  opacity={op}
                />
              );
            })}

            <text x="28" y={height - 24} fontSize="12" fill="#64748B">
              Tip: click a category bubble to highlight / reset.
            </text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="compare-page">
      <header className="compare-nav">
        <div className="nav-left">
          <button className="nav-back" onClick={() => navigate(-1)} type="button">
            <span className="nav-back-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M14.5 6.5l-5 5 5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Back</span>
          </button>

          <div className="nav-title">
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 12a8 8 0 1016 0 8 8 0 10-16 0z" fill="currentColor" opacity="0.25" />
                <path d="M8 12h8M12 8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            Adaptive Layout
          </div>
        </div>

        <div className="nav-actions">
          <span className="status-pill">
            Mode: <b>{layoutMode}</b>
          </span>
        </div>
      </header>

      <div
        className="adaptive-grid"
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        <aside className="viewer-side">
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Controls</div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 6 }}>
                  Selected Fruit
                </div>
                <select
                  value={selectedFruit?.name || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    const next = fruits.find((f) => f.name === name) || null;
                    setSelectedFruit(next);
                    setSelectedClass(null);
                  }}
                  style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #E5E7EB" }}
                >
                  {fruits.map((f) => (
                    <option key={f.id || f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 8 }}>
                  Layout mode
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["AUTO", "HIERARCHICAL", "RADIAL"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`mode-chip ${layoutMode === m ? "active" : ""}`}
                      onClick={() => {
                        setLayoutMode(m);
                        setSelectedClass(null);
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderRadius: 12, border: "1px solid #EEF2F7", background: "#fff", padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Summary</div>
                {loading ? (
                  <div className="detect-status muted">Loading nutrition…</div>
                ) : (
                  <>
                    <div className="detect-status muted">
                      Nodes: <b>{nodeCount}</b> · Categories: <b>{categoryCount}</b>
                    </div>
                    <div className="detect-status">
                      Fruit: <b>{selectedFruit?.name || "—"}</b>
                    </div>
                    <div className="detect-status success">
                      Highlight: <b>{selectedClass || "None"}</b>
                    </div>
                  </>
                )}
              </div>

              <div className="detect-status warning" style={{ marginTop: 2 }}>
                Tip: click a category bubble to highlight/reset.
              </div>
            </div>
          </div>
        </aside>

        <section>
          {loading ? (
            <div className="panel" style={{ padding: 14 }}>
              <div className="detect-status muted">Loading nutrition…</div>
            </div>
          ) : (
            <Graph />
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .adaptive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

