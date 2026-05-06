import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getFruitNutrition } from "../api/wikidata";
import "./FruitCompare.css";


const DEMO_FRUITS = [
  "Apple",
  "Avocado",
  "Banana",
  "Coconut",
  "Blueberries",
  "Cherry",
  "Grapes",
  "Green Apple",
  "Grapefruit",
  "Kiwi",
  "Lemon",
  "Orange",
  "Plum",
  "Papaya",
  "Pineapple",
  "Strawberry",
  "Raspberry",
  "Watermelon"

];

const order = [
  "calories",
  "energy",
  "protein",
  "carbohydrate",
  "carbohydrates",
  "fiber",
  "sugar",
  "vitamin c",
  "vitamin a",
  "potassium",
  "iron",
  "calcium"
];

const colors = {
  calories: "#f97316",
  energy: "#f97316",
  protein: "#2563eb",
  carbohydrate: "#f59e0b",
  carbohydrates: "#f59e0b",
  fiber: "#16a34a",
  sugar: "#ec4899",
  "vitamin c": "#eab308",
  "vitamin a": "#a855f7",
  potassium: "#6366f1",
  iron: "#ef4444",
  calcium: "#06b6d4",
  default: "#94a3b8"
};

const norm = (v = "") => String(v || "").trim().toLowerCase();

const fmt = (val) => {
  if (typeof val === "number") {
    if (Math.abs(val) >= 100) return Math.round(val);
    return Number(val).toFixed(1);
  }
  if (val == null || val === "") return "--";
  return String(val);
};

const pickColor = (name = "") => colors[norm(name)] || colors.default;

const sorted = (keys) =>
  [...keys].sort((a, b) => {
    const ai = order.indexOf(norm(a));
    const bi = order.indexOf(norm(b));
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

const mergeKeys = (list) => {
  const set = new Map();
  list.forEach((n) => set.set(norm(n?.name), n?.name));
  return Array.from(set.values());
};

const findFruitMeta = (fruits, name) => fruits.find((f) => f.name === name) || { emoji: "🍎", name };

const extractCalories = (nutrients = []) => {
  const energy = nutrients.find((n) => norm(n.name).includes("energy") || norm(n.unit) === "kcal");
  return energy?.amount ? fmt(energy.amount) : "--";
};

function Trend({ a, b }) {
  if (typeof a !== "number" || typeof b !== "number") return null;
  if (!a) return null;
  const up = b >= a * 0.99;
  return <span className={`trend ${up ? "up" : "down"}`}>{up ? "↗" : "↘"}</span>;
}

function ValueBar({ amount, max, color }) {
  const pct = Math.max(0, Math.min(100, max ? (amount / max) * 100 : 0));
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function FruitCompare() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const maxCompare = 3;

  const [fruits, setFruits] = useState([]);
  const [compareFruits, setCompareFruits] = useState([]);
  const [nutritionMap, setNutritionMap] = useState({});
  const [showSelector, setShowSelector] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

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
        const defaults = [list[0]?.name, list[1]?.name].filter(Boolean);
        setCompareFruits(defaults); 

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
    const pending = compareFruits.filter((name) => !nutritionMap[name]?.nutrients && !nutritionMap[name]?.loading);
    if (!pending.length) return;

    pending.forEach((name) => {
      setNutritionMap((prev) => ({ ...prev, [name]: { ...(prev[name] || {}), loading: true, error: "" } }));
      getFruitNutrition(name)
        .then((data) => {
          setNutritionMap((prev) => ({
            ...prev,
            [name]: { loading: false, error: "", nutrients: data?.nutrients || [] }
          }));
        })
        .catch((err) => {
          setNutritionMap((prev) => ({
            ...prev,
            [name]: { loading: false, error: err?.message || "Failed to load nutrition.", nutrients: [] }
          }));
        });
    });
  }, [compareFruits, nutritionMap]);

  const allNutrients = useMemo(() => {
    const merged = compareFruits.flatMap((name) => nutritionMap[name]?.nutrients || []);
    return sorted(mergeKeys(merged));
  }, [compareFruits, nutritionMap]);

  const addFruit = (name) => {
    if (!name || compareFruits.includes(name) || compareFruits.length >= maxCompare) return;
    setCompareFruits((prev) => [...prev, name]);
    setShowSelector(false);
    setActiveSlot(null);
  };

  const replaceFruit = (index, name) => {
    if (index == null || index < 0) return;
    if (!name) return;
    if (compareFruits.includes(name) && compareFruits[index] !== name) return;
    setCompareFruits((prev) => prev.map((fruit, idx) => (idx === index ? name : fruit)));
    setShowSelector(false);
    setActiveSlot(null);
  };

  const openSelector = (index = null) => {
    setActiveSlot(index);
    setShowSelector(true);
  };

  const removeFruit = (name) => {
    setCompareFruits((prev) => prev.filter((f) => f !== name));
  };

  const getNutrientsFor = (name) => nutritionMap[name]?.nutrients || [];
  const getCalories = (name) => extractCalories(getNutrientsFor(name));

  const getValue = (fruitName, nutrientName) => {
    const n = getNutrientsFor(fruitName).find((x) => norm(x.name) === norm(nutrientName));
    return n?.amount;
  };

  const getUnit = (fruitName, nutrientName) =>
    getNutrientsFor(fruitName).find((x) => norm(x.name) === norm(nutrientName))?.unit || "";

  const maxPerRow = (nutrientName) => {
    const vals = compareFruits
      .map((f) => getValue(f, nutrientName))
      .filter((v) => typeof v === "number");
    if (!vals.length) return 0;
    return Math.max(...vals);
  };

  const handleExportPdf = async () => {
    if (!pageRef.current) return;

    const canvas = await html2canvas(pageRef.current, {
      scale: 2,
      backgroundColor: "#f6f9fc",
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let remainingHeight = imgHeight;
    let position = 0;

    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;
      if (remainingHeight > 0) {
        pdf.addPage();
        position -= pageHeight;
      }
    }

    pdf.save("nutrixr-fruit-compare.pdf");
  };

  return (
    <div className="compare-page" ref={pageRef}>
      <header className="compare-nav">
        <div className="nav-left">


          <button className="nav-back" onClick={() => navigate("/dashboard")}> 

    
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
                  d="M12 3l1.6 4.6 4.8.1-3.8 2.8 1.4 4.5-4-2.7-4 2.7 1.4-4.5-3.8-2.8 4.8-.1L12 3z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Fruit Comparison
          </div>
        </div>
        <div className="nav-actions">
          <button className="pill ghost" onClick={handleExportPdf}>
            <span className="pill-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 4v10m0 0l-4-4m4 4l4-4M4 20h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Export
          </button>
          <button
            className="pill primary"
            onClick={() => {
              const payload = compareFruits.map((name) => ({
                fruit: findFruitMeta(fruits, name),
                nutrients: nutritionMap[name]?.nutrients || []
              }));
              try {
                sessionStorage.setItem("nutrixr-ar-compare", JSON.stringify(payload));
              } catch (err) {
                console.warn("Failed to persist AR compare payload", err);
              }
              const models = payload
                .map((item) => (item.fruit?.modelPath || "/models/Apple.glb").replace(/^\//, ""))
                .join(",");
              const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
              const target = `${base}/ar-multi.html?models=${encodeURIComponent(models)}`;
              window.location.assign(target);
            }}
            disabled={!compareFruits.length}
          >
            <span className="pill-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 5v5m0 0h5m-5 0H7m9-4a7 7 0 11-9.9 9.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            AR Compare
          </button>
        </div>
      </header>

      <section className="compare-hero">
        {compareFruits.map((name, index) => {
          const meta = findFruitMeta(fruits, name);
          const loading = nutritionMap[name]?.loading;
          const error = nutritionMap[name]?.error;
          return (
            <div
              className="fruit-card selectable"
              role="button"
              tabIndex={0}
              key={name}
              onClick={() => openSelector(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openSelector(index);
                }
              }}
            >
              <div className="fruit-card-top">
                <span className="fruit-avatar">{meta.emoji || "🍎"}</span>
                <div>
                  <div className="fruit-name">{meta.name || "Select fruit"}</div>
                  <div className="fruit-sub">{getCalories(name)} kcal</div>
                </div>
              </div>
              {loading ? <div className="loading-text">Loading nutrition...</div> : null}
              {error ? <div className="error-text">{error}</div> : null}
            </div>
          );
        })}
        <button
          type="button"
          className="fruit-card add-card"
          onClick={() => openSelector(null)}
          disabled={compareFruits.length >= maxCompare}
        >
          <div className="add-dot">+</div>
          <div className="add-text">Add fruit</div>
          <div className="add-sub">
            {compareFruits.length >= maxCompare ? "Maximum 3 fruits at a time" : "Pick another fruit to compare"}
          </div>
        </button>
      </section>

      <section className="compare-board">
        <div className="board-head">
          <div className="board-title">Nutrient</div>
          <div className="board-fruits">
            {compareFruits.map((name, index) => {
              const meta = findFruitMeta(fruits, name);
              return (
                <div className="board-fruit" key={name}>
                  <span className="fruit-avatar small">{meta.emoji || "🍎"}</span>
                  <div>
                    <div className="fruit-name">{name}</div>
                    <div className="fruit-sub">per 100g</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="nutrient-rows">
          {allNutrients.length === 0 ? (
            <div className="empty">No nutrition data yet.</div>
          ) : (
            allNutrients.map((name) => {
              const maxVal = maxPerRow(name) || 1;
              const color = pickColor(name);
              const unit = compareFruits
                .map((fruitName) => getUnit(fruitName, name))
                .find((u) => u && u.trim()) || "";
              return (
                <div className="nutrient-row" key={name}>
                  <div className="nutrient-label">
                    <div className="nutrient-name">{name}</div>
                    <div className="nutrient-unit">{unit}</div>
                  </div>
                  <div className="nutrient-values">
                    {compareFruits.map((fruitName) => {
                      const amount = getValue(fruitName, name);
                      const unit = getUnit(fruitName, name);
                      return (
                        <div className="nutrient-value" key={fruitName + name}>
                          <div className="value-cell">
                            <span className="value-number">{fmt(amount)}</span>
                            <Trend a={maxVal} b={amount} />
                          </div>
                          <ValueBar amount={amount || 0} max={maxVal} color={color} />
                          <div className="unit-label">{unit}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {showSelector && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Select a Fruit</div>
              <button className="modal-close" onClick={() => {
                  setShowSelector(false);
                  setActiveSlot(null);
                }}>
                ×
              </button>
            </div>
            <div className="modal-grid">
              {fruits.map((fruit) => {
                const isTaken = compareFruits.includes(fruit.name);
                const isCurrent = activeSlot != null && compareFruits[activeSlot] === fruit.name;
                const shouldDisable =
                  activeSlot == null
                    ? isTaken || compareFruits.length >= maxCompare
                    : isTaken && !isCurrent;
                return (
                  <button
                    key={fruit.id || fruit.name}
                    className="modal-fruit"
                    onClick={() => {
                      if (activeSlot != null) {
                        replaceFruit(activeSlot, fruit.name);
                      } else {
                        addFruit(fruit.name);
                      }
                    }}
                    disabled={shouldDisable}
                  >
                    <div className="modal-fruit-icon">{fruit.emoji || "🍎"}</div>
                    <div className="modal-fruit-name">{fruit.name}</div>
                    <div className="modal-fruit-sub">{getCalories(fruit.name)} kcal</div>
                  </button>
                );
              })}
            </div>
            {compareFruits.length >= maxCompare ? (
              <div className="modal-note">You can compare up to 3 fruits at once. Remove one to add another.</div>
            ) : null}
            <button className="modal-cancel" onClick={() => {
                  setShowSelector(false);
                  setActiveSlot(null);
                }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
