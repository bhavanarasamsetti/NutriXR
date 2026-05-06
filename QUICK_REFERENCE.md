# Progressive Disclosure UI - Quick Reference

## User Journey

### 1️⃣ Initial View
```
        ┌─────────────────────────┐
        │   🍌 Orange Nutrition   │
        ├─────────────────────────┤
        │                         │
        │      💊 ─────          │
        │      /   \             │
        │    /       \           │
        │  🍌─────────🌾          │
        │    \       /           │
        │      \   /             │
        │      ⛏️ ─────          │
        │                         │
        │   Vitamins  Macros      │
        │        Minerals         │
        │                         │
        └─────────────────────────┘
```
**State**: `activeCategory = null`
- Fruit in center (80px, gradient background)
- Categories in ring (radius 120px)
- Dashed connection lines
- Click any category to expand

### 2️⃣ Category Selected (e.g., Vitamins)
```
        ┌─────────────────────────┐
        │   🍌 Orange Nutrition   │
        ├─────────────────────────┤
        │     💊 Vitamins         │
        │     (header)            │
        │                         │
        │   🥛    ☀️    🌿        │
        │     \   |   /          │
        │       \ | /            │
        │    ────🍌────           │
        │                         │
        │    Calcium Vitamin Fiber│
        │         C               │
        │                         │
        │  "Click category..."    │
        ├─────────────────────────┤
        │ 📋 10 Total | 🏷️ 3 Cats │
        └─────────────────────────┘
```
**State**: `activeCategory = 'Vitamins'`, `activeNutrient = null`
- Category label at top
- Nutrients in circular ring
- All use Vitamins color (#3B82F6)
- Dashed connection lines to fruit
- Click nutrient to show details

### 3️⃣ Nutrient Selected
```
        ┌─────────────────────────┐
        │   🍌 Orange Nutrition   │
        ├─────────────────────────┤
        │     💊 Vitamins         │
        │                         │
        │   🥛    ☀️*   🌿        │
        │     \   |   /          │
        │       \ | /            │
        │    ────🍌────           │
        │                         │
        ├─────────────────────────┤
        │   ☀️ Vitamin C           │
        │   85.4 mg               │
        │   Immune support        │
        └─────────────────────────┘
```
**State**: `activeCategory = 'Vitamins'`, `activeNutrient = 'vit-c'`
- Nutrient circle glows/enlarges (r=28 vs 22)
- Info card appears at bottom
- Shows: emoji, name, amount, benefit
- Click nutrient again to hide card
- Click category or outside to go back

## State Transitions

```
START (no category)
  ↓
Category Ring Visible
  ├─ Click category → Nutrient Ring
  └─ Click outside → Close modal
      
Nutrient Ring (active category)
  ├─ Click nutrient → Show info card
  │   ├─ Click nutrient again → Hide card
  │   └─ Click category/outside → Go back
  └─ Click category label → Nutrient Ring (same)

Info Card
  ├─ Click nutrient → Toggle card
  └─ Click outside/back → Category Ring
```

## CSS Class Hierarchy

```
.knowledge-graph-overlay (modal wrapper)
└── .knowledge-graph-container
    ├── .knowledge-graph-header
    ├── .knowledge-graph-canvas
    │   ├── .fruit-node-container
    │   │   └── .fruit-node (emoji)
    │   ├── (OR) Ring 1: .category-ring-node (SVG group)
    │   │   ├── .connection-line
    │   │   ├── .ring-node
    │   │   │   ├── .ring-node-circle
    │   │   │   └── .ring-node-emoji
    │   │   └── .ring-node-label
    │   └── (OR) Ring 2: .nutrient-ring-transition
    │       ├── .active-category-label
    │       ├── .nutrient-ring-node (SVG group)
    │       │   ├── .nutrient-connection-line
    │       │   ├── .ring-node.nutrient-node
    │       │   │   ├── .nutrient-node-circle
    │       │   │   └── .nutrient-node-emoji
    │       │   └── .nutrient-node-label
    │       └── .nutrient-info-card
    │           ├── .info-card-header
    │           │   ├── .info-emoji
    │           │   └── .info-card-title
    │           └── .info-card-benefit
    └── .knowledge-graph-footer
        ├── .footer-stat (x2)
        ├── .stat-icon
        └── .stat-text
```

## Key Colors

| Category | Color | Icon | Hex |
|----------|-------|------|-----|
| Vitamins | Blue | 💊 | #3B82F6 |
| Minerals | Pink | ⛏️ | #EC4899 |
| Macros | Amber | 🌾 | #F59E0B |
| Other | Gray | 📊 | #6B7280 |

## Responsive Features

- **Desktop**: Full SVG ring layouts (400x400 viewBox)
- **Mobile**: Same logic, smaller font sizes
- **Touch**: Larger click targets (circles r=24-28)
- **Accessibility**: No hover-only content (all click-based)

## Component Props

```javascript
<KnowledgeGraph
  nutrients={Array<{
    id: string,
    name: string,
    amount: number,
    unit: string,
    benefit?: string,
    category?: string
  }>}
  selectedNutrient={null | Nutrient}
  onClose={function}
  fruitName="Orange"      // Default: 'Fruit'
  fruitEmoji="🍊"         // Default: '🍌'
/>
```

## Common Interactions

### Go Back
- **From nutrients**: Click category name at top
- **From card**: Click nutrient again or click category
- **From ring**: Click outside modal or ✕ button

### Switch Categories
- From nutrient ring: Click different nutrient → ring hides, card hides
- Then: New category nutrients appear
- Or: Click category at top to return first

### Clear Everything
- Click outside modal (overlay click)
- Click ✕ in header
- Triggers `onClose()` callback

## Performance Notes

- Uses `useMemo` for nutrient grouping
- SVG nodes are lightweight
- CSS transitions hardware-accelerated
- No complex animations blocking UI
- Lazy info card rendering (only when selected)

## Debugging Tips

1. **Check state**: Open React DevTools, look for `activeCategory` and `activeNutrient`
2. **Ring not showing**: Verify `nutrients` array has items with proper categorization
3. **Colors wrong**: Check `categoryConfig` object matches nutrient category names
4. **Info card misaligned**: Check `.nutrient-info-card` CSS positioning
5. **Click not working**: Verify SVG `<g>` elements have `onClick` handlers

---

**Implementation Complete!** ✨

The component now follows exact progressive disclosure specifications:
- ✅ Fruit + categories only initially
- ✅ One category at a time (exclusive)
- ✅ Nutrients in circle around fruit
- ✅ Inline info card (no modal panels)
- ✅ Smooth transitions between states
- ✅ Click category/outside to go back
- ✅ Clean, non-overlapping design
