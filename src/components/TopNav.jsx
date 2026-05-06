import { useNavigate, NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function TopNav() {

  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();

  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Compare", to: "/compare" },
    { label: "Slicing", to: "/slice" },
    { label: "Yoga Hub", to: "/yoga" },
    { label: "Recipes", to: "/recipe" },
    { label: "Community", to: "/community" },
    { label: "Health", to: "/health" },
    { label: "Chat", to: "/chat" },
    { label: "Semantic Graph", to: "/semantic-filter" }
  ];

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (
      (first + last).toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      "?"
    );
  };

  return (
    <header className="topbar">

      {/* LEFT */}
      <div className="topbar-left">
        <div
          className="logo"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <img
            src="/icons/appleicon.jpeg"
            alt="NutriXR Apple Icon"
            className="viewer-logo"
          />
          <span className="logo-text">NutriXR</span>
        </div>
      </div>

      {/* CENTER */}
      <div className="topbar-center">

        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `nav-item${isActive ? " active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}

      </div>

      {/* RIGHT */}
      <div className="topbar-right">

        {isAuthenticated ? (

          <button
            onClick={() => navigate("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(15,23,42,0.6)",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700"
              }}
            >
              {getInitials()}
            </span>

            Profile

          </button>

        ) : (

          <div style={{ display: "flex", gap: "12px" }}>

            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              style={{
                padding: "8px 16px",
                background:
                  "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Sign Up
            </button>

          </div>

        )}

      </div>

    </header>
  );
}
