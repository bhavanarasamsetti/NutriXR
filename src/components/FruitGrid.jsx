import FruitCard from "./FruitCard";

export default function FruitGrid({ fruits, selectedFruit, onSelect, onOpenAR }) {
  if (!fruits.length) {
    return (
      <div className="fruit-grid">
        <div className="fruit-card empty-card">
          <div className="fruit-image-wrapper">
            <span className="empty-icon">🍃</span>
          </div>

          <div className="fruit-info">
            <h4>No fruits found</h4>
            <p>Try a different search or category</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fruit-grid">
      {fruits.map(fruit => (
        <FruitCard
          key={fruit.id}
          fruit={fruit}
          isSelected={selectedFruit?.id === fruit.id}
          onSelect={() => onSelect(fruit)}
          onOpenAR={onOpenAR}
        />
      ))}
    </div>
  );
}
