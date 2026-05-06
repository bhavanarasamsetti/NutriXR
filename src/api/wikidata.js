import nutritionById from '../data/nutrition';

const benefitByKeyword = {
  energy: 'Supplies calories for daily activity.',
  'vitamin c': 'Supports immune function and collagen synthesis.',
  potassium: 'Helps regulate fluid balance and muscle function.',
  fiber: 'Aids digestion and supports gut health.'
};

const nutritionCache = new Map();

export async function getFruitNutrition(fruitName) {
  if (nutritionCache.has(fruitName)) {
    return nutritionCache.get(fruitName);
  }

  const local = nutritionById[fruitName.toLowerCase()];
  const nutrients =
    local ||
    [
      {
        id: 'unknown',
        name: 'Nutrition',
        amount: null,
        unit: '',
        benefit: 'No local data available.'
      }
    ];

  const payload = { nutrients };
  nutritionCache.set(fruitName, payload);
  return payload;
}
