import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getFruitNutrition } from "../api/wikidata";

const DEMO_FRUITS = ["Apple", "Avocado", "Banana", "Coconut", "Blueberries", "Cherry"];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ARSlice() {
  const navigate = useNavigate();
  const query = useQuery();
  const urlFruit = (query.get("fruit") || "").trim();
  const urlSlice = Number(query.get("slice"));

  const [fruits, setFruits] = useState([]);
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [slicePercentage, setSlicePercentage] = useState(Number.isFinite(urlSlice) ? urlSlice : 25);
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

        const list = (mod.default || []).filter((f) => DEMO_FRUITS.includes(f.name));
        setFruits(list);

        const lower = urlFruit.toLowerCase();
        const match =
          list.find((f) => f.name?.toLowerCase() === lower) ||
          list.find((f) => f.id?.toLowerCase() === lower) ||
          list.find((f) => f.name?.toLowerCase().includes(lower));

        setSelectedFruit(match || list[0] || null);
      } catch (err) {
        console.error("Failed to load fruits", err);
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
      originalAmount: n.amount
    }));
  }, [nutrients, slicePercentage]);

  const persistPayload = (nextPct = slicePercentage, nextFruit = selectedFruit, nextNutrients = adjustedNutrients) => {
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
      nutrients: nextNutrients
    };
    try {
      sessionStorage.setItem("nutrixr-ar-payload", JSON.stringify(payload));
      localStorage.setItem("nutrixr-ar-payload", JSON.stringify(payload));
    } catch (err) {
      console.warn("Failed to store AR slice payload", err);
    }
  };

  useEffect(() => {
    if (!selectedFruit) return;
    persistPayload();
  }, [selectedFruit, adjustedNutrients, slicePercentage]);

  const onFruitChange = (e) => {
    const name = e.target.value;
    const next = fruits.find((f) => f.name === name) || null;
    setSelectedFruit(next);
    navigate(`/ar-slice?fruit=${encodeURIComponent(name)}&slice=${slicePercentage}`);
  };

  const openAr = () => {
    if (!selectedFruit) return;
    persistPayload();
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const modelPath = selectedFruit.slicedModelPath || selectedFruit.modelPath || "/models/Apple.glb";
    const target = `${base}/ar-slice.html?model=${encodeURIComponent(modelPath.replace(/^\//, ""))}`;
    window.location.assign(target);
  };

  const pct = Number(slicePercentage) || 0;

  return (
    <div className="ar-shell">
      <header className="ar-top">
        <button className="viewer-ghost" onClick={() => navigate(`/slice?fruit=${encodeURIComponent(selectedFruit?.name || "")}`)}>
          {"<"} Back to Slice
        </button>
        <div className="ar-mode-chip">AR Slice</div>
      </header>

      <div className="ar-banner">
        Allow camera access to place your sliced fruit in the real world. Portion changes update nutrient values.
      </div>

      <div className="ar-hero" style={{ textAlign: "left", padding: 24 }}>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 16,
              padding: 16
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Slice Controls</div>
            <label style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700 }}>Select Fruit</label>
            <select
              value={selectedFruit?.name || ""}
              onChange={onFruitChange}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "#0f172a",
                color: "#e5e7eb",
                fontWeight: 700
              }}
            >
              {fruits.map((f) => (
                <option key={f.id || f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700 }}>Slice Percentage</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <input
                type="range"
                min="0"
                max="100"
                value={slicePercentage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setSlicePercentage(next);
                  navigate(`/ar-slice?fruit=${encodeURIComponent(selectedFruit?.name || "")}&slice=${next}`);
                }}
                style={{ width: "100%", accentColor: "#8b5cf6" }}
              />
              <div
                style={{
                  minWidth: 56,
                  textAlign: "center",
                  padding: "6px 8px",
                  borderRadius: 10,
                  background: "rgba(139, 92, 246, 0.2)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  fontWeight: 800
                }}
              >
                {pct}%
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#cbd5e1" }}>
              Nutrient values are scaled to the selected portion.
            </div>
          </div>

          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 16,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>Nutrition Preview</div>
            {loading && <div style={{ color: "#cbd5e1" }}>Loading nutrition data...</div>}
            {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
            {!loading && !error && adjustedNutrients.length === 0 ? (
              <div style={{ color: "#cbd5e1" }}>No nutrition data available.</div>
            ) : null}
            {!loading && !error && adjustedNutrients.length > 0 ? (
              <div style={{ display: "grid", gap: 8, maxHeight: 220, overflow: "auto" }}>
                {adjustedNutrients.slice(0, 6).map((item) => (
                  <div
                    key={item.id || item.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      background: "rgba(15, 23, 42, 0.5)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      border: "1px solid rgba(148, 163, 184, 0.2)"
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{item.name}</span>
                    <span style={{ fontWeight: 800 }}>
                      {typeof item.amount === "number" ? item.amount.toFixed(2) : "--"} {item.unit ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <button className="ar-cta" onClick={openAr} type="button">
              Start AR Slice
            </button>
          </div>
        </div>
      </div>

      <footer className="ar-footer">
        <div className="ar-meta">{selectedFruit?.name || "Fruit"} • {pct}% portion</div>
        <div className="ar-ready">AR Ready</div>
      </footer>
    </div>
  );
}
