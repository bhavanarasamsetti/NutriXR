import { useLocation, useNavigate } from "react-router-dom";
import "./RecipePage.css";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

export default function RecipeResultPage() {

  const navigate = useNavigate();
  const location = useLocation();

  /* ✅ CRITICAL FIX — GET RECIPE FROM STATE OR SESSION */

  const recipe =
    location.state ||
    JSON.parse(
      sessionStorage.getItem("nutrixr-last-recipe")
    );

  /* ================= SAFETY ================= */

  if (!recipe) {
    return (
      <div style={page}>
        <h2>No recipe found</h2>

        <button
          style={primaryBtn}
          onClick={() => navigate("/recipe")}
        >
          Go Back
        </button>

      </div>
    );
  }


  /* ================= AR MODE ================= */

  const openARMode = () => {

    const primaryFruit =
      recipe.fruits?.[0] || "Apple";

    const modelPath =
      `/models/${primaryFruit}.glb`;

    sessionStorage.setItem(
      "nutrixr-ar-payload",
      JSON.stringify({
        fruit: {
          name: primaryFruit,
          modelPath
        }
      })
    );

    sessionStorage.setItem(
      "nutrixr-recipe-payload",
      JSON.stringify(recipe)
    );

    window.location.assign(
      `/recipe-ar.html?model=${primaryFruit}.glb`
    );

  };


  /* ================= EXPORT PDF ================= */

  const exportAsPDF = async () => {

  const node = document.getElementById("recipe-export-area");
  if (!node) return;

  try {

    const dataUrl = await htmlToImage.toPng(node, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true
    });

    const pdf = new jsPDF("p", "mm", "a4");

    const imgProps = pdf.getImageProperties(dataUrl);

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(
      dataUrl,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight
    );

    heightLeft -= pdfHeight;

    // Extra pages if needed
    while (heightLeft > 0) {

      position = heightLeft - imgHeight;

      pdf.addPage();

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pdfHeight;

    }

    pdf.save(`${recipe.title}.pdf`);

  } catch (error) {

    console.error(error);
    alert("Export failed");

  }
};

  /* ================= UI ================= */

  return (

    <>

      {/* NAVBAR */}

      <div style={navbar}>

        <button
          style={backBtn}
          onClick={() => navigate("/recipe")}
        >
          ← Back
        </button>

        <div style={navCenter}>

          <div style={navTitle}>
            Recipe Generator
          </div>

          <div style={navSubtitle}>
            Your personalized fruit-based recipe
          </div>

        </div>

        <div style={navRight}>

           <button style={arBtn} onClick={openARMode}>
      AR Mode
    </button>

    <button style={exportBtn} onClick={exportAsPDF}>
      ↓ Export
    </button>
    <div style={navIcon}>
      🥗
    </div>

        </div>

      </div>


      {/* CONTENT */}

      <div
        style={page}
        id="recipe-export-area"
      >

        {/* HEADER */}

        <div style={centerHeader}>

          <h1 style={title}>
            {recipe.title}
          </h1>

          <p style={description}>
            {recipe.description}
          </p>

          <div style={meta}>

            <span>
              ⏱ {recipe.time} min
            </span>

            <span>
              👥 {recipe.servings} servings
            </span>

          </div>

        </div>


        {/* GRID */}

        <div style={twoColumnGrid}>

          {/* INGREDIENTS */}

          <div style={ingredientCard}>

            <h3>Ingredients</h3>

            <ul style={ingredientList}>

              {recipe.ingredients.map(
                (item, i) => (

                  <li
                    key={i}
                    style={ingredientItem}
                  >
                    • {item}
                  </li>

                )
              )}

            </ul>

          </div>


          {/* STEPS */}

          <div style={instructionCard}>

            <h3>Instructions</h3>

            {recipe.steps.map(
              (step, i) => (

                <div
                  key={i}
                  style={stepRow}
                >

                  <div style={stepNum}>
                    {i + 1}
                  </div>

                  <div style={stepText}>
                    {step}
                  </div>

                </div>

              )
            )}

          </div>

        </div>


        {/* ACTIONS */}

        <div style={actions}>

          <button
            style={ghostBtn}
            onClick={() => navigate("/recipe")}
          >
            Create Another
          </button>

          <button
            style={primaryBtn}
            onClick={() => navigate("/dashboard")}
          >
            Done
          </button>

        </div>

      </div>

    </>

  );

}


/* ================= STYLES ================= */

const page = {
  minHeight: "100vh",
  background: "#ffffff",
  padding: "32px"
};

const centerHeader = {
  textAlign: "center",
  marginBottom: 40
};

const title = {
  fontSize: 30,
  fontWeight: 800
};

const description = {
  color: "#374151"
};

const meta = {
  display: "flex",
  gap: 20,
  justifyContent: "center",
  marginTop: 10
};

const twoColumnGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 32
};

const ingredientCard = {
  background: "#ede9fe",
  borderRadius: 18,
  padding: 24
};

const instructionCard = {
  background: "#fff7ed",
  borderRadius: 18,
  padding: 24
};

const ingredientList = {
  listStyle: "none",
  padding: 0
};

const ingredientItem = {
  marginBottom: 8
};

const stepRow = {
  display: "flex",
  gap: 12,
  marginBottom: 12,
  alignItems: "flex-start"  
};

const stepNum = {
  width: 30,
  height: 30,
  minWidth: 36,     
  minHeight: 36,
  borderRadius: "50%",
  background: "#7c3aed",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 14,
  flexShrink: 0, 
};

const stepText = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.5,
  flex: 1
};

const actions = {
  marginTop: 40,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 16
};

const ghostBtn = {
  background: "#ffffff",
  color: "#111827",
  border: "2px solid #e5e7eb",
  borderRadius: 999,
  padding: "14px 28px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
};

const primaryBtn = {
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#ffffff",
  border: "none",
  borderRadius: 999,
  padding: "14px 28px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(124,58,237,0.35)"
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

  color: "#fff"
};

const backBtn = {
  border: "none",
  background: "transparent",
  color: "#fff",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer"
};

const navCenter = {
  textAlign: "center"
};

const navTitle = {
  fontWeight: 700,
  fontSize: 18,
  color: "#fff"
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

const arBtn = {
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  color: "#fff",
  border: "none",
  padding: "8px 18px",
  borderRadius: 999,
  fontWeight: 600,
  cursor: "pointer"
};

const exportBtn = {
  background: "#fff",
  color: "#111827",
  border: "none",
  padding: "8px 18px",
  borderRadius: 999,
  fontWeight: 600,
  cursor: "pointer"
};
const navIcon = {

  padding: 8,
  borderRadius: 999,
  fontSize: 28
};