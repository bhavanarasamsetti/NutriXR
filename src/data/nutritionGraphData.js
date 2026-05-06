/**
 * Nutrition Knowledge Graph Data Structure
 * Converts flat nutrition data into a hierarchical node/edge structure for visualization
 */

// ===== EXAMPLE INPUT DATA =====
// This is the flat nutrition data format that comes from your API/database
const exampleBananaInput = {
  fruitId: 'banana',
  fruitName: 'Banana',
  fruitEmoji: '🍌',
  nutrients: [
    // Vitamins
    { id: 'vitamin-c', name: 'Vitamin C', amount: 8.7, unit: 'mg', benefit: 'Boosts immunity and collagen production' },
    { id: 'vitamin-b6', name: 'Vitamin B6', amount: 0.4, unit: 'mg', benefit: 'Supports brain development and function' },
    { id: 'folate', name: 'Folate', amount: 25, unit: 'µg', benefit: 'Essential for DNA synthesis' },
    
    // Minerals
    { id: 'potassium', name: 'Potassium', amount: 358, unit: 'mg', benefit: 'Regulates blood pressure and heart health' },
    { id: 'magnesium', name: 'Magnesium', amount: 27, unit: 'mg', benefit: 'Supports muscle and bone health' },
    { id: 'manganese', name: 'Manganese', amount: 0.3, unit: 'mg', benefit: 'Aids metabolism and bone development' },
    
    // Macros
    { id: 'energy', name: 'Energy', amount: 89, unit: 'kcal', benefit: 'Provides quick energy for daily activities' },
    { id: 'carbohydrates', name: 'Carbohydrates', amount: 23, unit: 'g', benefit: 'Primary energy source for the body' },
    { id: 'fiber', name: 'Fiber', amount: 2.6, unit: 'g', benefit: 'Supports digestive health and satiety' },
    { id: 'protein', name: 'Protein', amount: 1.1, unit: 'g', benefit: 'Builds and repairs tissues' },
    { id: 'fat', name: 'Fat', amount: 0.3, unit: 'g', benefit: 'Essential for nutrient absorption' },
    { id: 'sugar', name: 'Sugar', amount: 12, unit: 'g', benefit: 'Natural carbohydrate for quick energy' },
  ]
};

// ===== KNOWLEDGE GRAPH GENERATOR =====
/**
 * Converts flat nutrition data into knowledge graph structure
 * @param {Object} fruitData - Object with fruitId, fruitName, fruitEmoji, and nutrients array
 * @returns {Object} { nodes, edges }
 */
function generateNutritionKnowledgeGraph(fruitData) {
  const { fruitId, fruitName, fruitEmoji, nutrients } = fruitData;
  
  const nodes = [];
  const edges = [];
  
  // Category definitions
  const categories = {
    vitamins: { id: 'vitamins', label: 'Vitamins', emoji: '💊' },
    minerals: { id: 'minerals', label: 'Minerals', emoji: '⛏️' },
    macros: { id: 'macros', label: 'Macros', emoji: '🌾' },
    other: { id: 'other', label: 'Other', emoji: '📊' }
  };
  
  // Helper function to categorize nutrients
  function categorizeNutrient(nutrient) {
    const name = nutrient.name.toLowerCase();
    
    if (name.includes('vitamin')) return 'vitamins';
    if (['potassium', 'calcium', 'iron', 'magnesium', 'manganese', 'zinc', 'copper', 'selenium'].some(m => name.includes(m))) {
      return 'minerals';
    }
    if (['energy', 'fibre', 'fiber', 'protein', 'carbohydrate', 'fat', 'sugar'].some(m => name.includes(m))) {
      return 'macros';
    }
    return 'other';
  }
  
  // 1. Create root fruit node
  nodes.push({
    id: fruitId,
    label: fruitName,
    emoji: fruitEmoji,
    type: 'fruit',
    amount: null,
    unit: null,
    benefit: `High in essential vitamins and minerals`
  });
  
  // 2. Create category nodes and track which ones are used
  const usedCategories = new Set();
  
  // Determine which categories have nutrients
  nutrients.forEach(nutrient => {
    const category = categorizeNutrient(nutrient);
    usedCategories.add(category);
  });
  
  // Add only used category nodes
  const categoryNodeMap = {};
  usedCategories.forEach(categoryKey => {
    const category = categories[categoryKey];
    nodes.push({
      id: `${fruitId}-${category.id}`,
      label: category.label,
      emoji: category.emoji,
      type: 'category',
      parentId: fruitId,
      amount: null,
      unit: null,
      benefit: null
    });
    categoryNodeMap[categoryKey] = `${fruitId}-${category.id}`;
    
    // Create edge from fruit to category
    edges.push({
      source: fruitId,
      target: `${fruitId}-${category.id}`,
      type: 'contains'
    });
  });
  
  // 3. Create nutrient nodes
  nutrients.forEach(nutrient => {
    const category = categorizeNutrient(nutrient);
    const categoryNodeId = categoryNodeMap[category];
    const nutrientNodeId = `${fruitId}-${nutrient.id}`;
    
    nodes.push({
      id: nutrientNodeId,
      label: `${nutrient.name}`,
      displayLabel: `${nutrient.name} (${nutrient.amount} ${nutrient.unit})`,
      emoji: getEmojiByCategoryAndNutrient(category, nutrient.name),
      type: 'nutrient',
      parentId: categoryNodeId,
      amount: nutrient.amount,
      unit: nutrient.unit,
      benefit: nutrient.benefit,
      category: category
    });
    
    // Create edge from category to nutrient
    edges.push({
      source: categoryNodeId,
      target: nutrientNodeId,
      type: 'contains'
    });
  });
  
  return { nodes, edges };
}

// Helper function to get emoji based on category and nutrient
function getEmojiByCategoryAndNutrient(category, nutrientName) {
  const name = nutrientName.toLowerCase();
  
  if (category === 'vitamins') {
    if (name.includes('c')) return '🍊';
    if (name.includes('b')) return '🥚';
    if (name.includes('d')) return '☀️';
    return '💊';
  }
  
  if (category === 'minerals') {
    if (name.includes('potassium')) return '🍌';
    if (name.includes('calcium')) return '🥛';
    if (name.includes('iron')) return '🥩';
    if (name.includes('magnesium')) return '🌿';
    return '⛏️';
  }
  
  if (category === 'macros') {
    if (name.includes('energy') || name.includes('calorie')) return '⚡';
    if (name.includes('protein')) return '🥚';
    if (name.includes('carb')) return '🌾';
    if (name.includes('fat')) return '🥑';
    if (name.includes('fiber') || name.includes('fibre')) return '🌿';
    if (name.includes('sugar')) return '🍯';
    return '🌾';
  }
  
  return '📊';
}

// ===== GENERATE EXAMPLE OUTPUT =====
const bananaGraphData = generateNutritionKnowledgeGraph(exampleBananaInput);

// ===== FORMATTED OUTPUT =====
const knowledgeGraphOutput = {
  fruit: {
    id: exampleBananaInput.fruitId,
    name: exampleBananaInput.fruitName,
    emoji: exampleBananaInput.fruitEmoji
  },
  nodes: bananaGraphData.nodes,
  edges: bananaGraphData.edges,
  statistics: {
    totalNodes: bananaGraphData.nodes.length,
    totalEdges: bananaGraphData.edges.length,
    fruitNode: 1,
    categoryNodes: bananaGraphData.nodes.filter(n => n.type === 'category').length,
    nutrientNodes: bananaGraphData.nodes.filter(n => n.type === 'nutrient').length,
    categories: [
      ...new Set(bananaGraphData.nodes.filter(n => n.type === 'category').map(n => n.label))
    ]
  }
};

// Export for use in React component
export { generateNutritionKnowledgeGraph, exampleBananaInput, knowledgeGraphOutput };

// Also export helper for batch processing multiple fruits
export function generateGraphsForMultipleFruits(fruitsArray) {
  return fruitsArray.map(fruit => ({
    fruit: {
      id: fruit.fruitId,
      name: fruit.fruitName,
      emoji: fruit.fruitEmoji
    },
    ...generateNutritionKnowledgeGraph(fruit)
  }));
}
