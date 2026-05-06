import React from 'react';

function FruitSelector({ fruits, selectedFruit, onSelect }) {
  const fruitEmojis = {
    apple: '🍎',
    banana: '🍌',
    orange: '🍊',
    kiwi: '🥝',
    mango: '🥭',
    grapes: '🍇',
    grape: '🍇',
    strawberry: '🍓',
    pineapple: '🍍',
    papaya: '🥭',
    watermelon: '🍉',
    pear: '🍐',
    peach: '🍑',
    blueberries: '🫐',
    blueberry: '🫐',
    raspberry: '🍓',
    blackberry: '🍇',
    lemon: '🍋',
    lime: '🍋',
    cherry: '🍒',
    cherries: '🍒',
    plum: '🍑',
    apricot: '🍑'
  };

  return (
    <div className="fruit-selector">
      <h3 className="fruit-selector-title">🥙 Fruits</h3>
      <div className="fruit-cards">
        {fruits.length === 0 && (
          <div className="no-fruits">No fruits found 🍃</div>
        )}

        {fruits.map((fruit, index) => (
          <button
            key={fruit.id}
            className={`fruit-card ${selectedFruit?.id === fruit.id ? 'active' : ''}`}
            onClick={() => onSelect(fruit)}
            type="button"
            title={fruit.name}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span className="fruit-card-emoji">
              {fruitEmojis[fruit.id.toLowerCase()] || '🍎'}
            </span>
            <span className="fruit-name">{fruit.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FruitSelector;
