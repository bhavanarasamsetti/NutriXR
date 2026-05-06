import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Scene from "../components/Scene.jsx";
import { getFruitNutrition } from "../api/wikidata";
import "./DesktopViewer.css";

function loadSelectedId() {
  try {
    return sessionStorage.getItem("nutrixr-selected-fruit");
  } catch {
    return null;
  }
}

export default function DesktopViewer() {
  const navigate = useNavigate();
  const [fruit, setFruit] = useState(null);
  const [nutrients, setNutrients] = useState([]);
  const [selectedNutrient, setSelectedNutrient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const modules = import.meta.glob("../data/*.js");
      const inlineKey = Object.keys(modules).find((k) => k.endsWith("fruits.inline.js"));
      const imagesKey = Object.keys(modules).find((k) => k.endsWith("fruits.images.js"));
      const fallbackKey = Object.keys(modules).find((k) => k.endsWith("fruits.js"));
      let mod = null;
      if (inlineKey) {
        mod = await modules[inlineKey]();
      } else if (imagesKey) {
        mod = await modules[imagesKey]();
      } else if (fallbackKey) {
        mod = await modules[fallbackKey]();
      } else {
        mod = { default: [] };
      }
      if (!active) return;
      const list = mod.default || [];
      const stored = loadSelectedId();
      const match = stored
        ? list.find((item) => item.id === stored || item.name === stored)
        : null;
      setFruit(match || list[0] || null);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadNutrition() {
      if (!fruit?.name) return;
      setLoading(true);
      try {
        const data = await getFruitNutrition(fruit.name);
        if (!active) return;
        setNutrients(data?.nutrients || []);
      } catch (err) {
        console.warn("Failed to load nutrition data", err);
        if (active) setNutrients([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadNutrition();
    return () => {
      active = false;
    };
  }, [fruit]);

  return (
    <div className="desktop-viewer">
      <header className="desktop-viewer__nav">
        <button type="button" className="viewer-ghost" onClick={() => navigate("/dashboard")}>
          {"<"} Back
        </button>
        <div className="desktop-viewer__title">NutriXR Viewer</div>
      </header>

      <div className="desktop-viewer__panel">
        {fruit ? (
          <div className="desktop-viewer__scene">
            <Scene
              fruit={fruit}
              sliceMode={false}
              nutrients={nutrients}
              selectedNutrient={selectedNutrient}
              onSelectNutrient={setSelectedNutrient}
              backgroundColor="#0f172a"
            />
            {loading ? <div className="desktop-viewer__loading">Loading nutrition data...</div> : null}
          </div>
        ) : (
          <div className="desktop-viewer__empty">
            No fruit selected. Go back and choose a fruit from the dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
