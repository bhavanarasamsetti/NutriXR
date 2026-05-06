import * as tf from "@tensorflow/tfjs";

/* 🔥 SAME MODELS AS SCANNER */
const MODELS = [
  {
    url: "https://teachablemachine.withgoogle.com/models/cWfhasEQi/model.json",
    classes: ["apple", "green apple", "orange", "grapefruit", "lemon", "plum", "notfruit"],
  },
  {
    url: "https://teachablemachine.withgoogle.com/models/sbWsQmd7Z/model.json",
    classes: ["strawberry", "blueberries", "raspberry", "cherry", "grapes", "notfruit"],
  },
  {
    url: "https://teachablemachine.withgoogle.com/models/pTWUKayQQ/model.json",
    classes: ["banana", "pineapple", "papaya", "watermelon", "coconut", "notfruit"],
  },
  {
    url: "https://teachablemachine.withgoogle.com/models/kk0HxRiXx/model.json",
    classes: ["avocado", "kiwi", "notfruit"],
  },
];

let models = null;

export async function detectFruitFromImage(file) {
  if (!models) {
    models = await Promise.all(
      MODELS.map(async (m) => ({
        model: await tf.loadLayersModel(m.url),
        classes: m.classes,
      }))
    );
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      const tensor = tf.browser
        .fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255)
        .sub(0.5)
        .mul(2)
        .expandDims(0);

      let best = { fruit: null, score: 0 };

      for (const m of models) {
        const preds = await m.model.predict(tensor).data();
        const max = Math.max(...preds);
        const idx = preds.indexOf(max);
        const fruit = m.classes[idx];

        if (fruit !== "notfruit" && max > best.score) {
          best = { fruit, score: max };
        }
      }

      tf.dispose(tensor);
      URL.revokeObjectURL(img.src);

      resolve(best.score > 0.5 ? best.fruit : null);
    };

    img.onerror = () => resolve(null);
  });
}
