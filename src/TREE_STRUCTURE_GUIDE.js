/**
 * KNOWLEDGE GRAPH - HIERARCHICAL TREE VIEW
 * New implementation showing proper node expansion
 */

// The new KnowledgeGraph component displays nutrients in a tree structure:
//
// 🍌 Nutrition Profile (Expandable Root)
// ├─ 💊 Vitamins [3]
// │  ├─ 🍊 Vitamin C (8.7 mg) → Shows benefit when clicked
// │  ├─ 🥚 Vitamin B6 (0.4 mg) → Shows benefit when clicked
// │  └─ 💊 Folate (25 µg) → Shows benefit when clicked
// │
// ├─ ⛏️ Minerals [3]
// │  ├─ 🍌 Potassium (358 mg) → Shows benefit when clicked
// │  ├─ 🌿 Magnesium (27 mg) → Shows benefit when clicked
// │  └─ ⚙️ Manganese (0.3 mg) → Shows benefit when clicked
// │
// └─ 🌾 Macros [6]
//    ├─ ⚡ Energy (89 kcal) → Shows benefit when clicked
//    ├─ 🌾 Carbohydrates (23 g) → Shows benefit when clicked
//    ├─ 🌿 Fiber (2.6 g) → Shows benefit when clicked
//    ├─ 🥚 Protein (1.1 g) → Shows benefit when clicked
//    ├─ 🥑 Fat (0.3 g) → Shows benefit when clicked
//    └─ 🍯 Sugar (12 g) → Shows benefit when clicked

// KEY FEATURES:
// 1. Categories are expandable (click ▶ to expand, ▼ to collapse)
// 2. Click on nutrients to show their health benefits
// 3. Visual hierarchy with indentation and colored left borders
// 4. Count badge shows number of nutrients per category
// 5. Selected nutrient highlights with light background
// 6. Statistics at bottom show totals

// INTERACTION FLOW:
// Step 1: User opens Knowledge Graph modal
// Step 2: User sees root "Nutrition Profile" with 3 categories collapsed (▶)
// Step 3: User clicks category (e.g., 💊 Vitamins [3])
// Step 4: Category expands to show 3 nutrients
// Step 5: User clicks nutrient (e.g., 🍊 Vitamin C)
// Step 6: Nutrient shows benefit text below it
// Step 7: User can click another category to collapse first and expand second
// Step 8: Stats update to show total nutrients, categories, top nutrient

// CSS CLASSES USED:
// .knowledge-tree - Container for tree structure
// .tree-node - Base node class
// .tree-node.root-node - Root fruit node
// .tree-node.category-node - Category nodes (Vitamins, Minerals, etc.)
// .tree-node.nutrient-node - Individual nutrient nodes
// .tree-node.nutrient-node.selected - Highlighted when clicked
// .category-header - Clickable category button
// .nutrient-header - Nutrient display
// .expand-icon - ▶/▼ arrow indicator
// .count-badge - Number of items badge
// .node-details - Nutrient name and value
// .node-benefit - Health benefit text (shown when selected)

// STRUCTURE COMPARISON:
//
// OLD (Flat):
// ├─ Vitamins
// │  ├─ Vitamin C
// │  ├─ Vitamin B6
// │  └─ Folate
// ├─ Minerals
// │  ├─ Potassium
// │  ├─ Magnesium
// │  └─ Manganese
// └─ Macros
//    ├─ Energy
//    ├─ Carbohydrates
//    ├─ Fiber
//    ├─ Protein
//    ├─ Fat
//    └─ Sugar
//
// NEW (Expandable):
// 🍌 Nutrition Profile
// ├─ 💊 Vitamins [3] ▶  (COLLAPSED)
// │  (Shows nutrients only when expanded)
// ├─ ⛏️ Minerals [3] ▼   (EXPANDED)
// │  ├─ 🍌 Potassium (358 mg)
// │  ├─ 🌿 Magnesium (27 mg)
// │  └─ ⚙️ Manganese (0.3 mg)
// └─ 🌾 Macros [6] ▼    (EXPANDED)
//    ├─ ⚡ Energy (89 kcal)
//    ├─ 🌾 Carbohydrates (23 g)
//    └─ ... (more on scroll)

export const treeStructureExplanation = {
  purpose: 'Display nutrients in a hierarchical, expandable tree format',
  levels: [
    {
      level: 0,
      name: 'Root',
      nodes: ['Nutrition Profile'],
      emoji: '🍌',
      expandable: false,
      description: 'Container for all categories'
    },
    {
      level: 1,
      name: 'Categories',
      nodes: ['Vitamins', 'Minerals', 'Macros', 'Other'],
      emoji: ['💊', '⛏️', '🌾', '📊'],
      expandable: true,
      description: 'Click to expand/collapse nutrients'
    },
    {
      level: 2,
      name: 'Nutrients',
      nodes: ['Vitamin C', 'Potassium', 'Energy', 'etc.'],
      emoji: ['🍊', '🍌', '⚡', 'varies'],
      expandable: false,
      clickable: true,
      description: 'Click to show health benefit'
    }
  ],
  userActions: {
    'Click category header': 'Expand/collapse nutrients in that category',
    'Click nutrient node': 'Show health benefit text for that nutrient',
    'Scroll': 'View more nutrients if list is long'
  },
  visualIndicators: {
    'expand-icon': '▶ = collapsed, ▼ = expanded',
    'count-badge': 'Number in brackets shows nutrients per category',
    'selected-state': 'Highlighted background shows selected nutrient',
    'benefit-text': 'Blue gradient box appears below selected nutrient',
    'left-border': 'Colored left border indicates category'
  }
};
