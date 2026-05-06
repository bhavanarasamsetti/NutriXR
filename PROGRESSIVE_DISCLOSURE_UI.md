# Progressive Disclosure UI - Knowledge Graph Redesign

## Overview

The KnowledgeGraph component has been completely redesigned to implement a **progressive disclosure** interaction model. Instead of showing all information at once, the UI now reveals information step-by-step through user interaction, eliminating clutter and providing a cleaner, more intuitive experience.

## Key Features

### 1. **Initial State: Fruit + Categories Only**
- Center: Large fruit emoji (80px, with gradient background)
- Surrounding: 3-4 category nodes in a circular ring
  - **Vitamins**: 💊 (Blue: #3B82F6)
  - **Minerals**: ⛏️ (Pink: #EC4899)
  - **Macros**: 🌾 (Amber: #F59E0B)
  - **Other**: 📊 (Gray: #6B7280)
- Each node is clickable and shows its name below
- Connection lines from fruit to categories (dashed, semi-transparent)
- No nutritional details visible yet

### 2. **Category Click → Nutrient View**
When user clicks a category:
1. **Transition**: Smooth fade-out of category ring, fade-in of nutrient ring
2. **Display Changes**:
   - Category label appears at top (icon + name)
   - Nutrients arranged in circular ring at larger radius
   - All nodes use the selected category's color
3. **State**: Only ONE category visible at a time (exclusive)
4. **Connection Lines**: From fruit to each nutrient

### 3. **Nutrient Click → Inline Info Card**
When user clicks a nutrient:
1. **Nutrient Highlight**: Selected node grows and glows
2. **Info Card Appears**: Bottom-centered card with:
   - Nutrient emoji
   - Nutrient name + amount + unit
   - Brief benefit text (if available)
3. **Animation**: Smooth slide-up entrance
4. **State**: Card only visible when nutrient selected

### 4. **Back Navigation**
Users can return to category view by:
- Clicking the selected category label at top (toggle back)
- Clicking outside the modal
- Clicking another category (switches to that category's nutrients)

## Component Structure

### State Management
```javascript
const [activeCategory, setActiveCategory] = useState(null);  // null or category name
const [activeNutrient, setActiveNutrient] = useState(null);  // null or nutrient id
```

### Render Flows
1. **No Category Selected** → Show category ring
2. **Category Selected** → Show nutrient ring + optional info card
3. **Nutrient Selected** → Show info card overlay

### Visual Layout
- **Container**: Modal with centered canvas (450px+ height)
- **SVG Ring**: viewBox="0 0 400 400" (centered at 200,200)
- **Node Positioning**: Using circular math:
  - angle = (2π / totalNodes) * index - π/2
  - x = centerX + cos(angle) * radius
  - y = centerY + sin(angle) * radius
- **Radii**: 
  - Categories: 120px from center
  - Nutrients: 130px from center

## Styling Details

### CSS Classes (New)

#### Canvas & Layout
- `.knowledge-graph-canvas` - Main drawing container
- `.fruit-node-container` - Positions fruit at center
- `.fruit-node` - Styled fruit circle (80px, gradient, shadow)
- `.ring-layout` - SVG container (absolute, full size)

#### Rings
- `.connection-line` - Dashed lines from fruit to nodes
- `.category-ring-node` - Category node group (animated fade-in)
- `.ring-node` - Generic ring node styling
- `.ring-node-circle` - Circle element (fill, stroke, hover effects)
- `.ring-node-emoji` - Emoji text (non-interactive)
- `.ring-node-label` - Category/nutrient name text

#### Nutrients
- `.nutrient-ring-transition` - Transition container (animated)
- `.nutrient-ring-node` - Nutrient node group
- `.nutrient-node` - Nutrient-specific styling
- `.nutrient-node-circle` - Grows when selected (r=28 vs 22)
- `.nutrient-node-emoji` - Emoji (grows when selected)
- `.nutrient-node-label` - Name (bolder when selected)
- `.active-category-label` - Category header text (top)
- `.nutrient-connection-line` - Stronger opacity when nutrient selected

#### Info Card
- `.nutrient-info-card` - Main card (bottom center, absolute)
- `.info-card-header` - Top section (emoji + title)
- `.info-emoji` - Large emoji (28px)
- `.info-card-title` - Name section (h4 + amount)
- `.info-card-benefit` - Benefit text (gray background)
- `.ring-hint` - "Click to go back" hint text (italic, gray)

#### Footer
- `.knowledge-graph-footer` - Bottom stats bar
- `.footer-stat` - Stat item (icon + text)

### Animations

#### Built-in Transitions
- **Ring nodes**: All transitions are 0.3s ease
- **Info card**: slideUp 0.3s ease
- **Category label**: slideDown 0.4s ease
- **Circle hover**: Grows to r=26 (from 22-24)

#### Opacity/Visibility
- Entire rings fade in with `fadeIn 0.3s ease`
- Connection lines smooth opacity changes
- Selected nutrient glows with drop-shadow filter

## Interaction Flow Diagram

```
START
  ↓
[FRUIT + CATEGORIES]
  ↓ (user clicks category)
[NUTRIENT RING]
  ↓ (user clicks nutrient)
[INFO CARD] (shows inline)
  ↓ (user clicks nutrient again OR category)
[BACK TO RING] (card hides, same ring or different)
  ↓ (user clicks category or outside)
[FRUIT + CATEGORIES] (reset to start)
```

## Code Example

### Basic Usage
```jsx
<KnowledgeGraph
  nutrients={[
    { id: 'vit-c', name: 'Vitamin C', amount: 85.4, unit: 'mg', benefit: 'Immune support', category: 'Vitamins' },
    { id: 'potassium', name: 'Potassium', amount: 358, unit: 'mg', benefit: 'Heart health', category: 'Minerals' }
  ]}
  selectedNutrient={null}
  onClose={() => setExpanded(false)}
  fruitName="Orange"
  fruitEmoji="🍊"
/>
```

### State Tracking
```javascript
// In parent component (App.jsx)
const [expandedNutrientId, setExpandedNutrientId] = useState(null);

// Render KnowledgeGraph only when expanded
{expandedNutrientId && (
  <KnowledgeGraph {...props} />
)}
```

## Key Improvements Over Previous Design

| Aspect | Old Design | New Design |
|--------|-----------|-----------|
| **Information Load** | All nutrients visible at once | Progressive disclosure |
| **Clutter** | Multiple expanded categories | One category at a time |
| **Interaction** | Tree expand/collapse | Ring navigation |
| **Details** | Inline in tree | Bottom info card (clean) |
| **Visual** | List-based | Circular geometry |
| **State** | Multiple expanded categories | Exclusive states |
| **Animations** | Simple opacity | Smooth transitions + scale |

## Technical Highlights

### Circular Positioning Algorithm
```javascript
const calculateNodePosition = (index, total, radius) => {
  const angleStep = (Math.PI * 2) / Math.max(total, 3);
  const angle = angleStep * index - Math.PI / 2;  // Start at top
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
};
```

### Nutrient Categorization
Automatic categorization based on nutrient name:
- **Vitamins**: Contains "vitamin"
- **Minerals**: Contains "mineral", "calcium", "iron", "potassium", "magnesium"
- **Macros**: "protein", "carb", "fat", "sugar", "energy", "calorie"
- **Fiber**: Contains "fiber" / "fibre"
- **Other**: Default category

### Emoji Assignment
Smart emoji selection based on nutrient type:
- Protein → 🥚, Carbs → 🌾, Fat → 🥑, Fiber → 🌿
- Vitamins → 💊, Minerals → ⛏️, Energy → ⚡, Sugar → 🍯
- Calcium → 🥛, Iron → 🥩, Potassium → 🍌, Magnesium → ✨
- Default → 📊

## Files Modified

1. **src/components/KnowledgeGraph.jsx** (Completely rewritten)
   - 291 lines total
   - New state management
   - New rendering logic
   - SVG-based ring layouts
   - Info card component

2. **src/styles.css** (New CSS sections added)
   - ~200 lines of new styles
   - Ring layout styles
   - Animation definitions
   - Info card styling
   - Responsive adjustments

3. **src/App.jsx** (Minor update)
   - Added `fruitName` and `fruitEmoji` props to KnowledgeGraph
   - Ensured `selectedFruit` available before rendering

## Future Enhancements

- [ ] Swipe navigation on mobile for category switching
- [ ] Keyboard navigation (arrow keys for ring navigation)
- [ ] Benefit text from Wikidata/external nutrition database
- [ ] Animated ring transitions (rotating/morphing)
- [ ] Persistent category history for back navigation
- [ ] Touch gestures for info card dismissal
- [ ] More detailed nutrient breakdowns on second click
