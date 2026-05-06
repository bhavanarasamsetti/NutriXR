import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateRecipe } from "../data/recipes";
import "./RecipePage.css";

export default function RecipePage() {

  const navigate = useNavigate();

  const [fruits, setFruits] = useState([]);
  const [selectedRecipeFruits, setSelectedRecipeFruits] = useState([]);
  const [recipeType, setRecipeType] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  /* ================= LOAD FRUITS ================= */

  useEffect(() => {

    async function loadFruits() {

      const modules = import.meta.glob("../data/*.js");

      const key = Object.keys(modules)
        .find(k => k.includes("fruits"));

      if (!key) return;

      const mod = await modules[key]();

      setFruits(mod.default || []);

    }

    loadFruits();

  }, []);


  /* ================= TOGGLE FRUIT ================= */

  const toggleFruit = (fruitId) => {

    setSelectedRecipeFruits(prev =>

      prev.includes(fruitId)
        ? prev.filter(f => f !== fruitId)
        : [...prev, fruitId]

    );

  };


  /* ================= GENERATE RECIPE ================= */

  const handleGenerateRecipe = async () => {

    setIsGenerating(true);

    try {
      const fruitNames = selectedRecipeFruits
        .map((id) => fruits.find((fruit) => fruit.id === id)?.name)
        .filter(Boolean);

      const response = await fetch('/recipe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fruits: fruitNames,
          recipeType
        })
      });

      if (!response.ok) {
        throw new Error('Recipe generation failed');
      }

      const data = await response.json();
      const recipe =
        data?.recipe ||
        generateRecipe(
          selectedRecipeFruits,
          recipeType
        );

      setIsGenerating(false);

      if (!recipe) return;

      /* ✅ CRITICAL FIX — SAVE RECIPE */

      sessionStorage.setItem(
        "nutrixr-last-recipe",
        JSON.stringify(recipe)
      );

      /* ✅ NAVIGATE */

      navigate("/recipe/result", {
        state: recipe
      });
    } catch (error) {
      const fallback =
        generateRecipe(
          selectedRecipeFruits,
          recipeType
        );

      setIsGenerating(false);

      if (!fallback) return;

      sessionStorage.setItem(
        "nutrixr-last-recipe",
        JSON.stringify(fallback)
      );

      navigate("/recipe/result", {
        state: fallback
      });
    }
  };


  /* ================= UI ================= */

  return (

    <>
      {/* NAVBAR */}

      <div style={navbar}>

        <button
          style={backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <div style={navCenter}>

          <div style={navTitle}>
            Recipe Generator
          </div>

          <div style={navSubtitle}>
            Create healthy recipes using your selected fruits
          </div>

        </div>

        <div style={navRight}>
        <div style={{
  fontSize: 28,
  
  padding: 8,
  borderRadius: 999
}}>
  🥗
</div>
        </div>

      </div>


      {/* CONTENT */}

      <div style={pageWrapper}>

        <div style={content}>

          {/* RECIPE TYPE */}

          <h3>Recipe Type</h3>

          <div style={typeRow}>

            {[
              { id: "smoothie", label: "Smoothie", emoji: "🥤" },
              { id: "fruit_bowl", label: "Fruit Salad", emoji: "🍇" },
              { id: "dessert", label: "Dessert", emoji: "🍰" }
            ].map(type => (

              <button
                key={type.id}
                onClick={() => setRecipeType(type.id)}
                style={{
                  ...typeButton,
                  background:
                    recipeType === type.id
                      ? "#6d28d9"
                      : "#f3f4f6",
                  color:
                    recipeType === type.id
                      ? "#fff"
                      : "#111827",
                  border:
                    recipeType === type.id
                      ? "2px solid #6d28d9"
                      : "1px solid #e5e7eb"
                }}
              >

                <span style={recipeTypeEmoji}>
                  {type.emoji}
                </span>

                {type.label}

              </button>

            ))}

          </div>


          {/* FRUITS */}

          <h3>
            Select Fruits ({selectedRecipeFruits.length})
          </h3>

          <div style={fruitGrid}>

            {fruits.map(fruit => {

              const selected =
                selectedRecipeFruits.includes(fruit.id);

              return (

                <button
                  key={fruit.id}
                  onClick={() => toggleFruit(fruit.id)}
                  style={{
                    ...fruitTile,
                    border:
                      selected
                        ? "2px solid #a78bfa"
                        : "2px solid transparent",
                    boxShadow:
                      selected
                        ? "0 6px 18px rgba(167,139,250,0.35)"
                        : "none"
                  }}
                >

                  <div style={fruitEmoji}>
                    {fruit.emoji || "🍎"}
                  </div>

                  <div style={{ fontWeight: 700 }}>
                    {fruit.name}
                  </div>

                </button>

              );

            })}

          </div>


          {/* BUTTON */}

          <div style={actions}>

            <button
              style={primaryBtn}
              disabled={
                selectedRecipeFruits.length < 2 ||
                !recipeType ||
                isGenerating
              }
              onClick={handleGenerateRecipe}
            >

              <span style={btnEmoji}>
                {isGenerating ? "⏳" : "✨"}
              </span>

              {isGenerating
                ? "Creating..."
                : "Generate Recipe"}

            </button>

          </div>

        </div>

      </div>

    </>

  );

}


/* ================= STYLES ================= */

const pageWrapper = {
  minHeight: "100vh",
  background: "#fff",
  paddingTop: 24
};

const content = {
  maxWidth: 1200,
  margin: "32px auto",
  padding: "0 24px"
};

const typeRow = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 24
};

const typeButton = {
  borderRadius: 12,
  padding: 14,
  fontWeight: 700,
  cursor: "pointer"
};

const fruitGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 14,
  marginBottom: 28
};

const fruitTile = {
  background: "#F8FAFC",
  borderRadius: 14,
  padding: 14,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  minWidth: 130
};

const actions = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 32
};

const primaryBtn = {
  background:
    "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#fff",
  border: "none",
  padding: "14px 32px",
  borderRadius: 14,
  fontWeight: 700,
  cursor: "pointer"
};

const btnEmoji = {
  fontSize: 22,
  marginRight: 10
};

const recipeTypeEmoji = {
  fontSize: 26,
  marginRight: 10
};

const fruitEmoji = {
  fontSize: 36
};

const navbar = {
  height: 72,
  background: "linear-gradient(90deg, #0f172a, #1e293b)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",

  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  padding: "0 24px",

  position: "sticky",
  top: 0,
  zIndex: 100,

  color: "#ffffff"
};

const backBtn = {
  border: "none",
  background: "transparent",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  color: "#ffffff"
};

const navCenter = {
  textAlign: "center"
};
const navTitle = {
  fontWeight: 700,
  fontSize: 18,
  color: "#ffffff"
};

const navSubtitle = {
  fontSize: 13,
  color: "rgba(255,255,255,0.7)"
};


const navRight = {
  display: "flex",
  alignItems: "center",
  gap: 12
};
