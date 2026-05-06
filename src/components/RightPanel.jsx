import { useNavigate } from "react-router-dom";

export default function RightPanel() {
  const navigate = useNavigate();

  return (
    <aside className="quick-actions">
      <h4>Quick Actions</h4>

      <div className="quick-grid">

        {/* Compare */}
        <button
          className="compare"
          type="button"
          onClick={() => navigate("/compare")}
        >
          <span className="qa-icon">🔀</span>
          <span>Compare</span>
        </button>

        {/* Recipe */}
        <button
          className="recipe"
          type="button"
          onClick={() => navigate("/recipe")}
        >
          <span className="qa-icon">🍝</span>
          <span>Recipe</span>
        </button>

        {/* Breakfast */}
        <button
          className="breakfast"
          type="button"
          onClick={() => navigate("/slice")}
        >
          <span className="qa-icon">🔪</span>
          <span>Slicing</span>

        </button>

        {/* AR Mode */}
        <button
          className="ar"
          type="button"
          onClick={() => navigate("/ar")}
        >
          <span className="qa-icon">📱</span>
          <span>AR Mode</span>
        </button>

        {/* Yoga Hub */}
        <button
          className="yoga"
          type="button"
          onClick={() => navigate("/yoga")}
        >
          <span className="qa-icon">🧘‍♀️</span>
          <span>Yoga Hub</span>
        </button>

      </div>

      <div className="card tip">
        <h4>💚 Today's Tip</h4>
        <p>
          Eating a variety of colorful fruits ensures you get different vitamins
          and antioxidants. Aim for at least 2–3 servings daily!
        </p>
      </div>
    </aside>
  );
}
