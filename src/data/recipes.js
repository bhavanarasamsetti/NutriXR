// src/data/recipes.js

/* -------------------- Fruit Intelligence -------------------- */
/*
  ingredient        → detailed (for Ingredients section)
  instructionLabel  → short & human (for Instructions section)
*/

const fruitPrepMap = {
  apple: {
    ingredient: "1 large apple, cored and chopped",
    instructionLabel: "chopped apples"
  },

  "green apple": {

    ingredient: "1 green apple, cored and chopped",
    instructionLabel: "chopped green apples"
  },
  banana: {
    ingredient: "1 ripe banana, peeled and sliced",
    instructionLabel: "sliced bananas"
  },
  blueberries: {
    ingredient: "½ cup blueberries",
    instructionLabel: "blueberries"
  },
  strawberry: {
    ingredient: "½ cup strawberries, hulled and sliced",
    instructionLabel: "sliced strawberries"
  },
  raspberry: {
    ingredient: "½ cup raspberries",
    instructionLabel: "raspberries"
  },
  cherry: {
    ingredient: "½ cup cherries, pitted",
    instructionLabel: "cherries"
  },
  grapes: {
    ingredient: "½ cup grapes",
    instructionLabel: "grapes"
  },
  kiwi: {
    ingredient: "1 kiwi, peeled and sliced",
    instructionLabel: "sliced kiwi"
  },
  orange: {
    ingredient: "2 medium oranges, juiced",
    instructionLabel: "orange juice"
  },
  lemon: {
    ingredient: "1 tablespoon lemon juice",
    instructionLabel: "lemon juice"
  },
  grapefruit: {
    ingredient: "½ grapefruit, juiced",
    instructionLabel: "grapefruit juice"
  },
  papaya: {
    ingredient: "1 cup papaya, peeled and diced",
    instructionLabel: "diced papaya"
  },
  pineapple: {
    ingredient: "1 cup pineapple, peeled and chopped",
    instructionLabel: "chopped pineapple"
  },
  plum: {
    ingredient: "2 plums, pitted and sliced",
    instructionLabel: "sliced plums"
  },
  watermelon: {
    ingredient: "1 cup watermelon, cubed",
    instructionLabel: "watermelon cubes"
  },
  avocado: {
    ingredient: "1 ripe avocado, sliced",
    instructionLabel: "sliced avocado"
  },
  coconut: {
    ingredient: "½ cup fresh coconut meat, grated",
    instructionLabel: "grated coconut"
  }
};

/* -------------------- Helpers -------------------- */

function buildFruitIngredients(selectedFruits) {
  return selectedFruits.map(
    fruit => fruitPrepMap[fruit]?.ingredient || fruit
  );
}

function buildInstructionIngredientSentence(selectedFruits) {
  return selectedFruits
    .map(fruit => fruitPrepMap[fruit]?.instructionLabel || fruit)
    .join(", ");
}

function calculateServings(fruitCount) {
  if (fruitCount <= 3) return 1;
  if (fruitCount <= 6) return 2;
  if (fruitCount <= 9) return 3;
  return 4;
}

function calculateTime(fruitCount, recipeType) {
  const baseTime = {
    smoothie: 3,
    fruit_bowl: 5,
    dessert: 8
  };

  return baseTime[recipeType] + Math.floor(fruitCount / 2);
}


/* -------------------- Recipe Generator -------------------- */

export function generateRecipe(selectedFruits, recipeType) {
  if (!selectedFruits || selectedFruits.length < 2) return null;
  
  const fruitCount = selectedFruits.length;
  const time = calculateTime(fruitCount, recipeType);
  const servings = calculateServings(fruitCount);
  const fruits = [...selectedFruits];

  const fruitList = selectedFruits.join(", ");
  const ingredients = buildFruitIngredients(selectedFruits);
  const instructionIngredients =
    buildInstructionIngredientSentence(selectedFruits);

  /* ---------- Smoothie ---------- */
  if (recipeType === "smoothie") {
    return {
      title: "Fresh Fruit Smoothie",
      description: "A refreshing and nutritious smoothie blended with fresh fruits, perfect for breakfast or a healthy snack.", 
      fruits,  
      time,
      servings,
      ingredients: [
        ...ingredients,
        "½ cup water or milk",
        "1 tablespoon honey (optional)",
        "½ cup ice cubes"
      ],
      steps: [
        `Add the ${instructionIngredients} to a blender.`,
        "Add the water or milk and ice cubes.",
         "Blend on high for 30–60 seconds until smooth and creamy.",
          "Taste and adjust sweetness if required.",
           "Pour into glasses and serve chilled."
]
    };
  }

  /* ---------- Fruit Bowl ---------- */
  if (recipeType === "fruit_bowl") {
    return {
      title: "Healthy Fruit Bowl",
description: "A colorful and nutritious fruit bowl made with fresh seasonal fruits, light and refreshing.",
      fruits,
      time,
      servings,
      ingredients: [
        ...ingredients,
        "1 tablespoon honey (optional)",

        "1 tablespoon lemon juice (optional)"

      ],
      steps: [
        `In a large mixing bowl, combine the ${instructionIngredients}.`,
        "Add lemon juice or honey if using.",
        "Gently toss everything together until evenly mixed.",
        "Taste and adjust sweetness if needed.",
        "Serve immediately for maximum freshness."
      ]
    };
  }

  /* ---------- Dessert ---------- */
  if (recipeType === "dessert") {
    return {
      title: "Nutritious Fruit Dessert",
      description: "A light and wholesome fruit-based dessert with natural sweetness and rich flavor.",
      fruits,
      time,
      servings,
      ingredients: [
        ...ingredients,
        "½ cup yogurt or custard",
        "1 tablespoon honey or maple syrup (optional)",

        "Fresh mint leaves for garnish (optional)"

      ],
      steps: [
        `In a large mixing bowl, combine the ${instructionIngredients}.`,
        "Layer the fruit mixture into serving bowls or glasses.",
        "Add yogurt or custard between the layers.",
        "Drizzle honey or syrup over the top if desired.",
        "Let the dessert rest for 5–10 minutes to allow flavors to blend.",
        "Garnish with mint leaves and serve."
      ]
    };
  }

  return null;

}
