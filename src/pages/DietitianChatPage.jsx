import { useNavigate } from "react-router-dom";
import DietitianChat from "../components/DietitianChat";

function DietitianChatPage() {

  const navigate = useNavigate();

  return (
    <>
      <div style={navbar}>
        
  <button
    style={backBtn}
    onClick={() => navigate(-1)}
  >
    ← Back
  </button>

  <div style={navCenter}>
    <div style={navTitle}>
      Dietitian Bot
    </div>

    <div style={navSubtitle}>
      Your AI nutrition assistant
    </div>
  </div>

  {/* ✅ Fruit emoji */}
  <div style={navIcon}>
    🥗
  </div>

</div>

      {/* Chat */}
      <div style={{ height: "calc(100vh - 72px)" }}>
        <DietitianChat mode="page" />
      </div>

    </>
  );
}

export default DietitianChatPage;


/* ===== STYLES ===== */

const navbar = {
  height: 72,
  background: "linear-gradient(90deg, #0f172a, #1e293b)", // ✅ same as recipe
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

const navIcon = {
  fontSize: 28   // emoji size
};