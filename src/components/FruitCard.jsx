export default function FruitCard({
  fruit,
  isSelected,
  onSelect,
  onOpenAR
}) {
  return (
    <div
      className={`fruit-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="fruit-image-wrapper">
        {fruit.image ? (
          <img src={fruit.image} alt={fruit.name} className="fruit-image" />
        ) : (
          <span className="fruit-icon">{fruit.emoji}</span>
        )}
      </div>

      <div className="fruit-info">
        <h4>{fruit.name}</h4>
        <p>per 100g serving</p>

        <div className="fruit-footer">
          <span className="view-link">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            View +
          </span>
        </div>
      </div>

      <button
        className="ar-open-btn"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (onOpenAR) onOpenAR(fruit);
        }}
      >
        {"Open in AR →"}
      </button>
    </div>
  );
}
