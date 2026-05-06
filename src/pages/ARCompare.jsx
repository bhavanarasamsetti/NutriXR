import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Scene from "../components/Scene.jsx";

function getPayload() {
  try {
    const raw = sessionStorage.getItem("nutrixr-ar-compare");
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (err) {
    console.warn("Failed to parse AR compare payload", err);
    return [];
  }
}

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android/i.test(navigator.userAgent || "");
}

function launchARForFruit(item) {
  if (!item?.fruit) return;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const modelPath = item.fruit.modelPath || "/models/Apple.glb";
  const target = `${base}/ar.html?model=${encodeURIComponent(modelPath.replace(/^\//, ""))}`;

  const payload = {
    fruit: {
      id: item.fruit.id,
      name: item.fruit.name,
      modelPath: item.fruit.modelPath,
      scale: item.fruit.scale || null
    },
    nutrients: item.nutrients || [],
    timestamp: Date.now()
  };

  try {
    sessionStorage.setItem("nutrixr-ar-payload", JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to set AR payload", err);
  }

  window.location.assign(target);
}

export default function ARCompare() {
  const navigate = useNavigate();
  const items = useMemo(() => getPayload().slice(0, 3), []);
  const mobile = isMobile();
  const videoRef = useRef(null);

  useEffect(() => {
    if (!mobile || !items.length) return undefined;
    const models = items
      .map((item) => (item.fruit?.modelPath || "/models/Apple.glb").replace(/^\//, ""))
      .join(",");
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const target = `${base}/ar-multi.html?models=${encodeURIComponent(models)}`;
    try {
      sessionStorage.setItem("nutrixr-ar-compare", JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to persist ar-compare payload", err);
    }
    window.location.assign(target);
    return undefined;
  }, [mobile, items]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#e5e7eb",
        fontFamily: '"Segoe UI","Inter",system-ui,-apple-system,sans-serif',
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0f182b",
          padding: "12px 16px",
          borderRadius: 14,
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)"
        }}
      >
        <button
          onClick={() => navigate("/compare")}
          style={{
            border: "1px solid #1f2a3f",
            background: "transparent",
            color: "#e5e7eb",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700
          }}
        >
          {"<"} Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
          <span
            style={{
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              padding: "6px 10px",
              borderRadius: 999
            }}
          >
            XR
          </span>
          AR Compare
        </div>
        <div />
      </header>

      {!items.length ? (
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 14,
            padding: 16,
            color: "#cbd5e1"
          }}
        >
          No fruits selected. Go back and pick fruits to compare.
        </div>
      ) : null}

      {mobile ? (
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 14,
            padding: 14,
            boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
            color: "#cbd5e1",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>AR Compare</div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            Opening AR with your selected fruits. If it does not open automatically, tap below.
          </div>
          <button
            onClick={() => {
              const models = items
                .map((item) => (item.fruit?.modelPath || "/models/Apple.glb").replace(/^\//, ""))
                .join(",");
              const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
              const target = `${base}/ar-multi.html?models=${encodeURIComponent(models)}`;
              try {
                sessionStorage.setItem("nutrixr-ar-compare", JSON.stringify(items));
              } catch (err) {
                console.warn("Failed to persist ar-compare payload", err);
              }
              window.location.assign(target);
            }}
            style={{
              border: "none",
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              color: "#fff",
              padding: "12px 14px",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            Open AR
          </button>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            Mobile AR launches one viewer; align fruits in your space together.
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}
        >
          <div
            style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: 10,
              borderRadius: 10,
              fontWeight: 700
            }}
          >
            AR is not supported on desktop. Showing 3D preview with nutrient nodes instead.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 12
            }}
          >
            {items.map((item) => (
              <div
                key={item.fruit?.id || item.fruit?.name}
                style={{
                  background: "#0f172a",
                  border: "1px solid #1f2937",
                  borderRadius: 12,
                  padding: 10,
                  minHeight: 380
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 24 }}>{item.fruit?.emoji || "🍎"}</span>
                  <div style={{ fontWeight: 800 }}>{item.fruit?.name || "Fruit"}</div>
                </div>
                <div style={{ height: 340 }}>
                  <Scene
                    fruit={item.fruit}
                    sliceMode={false}
                    nutrients={item.nutrients || []}
                    selectedNutrient={null}
                    onSelectNutrient={() => {}}
                    backgroundColor="#0f172a"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
