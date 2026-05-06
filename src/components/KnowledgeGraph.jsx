import React, { useMemo, useState } from 'react';

const categoryConfig = {
  'Vitamins': { color: '#3B82F6', icon: '💊' },
  'Minerals': { color: '#EC4899', icon: '⛏️' },
  'Macros': { color: '#F59E0B', icon: '🌾' },
  'Other': { color: '#6B7280', icon: '📊' }
};

const nutrientEmojis = {
  protein: '🥚',
  carb: '🌾',
  fat: '🥑',
  fiber: '🌿',
  vitamin: '💊',
  mineral: '⛏️',
  energy: '⚡',
  sugar: '🍯',
  calcium: '🥛',
  iron: '🥩',
  potassium: '🍌',
  magnesium: '✨',
  default: '📊'
};

function getEmojiForNutrient(nutrientName) {
  const lower = nutrientName.toLowerCase();
  for (const [key, emoji] of Object.entries(nutrientEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return nutrientEmojis.default;
}

function categorizeNutrient(nutrient) {
  const name = nutrient.name.toLowerCase();
  if (name.includes('vitamin')) return 'Vitamins';
  if (name.includes('mineral') || name.includes('calcium') || name.includes('iron') || name.includes('potassium') || name.includes('magnesium')) return 'Minerals';
  if (name.includes('energy') || name.includes('calorie')) return 'Macros';
  if (name.includes('fiber') || name.includes('fibre')) return 'Fiber';
  if (name.includes('protein') || name.includes('carb') || name.includes('fat') || name.includes('sugar')) return 'Macros';
  return 'Other';
}

function KnowledgeGraph({ nutrients, selectedNutrient, onClose, fruitName = 'Fruit', fruitEmoji = '🍌' }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeNutrient, setActiveNutrient] = useState(null);

  // Group nutrients by category
  const groupedNutrients = useMemo(() => {
    const groups = {};
    nutrients.forEach((nutrient) => {
      const category = categorizeNutrient(nutrient);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ ...nutrient, category });
    });
    return groups;
  }, [nutrients]);

  // Get list of active categories (non-empty)
  const activeCategories = Object.keys(groupedNutrients);
  const currentNutrients = activeCategory ? groupedNutrients[activeCategory] || [] : [];

  // Calculate positions for nodes in a circular ring
  const calculateNodePosition = (index, total, radius) => {
    const angleStep = (Math.PI * 2) / Math.max(total, 3);
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  const handleCategoryClick = (category) => {
    if (activeCategory === category) {
      setActiveCategory(null);
      setActiveNutrient(null);
    } else {
      setActiveCategory(category);
      setActiveNutrient(null);
    }
  };

  const handleNutrientClick = (nutrient) => {
    setActiveNutrient(nutrient.id === activeNutrient ? null : nutrient.id);
  };

  const selectedNutrientData = currentNutrients.find(n => n.id === activeNutrient);

  return (
    <div className="knowledge-graph-overlay" onClick={onClose}>
      <div className="knowledge-graph-container" onClick={(e) => e.stopPropagation()}>
        <div className="knowledge-graph-header">
          <h3>{fruitEmoji} {fruitName} Nutrition</h3>
          <button type="button" className="knowledge-graph-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="knowledge-graph-canvas">
          {/* Center Fruit Node */}
          <div className="fruit-node-container">
            <div className="fruit-node">
              {fruitEmoji}
            </div>
          </div>

          {/* Category Ring (visible when no category selected) */}
          {!activeCategory && (
            <svg className="ring-layout" viewBox="0 0 400 400">
              {activeCategories.map((category, index) => {
                const config = categoryConfig[category] || categoryConfig['Other'];
                const pos = calculateNodePosition(index, activeCategories.length, 120);
                const x = 200 + pos.x;
                const y = 200 + pos.y;

                return (
                  <g key={category} className="category-ring-node">
                    {/* Connection line */}
                      <line
                      x1="200"
                      y1="200"
                      x2={x}
                      y2={y}
                      className="connection-line"
                      style={{ stroke: config.color }}
                    />
                    {/* Node */}
                    <g
                      transform={`translate(${x}, ${y})`}
                      className="ring-node"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCategoryClick(category)}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="24"
                        className="ring-node-circle"
                        style={{ fill: `${config.color}20`, stroke: config.color }}
                      />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="ring-node-emoji"
                      >
                        {config.icon}
                      </text>
                    </g>
                    {/* Label */}
                    <text
                      x={x}
                      y={y + 48}
                      textAnchor="middle"
                      className="ring-node-label"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Nutrient Ring (visible when category selected) */}
          {activeCategory && (
            <div className="nutrient-ring-transition">
              <svg className="ring-layout" viewBox="0 0 400 400">
                {/* Back button hint */}
                <text x="200" y="360" textAnchor="middle" className="ring-hint">
                  Click category or outside to go back
                </text>

                {/* Category label at top */}
                <g className="active-category-label">
                  <text x="200" y="40" textAnchor="middle" className="active-category-text">
                    {(categoryConfig[activeCategory] || categoryConfig['Other']).icon} {activeCategory}
                  </text>
                </g>

                {/* Nutrient nodes */}
                {currentNutrients.map((nutrient, index) => {
                  const pos = calculateNodePosition(index, currentNutrients.length, 130);
                  const x = 200 + pos.x;
                  const y = 200 + pos.y;
                  const isSelected = nutrient.id === activeNutrient;

                  return (
                    <g key={nutrient.id} className="nutrient-ring-node">
                      {/* Connection line */}
                      <line
                        x1="200"
                        y1="200"
                        x2={x}
                        y2={y}
                        className={`nutrient-connection-line ${isSelected ? 'selected' : ''}`}
                        style={{ stroke: (categoryConfig[activeCategory] || categoryConfig['Other']).color }}
                      />
                      {/* Node */}
                      <g
                        transform={`translate(${x}, ${y})`}
                        className={`ring-node nutrient-node ${isSelected ? 'selected' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNutrientClick(nutrient)}
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected ? 28 : 22}
                          className="nutrient-node-circle"
                          style={{
                            fill: isSelected
                              ? (categoryConfig[activeCategory] || categoryConfig['Other']).color
                              : `${(categoryConfig[activeCategory] || categoryConfig['Other']).color}20`,
                            stroke: (categoryConfig[activeCategory] || categoryConfig['Other']).color,
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="nutrient-node-emoji"
                          style={{ fontSize: isSelected ? '20px' : '16px' }}
                        >
                          {getEmojiForNutrient(nutrient.name)}
                        </text>
                      </g>
                      {/* Label */}
                      <text
                        x={x}
                        y={y + 44}
                        textAnchor="middle"
                        className={`nutrient-node-label ${isSelected ? 'selected' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNutrientClick(nutrient)}
                      >
                        {nutrient.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Inline Nutrient Info Card */}
              {selectedNutrientData && (
                <div className="nutrient-info-card">
                  <div className="info-card-header">
                    <span className="info-emoji">{getEmojiForNutrient(selectedNutrientData.name)}</span>
                    <div className="info-card-title">
                      <h4>{selectedNutrientData.name}</h4>
                      <p className="info-amount">
                        {selectedNutrientData.amount?.toFixed(2)} {selectedNutrientData.unit}
                      </p>
                    </div>
                  </div>
                  {selectedNutrientData.benefit && (
                    <p className="info-card-benefit">
                      {selectedNutrientData.benefit}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="knowledge-graph-footer">
          <div className="footer-stat">
            <span className="stat-icon">📋</span>
            <span className="stat-text">{nutrients.length} Total Nutrients</span>
          </div>
          <div className="footer-stat">
            <span className="stat-icon">🏷️</span>
            <span className="stat-text">{activeCategories.length} Categories</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeGraph;
