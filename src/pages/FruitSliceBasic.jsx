import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FruitSlice.css";

import Scene from "../components/Scene.jsx";
import { getFruitNutrition } from "../api/wikidata";

// 🔴 DEMO MODE (TEMPORARY)
// Only showing limited fruits for demo day
// TODO: Remove this filter after demo
const DEMO_FRUITS = [
  "Apple",
  "Avocado",
  "Banana",
  "Coconut",
  "Blueberries",
  "Cherry"
];


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function getNutrientEmoji(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("energy") || lower.includes("calorie")) return "⚡";
  if (lower.includes("sugar")) return "🍬";
  if (lower.includes("protein")) return "💪";
  if (lower.includes("fiber") || lower.includes("fibre")) return "🌾";
  if (lower.includes("fat")) return "🧈";
  if (lower.includes("potassium")) return "🍌";
  if (lower.includes("calcium")) return "🦴";
  if (lower.includes("iron")) return "🔩";
  if (lower.includes("vitamin c")) return "🍊";
  if (lower.includes("vitamin a")) return "🥕";
  if (lower.includes("vitamin k")) return "🩹";
  if (lower.includes("vitamin")) return "💊";
  return "🍎";
}

export default function FruitSlice() {
  const navigate = useNavigate();
  const query = useQuery();
  const urlFruit = (query.get("fruit") || "").trim();

  const [fruits, setFruits] = useState([]);
  const [selectedFruit, setSelectedFruit] = useState(null);

  const [slicePercentage, setSlicePercentage] = useState(25);

  const [nutrients, setNutrients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

        //const list = mod.default || []; original
        const list = (mod.default || []).filter(f => //demo
          DEMO_FRUITS.includes(f.name)
          ); // demo
        setFruits(list);

        const lower = urlFruit.toLowerCase();
        const match =
          list.find((f) => f.name?.toLowerCase() === lower) ||
          list.find((f) => f.id?.toLowerCase() === lower) ||
          list.find((f) => f.name?.toLowerCase().includes(lower));

        setSelectedFruit(match || list[0] || null);
      } catch (e) {
        console.error("Failed to load fruits", e);
      }
    }

    loadFruits();
    return () => {
      active = false;
    };
  }, [urlFruit]);

  useEffect(() => {
    let cancelled = false;

    async function loadNutrition() {
      if (!selectedFruit?.name) return;

      setLoading(true);
      setError(null);
      setNutrients([]);

      try {
        const data = await getFruitNutrition(selectedFruit.name);
        if (cancelled) return;
        setNutrients(data.nutrients || []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Failed to load nutrition data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNutrition();
    return () => {
      cancelled = true;
    };
  }, [selectedFruit]);

  const adjustedNutrients = useMemo(() => {
    const pct = Number(slicePercentage) || 0;
    return (nutrients || []).map((n) => ({
      ...n,
      amount: typeof n.amount === "number" ? (n.amount * pct) / 100 : n.amount,
      originalAmount: n.amount,
    }));
  }, [nutrients, slicePercentage]);

  const persistArPayload = (nextPct = slicePercentage, nextFruit = selectedFruit) => {
    if (!nextFruit) return;
    const payload = {
      mode: "slice",
      slicePercentage: Number(nextPct) || 0,
      fruit: {
        id: nextFruit.id,
        name: nextFruit.name,
        modelPath: nextFruit.slicedModelPath || nextFruit.modelPath,
        scale: nextFruit.scale || null,
        emoji: nextFruit.emoji || null
      },
      nutrients: adjustedNutrients
    };
    try {
      sessionStorage.setItem("nutrixr-ar-payload", JSON.stringify(payload));
      localStorage.setItem("nutrixr-ar-payload", JSON.stringify(payload));
    } catch (err) {
      console.warn("Failed to store AR slice payload", err);
    }
  };

  const onFruitChange = (e) => {
    const name = e.target.value;
    const next = fruits.find((f) => f.name === name) || null;
    setSelectedFruit(next);
    setSlicePercentage(25);
    navigate(`/slice?fruit=${encodeURIComponent(name)}`);
  };

  const pct = Number(slicePercentage) || 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 18,
        background:
          "radial-gradient(1200px 700px at 20% 10%, #EEF2FF 0%, #F8FAFC 40%, #F3F4F6 100%)",
        fontFamily: "system-ui",
      }}
    >
      <div
        className="slice-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(255,255,255,0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>Slice Mode</div>

        <button
          onClick={() => navigate("/app")} /*app*/
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
      </div>

      <div
        className="slice-grid"
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Select Fruit</label>
              <select
                value={selectedFruit?.name || ""}
                onChange={onFruitChange}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {fruits.map((f) => (
                  <option key={f.id || f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="slice-canvas"
              style={{
                height: 360,
                borderRadius: 16,
                border: "1px dashed rgba(0,0,0,0.12)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))",
                overflow: "hidden",
              }}
            >
              <Scene
                fruit={selectedFruit}
                sliceMode={false}
                nutrients={adjustedNutrients}
                selectedNutrient={null}
                onSelectNutrient={() => {}}
              />
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{selectedFruit?.name || "-"}</div>
                <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 700 }}>Portion: {pct}%</div>
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slicePercentage}
                  onChange={(e) => setSlicePercentage(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 999,
                    outline: "none",
                    accentColor: "#6366F1",
                  }}
                />
                <div
                  style={{
                    minWidth: 64,
                    textAlign: "center",
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: "rgba(99, 102, 241, 0.10)",
                    border: "1px solid rgba(99, 102, 241, 0.20)",
                    fontWeight: 900,
                  }}
                >
                  {pct}%
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    persistArPayload();
                    navigate(`/ar-slice?fruit=${encodeURIComponent(selectedFruit?.name || "")}&slice=${pct}`);
                  }}
                  style={{
                    border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Open AR Slice
                </button>
                <div style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
                  Uses {pct}% portion for AR nutrient values.
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="slice-side-panel" aria-label="Right panel">
          <h3 className="panel-title">Nutrition</h3>

          {loading && <p className="status-text">Loading nutrition data…</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && selectedFruit && adjustedNutrients.length === 0 && (
            <p className="status-text">Nutrition data not available for {selectedFruit?.name}.</p>
          )}

          {!loading && !error && adjustedNutrients.length > 0 && (
            <div>
              <div
                style={{
                  background: "#DBEAFE",
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 10,
                  fontSize: 12,
                  color: "#0369A1",
                  fontWeight: 700,
                }}
              >
                Values adjusted to {pct}% portion
              </div>

              <ul className="nutrient-list">
                {adjustedNutrients.map((item) => (
                  <li key={item.id || item.name} className="nutrient-item">
                    <span className="nutrient-emoji">{getNutrientEmoji(item.name)}</span>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: 12,
                      }}
                    >
                      <div className="nutrient-name" style={{ fontWeight: 800 }}>
                        {item.name}
                      </div>

                      <div className="nutrient-value" style={{ fontWeight: 900 }}>
                        {typeof item.amount === "number" ? item.amount.toFixed(2) : "--"} {item.unit ?? ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {pct < 100 && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  Showing portion-scaled values.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

