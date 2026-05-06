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
  if (n.includes("fiber") || n.includes("fibre")) return "Fiber";

  if (n.includes("sugar")) return "Sugar";

  return "Other";
}

function fmt(val) {
  if (typeof val === "number") return val.toFixed(2);
  if (val == null || val === "") return "--";
  return String(val);
}

const CLASS_COLOR = {
  All: "#3B82F6",
  Vitamins: "#6366F1",
  Minerals: "#EC4899",
  Macros: "#F59E0B",
  Fiber: "#22C55E",
  Sugar: "#10B981",
  Energy: "#F97316",
  Other: "#94A3B8",
};

export default function SemanticFilter() {
  const navigate = useNavigate();

  const [fruits, setFruits] = useState([]);
  const [selectedFruit, setSelectedFruit] = useState(null);

  const [nutrients, setNutrients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeClass, setActiveClass] = useState("All");
  const [search, setSearch] = useState("");
  const [showOnlyFilteredInGraph, setShowOnlyFilteredInGraph] = useState(true);

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

  const classCounts = useMemo(() => {
    const counts = { All: enriched.length };
    for (const item of enriched) {
      const c = item.semanticClass || "Other";
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    return enriched.filter((n) => {
      const classOk = activeClass === "All" ? true : n.semanticClass === activeClass;
      const searchOk = !q ? true : normalize(n.name).includes(q);
      return classOk && searchOk;
    });
  }, [enriched, activeClass, search]);

  const onFruitChange = (e) => {
    const name = e.target.value;
    const next = fruits.find((f) => f.name === name) || null;
    setSelectedFruit(next);
    setActiveClass("All");
    setSearch("");
  };

  const classes = ["All", "Vitamins", "Minerals", "Macros", "Fiber", "Sugar", "Energy", "Other"];

  const visibleCats = useMemo(() => {
    const base = classes.filter((c) => c === "All" || (classCounts[c] ?? 0) > 0);
    return base;
  }, [classCounts]);

  const Graph = () => {
    const cats = visibleCats.filter((c) => c !== "All");
    const size = 420;

    const center = { x: size / 2, y: size / 2 };
    const radius = 140;
    const positions = cats.map((c, i) => {
      const angle = (Math.PI * 2 * i) / Math.max(1, cats.length) - Math.PI / 2;
      return {
        c,
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
    });

    const hubLabel = activeClass === "All" ? "All nutrients" : `${activeClass} (filtered)`;

    return (
      <div
        style={{
          borderRadius: 14,
          border: "1px solid #eee",
          background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 60%, #f8fafc 100%)",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Semantic Filtering</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Showing: <b>{hubLabel}</b>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <div
            style={{
              width: "100%",
              maxWidth: size,
              aspectRatio: "1 / 1",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <svg
              viewBox={`0 0 ${size} ${size}`}
              width="100%"
              height="100%"
              style={{ position: "absolute", inset: 0 }}
            >
              {positions.map((p) => (
                <line
                  key={`line-${p.c}`}
                  x1={center.x}
                  y1={center.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={activeClass === p.c ? CLASS_COLOR[p.c] : "#CBD5E1"}
                  strokeWidth={activeClass === p.c ? 3 : 2}
                  opacity={activeClass === "All" ? 0.9 : activeClass === p.c ? 1 : 0.5}
                />
              ))}
            </svg>

            <button
              type="button"
              onClick={() => setActiveClass("All")}
              style={{
                position: "absolute",
                left: center.x,
                top: center.y,
                transform: "translate(-50%, -50%)",
                width: 160,
                height: 160,
                borderRadius: "999px",
                border: activeClass === "All" ? `2px solid ${CLASS_COLOR.All}` : "1px solid #E5E7EB",
                background: "white",
                cursor: "pointer",
                boxShadow:
                  activeClass === "All"
                    ? `0 0 0 6px rgba(59,130,246,0.12), 0 18px 40px rgba(15,23,42,0.10)`
                    : "0 14px 30px rgba(15,23,42,0.08)",
              }}
              title="Show all nutrients"
            >
              <div style={{ fontWeight: 1000, fontSize: 16 }}>All</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                {classCounts.All ?? 0} nutrients
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
                Tap to reset filter
              </div>
            </button>

            {positions.map((p) => {
              const isActive = activeClass === p.c;
              const count = classCounts[p.c] ?? 0;
              const color = CLASS_COLOR[p.c] || "#94A3B8";

              return (
                <button
                  key={p.c}
                  type="button"
                  onClick={() => setActiveClass(p.c)}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    transform: "translate(-50%, -50%)",
                    width: 140,
                    height: 140,
                    borderRadius: "999px",
                    border: isActive ? `2px solid ${color}` : "1px solid #E5E7EB",
                    background: "white",
                    cursor: "pointer",
                    boxShadow: isActive
                      ? `0 0 0 7px ${hexToRgba(color, 0.16)}, 0 18px 40px rgba(15,23,42,0.12)`
                      : "0 14px 30px rgba(15,23,42,0.08)",
                    transition: "transform 120ms ease, box-shadow 120ms ease, border 120ms ease",
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "translate(-50%, -50%) scale(0.98)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)")}
                  title={`Filter: ${p.c}`}
                >
                  <div style={{ fontWeight: 1000, fontSize: 15 }}>{p.c}</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                    {count} items
                  </div>
                  {isActive && (
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, color }}>
                      Active
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #EEF2F7",
              background: "#fff",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showOnlyFilteredInGraph}
                onChange={(e) => setShowOnlyFilteredInGraph(e.target.checked)}
              />
              Show only filtered
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {visibleCats.map((c) => {
              const isActive = activeClass === c;
              const color = CLASS_COLOR[c] || "#94A3B8";
              const count = classCounts[c] ?? 0;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveClass(c)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: isActive ? `2px solid ${color}` : "1px solid #E5E7EB",
                    background: isActive ? hexToRgba(color, 0.10) : "white",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 12,
                    color: "#0F172A",
                  }}
                  title={`${c} (${count})`}
                >
                  {c} <span style={{ opacity: 0.6 }}>({count})</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Filtered list: <b>{filtered.length}</b> / {enriched.length}
            {showOnlyFilteredInGraph ? (
              <span style={{ marginLeft: 6 }}>(graph shows filtered)</span>
            ) : (
              <span style={{ marginLeft: 6 }}>(graph shows all)</span>
            )}
          </div>
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
                <path
                  d="M4 12a8 8 0 1016 0 8 8 0 10-16 0z"
                  fill="currentColor"
                  opacity="0.25"
                />
                <path
                  d="M12 6v6l4 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Semantic Filtering
          </div>
        </div>
        <div className="nav-actions">
          <button
            type="button"
            onClick={() => navigate("/adaptive-layout")}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "8px 16px",
              background: "linear-gradient(135deg,#0f172a,#1e293b)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Adaptive Graph
          </button>
        </div>
      </header>

      <div className="semantic-grid">
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 6 }}>
                Selected Fruit
              </div>
              <select
                value={selectedFruit?.name || ""}
                onChange={onFruitChange}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              >
                {fruits.map((f) => (
                  <option key={f.id || f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 6 }}>
                Search nutrient
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g., vitamin, sugar, iron..."
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {loading ? <div style={{ opacity: 0.7 }}>Loading nutrition…</div> : <Graph />}
          </div>
        </div>

        <aside className="side-panel" aria-label="Right panel">
          <h3 className="panel-title">
            Nutrients{" "}
            <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>
              ({filtered.length}/{enriched.length})
            </span>
          </h3>

          {!loading && (
            <>
              {filtered.length === 0 ? (
                <p className="status-text" style={{ marginTop: 8 }}>
                  No nutrients match your current filter.
                </p>
              ) : (
                <ul className="nutrient-list">
                  {filtered.map((item) => {
                    const c = item.semanticClass || "Other";
                    const color = CLASS_COLOR[c] || "#94A3B8";
                    const highlight = activeClass !== "All" && c === activeClass;

                    return (
                      <li
                        key={item.id || item.name}
                        className="nutrient-item"
                        style={{
                          borderLeft: `4px solid ${hexToRgba(color, highlight ? 1 : 0.35)}`,
                          boxShadow: highlight ? `0 0 0 4px ${hexToRgba(color, 0.08)}` : "none",
                        }}
                      >
                        <span className="nutrient-emoji" style={{ width: 10 }} />

                        <div className="nutrient-text" style={{ width: "100%" }}>
                          <div
                            className="nutrient-name"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 900,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: "1 1 auto",
                              }}
                            >
                              {item.name}
                            </span>

                            <span
                              style={{
                                fontSize: 13,
                                opacity: 0.85,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                flex: "0 0 auto",
                              }}
                            >
                              {fmt(item.amount)} {item.unit ?? ""}
                            </span>

                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: hexToRgba(color, 0.12),
                                color: "#0F172A",
                                fontWeight: 900,
                                border: `1px solid ${hexToRgba(color, 0.25)}`,
                                whiteSpace: "nowrap",
                                flex: "0 0 auto",
                              }}
                            >
                              {c}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function hexToRgba(hex, a = 1) {
  const h = String(hex).replace("#", "").trim();
  if (h.length !== 6) return `rgba(148,163,184,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

