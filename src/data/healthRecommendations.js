const HEALTH_GOALS = [
  { id: 'diabetes', label: 'Diabetes', icon: '🩺', helper: 'Lower glycemic picks' },
  { id: 'pcos', label: 'PCOS', icon: '🌸', helper: 'Steady energy, lower sugar' },
  { id: 'anemia', label: 'Anemia', icon: '💧', helper: 'Iron + vitamin C support' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '⚖️', helper: 'Higher fiber, lighter calories' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪', helper: 'Carbs to fuel training' },
  { id: 'cholesterol', label: 'Cholesterol', icon: '❤️', helper: 'Fiber-forward choices' },
  { id: 'digestion', label: 'Digestion', icon: '🌿', helper: 'Gentle on gut, fiber' },
  { id: 'skin_health', label: 'Skin Health', icon: '✨', helper: 'Vitamin C and antioxidants' }
];

const FRUIT_LIBRARY = {
  apple: {
    name: 'Apple',
    emoji: '🍎',
    portion: '1 medium',
    note: 'High fiber, steady energy'
  },
  banana: {
    name: 'Banana',
    emoji: '🍌',
    portion: '1 medium',
    note: 'Potassium and carbs for fuel'
  },
  blueberries: {
    name: 'Blueberries',
    emoji: '🫐',
    portion: '1 cup',
    note: 'Antioxidants, lower sugar'
  },
  raspberry: {
    name: 'Raspberry',
    emoji: '🍓',
    portion: '1 cup',
    note: 'Higher fiber berry'
  },
  strawberry: {
    name: 'Strawberry',
    emoji: '🍓',
    portion: '1 cup',
    note: 'Vitamin C rich, light calories'
  },
  kiwi: {
    name: 'Kiwi',
    emoji: '🥝',
    portion: '2 small',
    note: 'Vitamin C + digestion support'
  },
  orange: {
    name: 'Orange',
    emoji: '🍊',
    portion: '1 medium',
    note: 'Vitamin C and hydration'
  },
  papaya: {
    name: 'Papaya',
    emoji: '🥭',
    portion: '1 cup',
    note: 'Digestive enzymes, vitamin A'
  },
  pineapple: {
    name: 'Pineapple',
    emoji: '🍍',
    portion: '1 cup',
    note: 'Vitamin C; mind natural sugar'
  },
  grapes: {
    name: 'Grapes',
    emoji: '🍇',
    portion: '1/2 cup',
    note: 'Quick carbs; watch portions'
  },
  watermelon: {
    name: 'Watermelon',
    emoji: '🍉',
    portion: '1 cup',
    note: 'Hydrating, light calories'
  },
  lemon: {
    name: 'Lemon',
    emoji: '🍋',
    portion: '1/2 fruit',
    note: 'Flavor booster, vitamin C'
  },
  cherry: {
    name: 'Cherry',
    emoji: '🍒',
    portion: '1 cup',
    note: 'Antioxidants; moderate sugar'
  },
  plum: {
    name: 'Plum',
    emoji: '🍑',
    portion: '2 small',
    note: 'Fiber and antioxidants'
  }
};

const BMI_RULES = {
  underweight: {
    label: 'Underweight',
    note: 'Add calorie-dense, nutrient-rich fruits.',
    recommended: ['banana', 'papaya', 'grapes'],
    limit: []
  },
  normal: {
    label: 'Normal',
    note: 'Keep balanced, colorful fruit choices.',
    recommended: ['apple', 'orange', 'kiwi', 'strawberry'],
    limit: []
  },
  overweight: {
    label: 'Overweight',
    note: 'Favor lower-sugar, higher-fiber fruits.',
    recommended: ['apple', 'kiwi', 'strawberry', 'blueberries'],
    limit: ['grapes', 'pineapple', 'banana']
  },
  obese: {
    label: 'Obese',
    note: 'Choose low glycemic, fiber-forward fruits; watch portions.',
    recommended: ['apple', 'kiwi', 'strawberry', 'orange', 'watermelon'],
    limit: ['grapes', 'pineapple', 'banana']
  }
};

const GOAL_RULES = {
  diabetes: {
    note: 'Lower glycemic choices to steady blood sugar.',
    recommended: ['apple', 'kiwi', 'strawberry', 'blueberries', 'raspberry', 'orange'],
    limit: ['pineapple', 'grapes', 'banana']
  },
  pcos: {
    note: 'Steady energy and fiber help insulin sensitivity.',
    recommended: ['apple', 'blueberries', 'strawberry', 'kiwi'],
    limit: ['pineapple', 'grapes']
  },
  anemia: {
    note: 'Vitamin C helps iron absorption.',
    recommended: ['orange', 'kiwi', 'strawberry', 'papaya'],
    limit: []
  },
  weight_loss: {
    note: 'Higher fiber, hydrating picks for fullness.',
    recommended: ['apple', 'strawberry', 'kiwi', 'orange', 'watermelon'],
    limit: ['grapes', 'pineapple', 'banana']
  },
  muscle_gain: {
    note: 'Carbs to fuel training and recovery.',
    recommended: ['banana', 'grapes', 'papaya'],
    limit: []
  },
  cholesterol: {
    note: 'Fiber can help manage cholesterol.',
    recommended: ['apple', 'strawberry', 'orange', 'blueberries'],
    limit: ['pineapple']
  },
  digestion: {
    note: 'Fiber and enzymes for gentler digestion.',
    recommended: ['papaya', 'kiwi', 'banana'],
    limit: []
  },
  skin_health: {
    note: 'Antioxidants and vitamin C support skin.',
    recommended: ['orange', 'kiwi', 'blueberries', 'papaya', 'strawberry'],
    limit: []
  }
};

const KEYWORD_GOAL_MAP = {
  diabetes: ['diabetes', 'a1c', 'glucose', 'insulin', 'prediabetes', 'hyperglycemia'],
  cholesterol: ['cholesterol', 'ldl', 'hdl', 'triglyceride'],
  anemia: ['anemia', 'haemoglobin', 'hemoglobin', 'iron deficiency', 'low hb'],
  weight_loss: ['obese', 'obesity', 'overweight', 'bmi 30', 'bmi 25', 'weight loss'],
  digestion: ['constipation', 'ibs', 'ibd', 'bloating', 'gut'],
  skin_health: ['skin', 'acne', 'dermatitis', 'eczema'],
  pcos: ['pcos', 'polycystic', 'cyst'],
  muscle_gain: ['muscle', 'sarcopenia', 'strength']
};

const getNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function computeBmi(weightKg, heightCm) {
  const weight = getNumber(weightKg);
  const height = getNumber(heightCm);
  if (!weight || !height || height <= 0) return null;

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  let category = 'normal';
  if (bmi < 18.5) category = 'underweight';
  else if (bmi >= 25 && bmi < 30) category = 'overweight';
  else if (bmi >= 30) category = 'obese';

  return {
    value: Number(bmi.toFixed(1)),
    category,
    label: BMI_RULES[category]?.label || 'Normal',
    note: BMI_RULES[category]?.note || ''
  };
}

const mergeSets = (base = [], next = []) => {
  const set = new Set(base);
  next.forEach((item) => item && set.add(item));
  return Array.from(set);
};

export function buildRecommendations({ bmiCategory, goals = [] } = {}) {
  let recommended = [];
  let limit = [];
  const reasons = [];

  const bmiRule = bmiCategory ? BMI_RULES[bmiCategory] : null;
  if (bmiRule) {
    recommended = mergeSets(recommended, bmiRule.recommended);
    limit = mergeSets(limit, bmiRule.limit);
    if (bmiRule.note) reasons.push(`BMI: ${bmiRule.note}`);
  }

  goals.forEach((goal) => {
    const rule = GOAL_RULES[goal];
    if (!rule) return;
    recommended = mergeSets(recommended, rule.recommended);
    limit = mergeSets(limit, rule.limit);
    if (rule.note) reasons.push(`${rule.note}`);
  });

  if (!recommended.length) {
    recommended = ['apple', 'orange', 'kiwi', 'strawberry'];
    reasons.push('Balanced starter picks while we learn more about you.');
  }

  if (limit.length) {
    const limited = new Set(limit);
    recommended = recommended.filter((id) => !limited.has(id));
    limit = Array.from(limited);
  }

  return {
    recommended,
    limit,
    reasons: Array.from(new Set(reasons))
  };
}

export function parseHealthConcerns(text = '') {
  const normalized = text.toLowerCase();
  const detected = new Set();

  Object.entries(KEYWORD_GOAL_MAP).forEach(([goal, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      detected.add(goal);
    }
  });

  return Array.from(detected);
}

export { HEALTH_GOALS, FRUIT_LIBRARY, BMI_RULES, GOAL_RULES };
