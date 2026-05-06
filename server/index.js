import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';
import multer from 'multer';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { fileURLToPath } from 'url';
import nutritionById from '../src/data/nutrition.js';
import { FRUIT_LIBRARY } from '../src/data/healthRecommendations.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "200kb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const SYSTEM_PROMPT = `Role: AI Dietitian Assistant for NutriXR.
Identity: Your name is Anya. If the user greets you, greet back and mention your name.
Tone: Friendly, short, B1 level English.
Rules:
- Do not claim to be a real doctor.
- No diagnosis.
- No treatment advice.
- For medical condition questions, recommend consulting a clinician or dietitian.
- Always mention if information is general.
- End every reply with: "This is general information."
- If data is missing, say: "I do not have that value from our data source".
- Use the provided fruit nutrition data as the main source for values and comparisons.
- If outside fruit nutrition scope, say it clearly and give safe general guidance.`;

const MEDICAL_KEYWORDS = [
  "diagnose",
  "diagnosis",
  "treat",
  "treatment",
  "medication",
  "medicine",
  "drug",
  "prescription",
  "dose",
  "dosage",
  "side effect",
  "symptom",
  "pain",
  "bleeding",
  "emergency",
  "heart attack",
  "stroke",
  "chest pain",
  "shortness of breath",
  "fainting",
  "seizure",
  "cancer",
  "diabetes",
  "asthma",
  "infection",
  "fever",
];

const buildMedicalSafetyReply = () =>
  "I cannot help with medical conditions, medications, severe symptoms, or emergencies. Please contact a licensed clinician or dietitian. If this feels urgent, seek local emergency care right away. This is general information.";

const isMedicalQuery = (message) => {
  const normalized = message.toLowerCase();
  return MEDICAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const normalize = (text) =>
  (text || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const NUTRIENT_ALIASES = [
  { key: "vitamin c", matches: ["vitamin c", "vitaminc", "vit-c"] },
  { key: "vitamin b6", matches: ["vitamin b6", "b6"] },
  { key: "vitamin k", matches: ["vitamin k"] },
  { key: "potassium", matches: ["potassium"] },
  { key: "fiber", matches: ["fiber", "fibre"] },
  { key: "energy", matches: ["energy", "calorie", "calories", "kcal"] },
  { key: "sugar", matches: ["sugar"] },
  { key: "protein", matches: ["protein"] },
  { key: "fat", matches: ["fat"] },
  { key: "carbohydrate", matches: ["carb", "carbs", "carbohydrate"] },
];

const findNutrientKey = (message) => {
  const normalized = normalize(message);
  for (const alias of NUTRIENT_ALIASES) {
    for (const match of alias.matches) {
      if (normalized.includes(normalize(match))) return alias.key;
    }
  }
  return null;
};

const findNutrientInList = (nutrients, nutrientKey) => {
  if (!nutrientKey || !Array.isArray(nutrients)) return null;
  const keyNormalized = normalize(nutrientKey);
  return nutrients.find((nutrient) =>
    normalize(nutrient.name).includes(keyNormalized)
  );
};

const toDisplayName = (fruitId) =>
  fruitId ? fruitId.charAt(0).toUpperCase() + fruitId.slice(1) : "Fruit";

const buildFruitRecords = (fruitNutritionData = {}) => {
  const records = [];

  Object.entries(fruitNutritionData).forEach(([name, nutrients]) => {
    if (!Array.isArray(nutrients)) return;
    records.push({ name, nutrients });
  });

  Object.entries(nutritionById).forEach(([id, nutrients]) => {
    records.push({ name: toDisplayName(id), nutrients });
  });

  const unique = new Map();
  records.forEach((record) => {
    const key = normalize(record.name);
    if (!unique.has(key)) unique.set(key, record);
  });

  return Array.from(unique.values());
};

const findMentionedFruits = (message, records) => {
  const normalizedMessage = normalize(message);
  return records.filter((record) =>
    normalizedMessage.includes(normalize(record.name))
  );
};

const formatNutrientList = (nutrients) =>
  nutrients
    .map((nutrient) => `${nutrient.name}: ${nutrient.amount} ${nutrient.unit}`)
    .join(", ");

const buildMockReply = (message, nutritionContext) => {
  const { fruitNutritionData = {}, currentSelectedFruit } = nutritionContext || {};
  const fruitRecords = buildFruitRecords(fruitNutritionData);
  const fruitEntries = fruitRecords.map((record) => [record.name, record.nutrients]);
  const text = message.toLowerCase();

  if (/^(hi|hello|hey|hi there|hello there)\b/i.test(message.trim())) {
    return "Hi! I'm Anya. I can answer fruit nutrition questions. Ask about a fruit or nutrient.";
  }

  if (/thank|thanks|thx/i.test(text)) {
    return "You are welcome. Ask me another fruit nutrition question.";
  }

  if (/bye|goodbye|see you/i.test(text)) {
    return "Goodbye! Come back anytime for fruit nutrition info.";
  }

  if (!fruitRecords.length) {
    return "I can answer fruit nutrition questions, but I do not have any fruit data right now. This is general information.";
  }

  const nutrientKey = findNutrientKey(message);
  const comparisonIntent = /more|higher|compare|which fruit has|greater/i.test(text);

  const getFruitNames = () => fruitEntries.map(([name]) => name);

  if (comparisonIntent && fruitEntries.length >= 2) {
    const mentioned = findMentionedFruits(message, fruitRecords);
    const [firstFruit, secondFruit] =
      mentioned.length >= 2 ? mentioned.slice(0, 2) : fruitRecords.slice(0, 2);

    const firstName = firstFruit.name;
    const secondName = secondFruit.name;

    const firstValue = findNutrientInList(firstFruit.nutrients, nutrientKey);
    const secondValue = findNutrientInList(secondFruit.nutrients, nutrientKey);

    let comparisonLine = "I can compare these fruits using our data.";
    if (nutrientKey && firstValue && secondValue) {
      const winner = firstValue.amount >= secondValue.amount ? firstName : secondName;
      const loser = winner === firstName ? secondName : firstName;
      const winnerValue = winner === firstName ? firstValue : secondValue;
      const loserValue = winner === firstName ? secondValue : firstValue;

      comparisonLine = `${winner} has more ${nutrientKey} than ${loser}. ${winner}: ${winnerValue.amount} ${winnerValue.unit}. ${loser}: ${loserValue.amount} ${loserValue.unit}.`;
    } else if (nutrientKey && (!firstValue || !secondValue)) {
      comparisonLine = "I do not have that value from our data source.";
    }

    const firstDetails = formatNutrientList(firstFruit.nutrients);
    const secondDetails = formatNutrientList(secondFruit.nutrients);
    return `${comparisonLine} ${firstName} nutrients: ${firstDetails}. ${secondName} nutrients: ${secondDetails}. This is general information.`;
  }

  if (nutrientKey) {
    const fruitNames = getFruitNames();
    const targetFruit =
      fruitEntries.find(([name]) => text.includes(name.toLowerCase())) || fruitEntries[0];

    const [fruitName, nutrients] = targetFruit;
    const nutrient = findNutrientInList(nutrients, nutrientKey);

    if (!nutrient) return "I do not have that value from our data source. This is general information.";

    return `${fruitName} has ${nutrient.name}: ${nutrient.amount} ${nutrient.unit}. This is general information.`;
  }

  if (/immunity|immune/i.test(text)) {
    const immuneFruits = fruitEntries
      .map(([name, nutrients]) => {
        const vitaminC = findNutrientInList(nutrients, "vitamin c");
        return vitaminC ? `${name} (${vitaminC.amount} ${vitaminC.unit} vitamin C)` : null;
      })
      .filter(Boolean);

    if (immuneFruits.length) {
      return `Vitamin C supports immunity. In our data: ${immuneFruits.join(
        ", "
      )}. This is general information.`;
    }
    return "Vitamin C supports immunity. This is general information.";
  }

  if (/energy/i.test(text)) {
    const target =
      fruitEntries.find(([name]) => text.includes(name.toLowerCase())) || fruitEntries[0];
    const [fruitName, nutrients] = target;
    const energy = findNutrientInList(nutrients, "energy");
    if (energy) return `${fruitName} has ${energy.amount} ${energy.unit} of energy. This is general information.`;
    return "Energy comes from carbohydrates in fruit. This is general information.";
  }

  if (/benefit|good for|help|support/i.test(text) && currentSelectedFruit) {
    const match = fruitEntries.find(
      ([name]) => name.toLowerCase() === currentSelectedFruit.toLowerCase()
    );
    const nutrients = match?.[1] || fruitEntries[0][1];
    const topNutrients = nutrients.slice(0, 3).map((n) => n.name).join(", ");
    if (topNutrients) {
      return `${currentSelectedFruit} contains nutrients like ${topNutrients}. This is general information.`;
    }
  }

  return "I can answer questions about fruit nutrients, like vitamin C, fiber, or potassium. Please ask about a fruit or nutrient. This is general information.";
};

const callOllama = async (messages) => {
  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1";

  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data?.message?.content?.trim();
};

const HEALTH_SYSTEM_PROMPT = `Role: AI Nutrition Analyst for NutriXR.
Tone: Supportive, clear, non-medical.
Rules:
- Do not diagnose or prescribe.
- If medical values are abnormal, advise consulting a clinician.
- Keep it practical and food-focused.
- Always end with: "This is general information."
Output format (JSON only):
{
  "summary": "short summary",
  "concerns": ["concern1", "concern2"],
  "recommended_fruits": ["fruit_id_or_name"],
  "limit_fruits": ["fruit_id_or_name"],
  "breakfast_plan": "1-3 sentence plan",
  "notes": "any extra guidance"
}
You must return ONLY valid JSON. No markdown, no code fences, no extra text.
If the report is unclear, still return JSON with empty arrays and a short summary.`;

const RECIPE_SYSTEM_PROMPT = `Role: NutriXR Recipe Generator.
Tone: Friendly, concise.
Rules:
- Use only the provided fruits.
- Provide simple, healthy steps.
- No medical claims.
Output format (JSON only):
{
  "title": "short recipe title",
  "description": "1-2 sentence description",
  "time": 10,
  "servings": 2,
  "ingredients": ["item 1", "item 2"],
  "steps": ["step 1", "step 2"],
  "fruits": ["FruitName1", "FruitName2"]
}
You must return ONLY valid JSON. No markdown, no code fences, no extra text.`;

const extractTextFromFile = async (file) => {
  if (!file || !file.buffer) return '';
  const mime = (file.mimetype || '').toLowerCase();

  if (mime === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return data.text || '';
  }

  if (mime.startsWith('image/')) {
    const worker = await createWorker();
    try {
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(file.buffer);
      return data?.text || '';
    } finally {
      await worker.terminate();
    }
  }

  if (mime.startsWith('text/')) {
    return file.buffer.toString('utf8');
  }

  return '';
};

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null;
  const stripped = text.replace(/```json|```/gi, '').trim();
  const direct = safeJsonParse(stripped);
  if (direct) return direct;

  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return safeJsonParse(match[0]);
};

app.post('/health/analyze', upload.single('report'), async (req, res) => {
  try {
    const notes = typeof req.body?.notes === 'string' ? req.body.notes : '';
    const goals = typeof req.body?.goals === 'string' ? req.body.goals : '';
    const file = req.file;
    const fileText = await extractTextFromFile(file);
    const combinedText = [fileText, notes].filter(Boolean).join('\n\n').trim();

    const trimmedText = (() => {
      const maxChars = 12000;
      if (combinedText.length <= maxChars) return combinedText;
      const head = combinedText.slice(0, 8000);
      const tail = combinedText.slice(-4000);
      return `${head}\n\n[...truncated...]\n\n${tail}`;
    })();

    if (!combinedText) {
      return res.status(400).json({
        reply:
          'Please upload a report or paste key lines to analyze. This is general information.'
      });
    }

    const provider =
      (process.env.DIETITIAN_LLM_PROVIDER || 'openai').toLowerCase();
    const demoMode =
      process.env.DIETITIAN_DEMO_MODE === 'true' || provider === 'demo';
    const requireLlm = process.env.DIETITIAN_REQUIRE_LLM === 'true';

    if (demoMode) {
      return res.json({
        analysis: {
          summary: 'Report analysis is not enabled in demo mode.',
          concerns: [],
          recommended_fruits: [],
          limit_fruits: [],
          breakfast_plan:
            'Focus on whole fruits, fiber, and hydration. This is general information.',
          notes: 'Enable an LLM provider for AI analysis.'
        }
      });
    }

    const fruitIds = Object.keys(FRUIT_LIBRARY || {});
    const messages = [
      { role: 'system', content: HEALTH_SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Allowed fruits (ids or names): ${fruitIds.join(', ')}`
      },
      goals
        ? {
            role: 'system',
            content: `User goals/concerns (prioritize in recommendations): ${goals}`
          }
        : null,
      { role: 'user', content: `Health report text:\n${trimmedText}` }
    ].filter(Boolean);

    let reply = '';
    try {
      if (provider === 'ollama') {
        reply =
          (await callOllama(messages)) ||
          'Sorry, I could not generate a response. This is general information.';
      } else {
        const isGroq = provider === 'groq';
        const apiKey = isGroq
          ? process.env.GROQ_API_KEY
          : process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error(isGroq ? 'Missing GROQ_API_KEY' : 'Missing OPENAI_API_KEY');
        }

        const openai = new OpenAI({
          apiKey,
          baseURL: isGroq
            ? 'https://api.groq.com/openai/v1'
            : process.env.OPENAI_BASE_URL || undefined
        });

        const model = isGroq
          ? process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
          : process.env.OPENAI_MODEL || 'gpt-4o-mini';

        const completion = await openai.chat.completions.create({
          model,
          temperature: 0.2,
          max_tokens: 350,
          messages,
          ...(provider === 'openai' ? { response_format: { type: 'json_object' } } : {})
        });
        reply = completion.choices?.[0]?.message?.content?.trim() || '';
      }
    } catch (error) {
      if (requireLlm) {
        return res.status(503).json({
          reply:
            'The AI service is not available right now. Please ensure your LLM is running. This is general information.'
        });
      }
      reply = '';
    }

    const analysis = extractJsonFromText(reply);
    if (!analysis) {
      return res.json({
        analysis: {
          summary:
            'I could not parse a structured report. Please try again. This is general information.',
          concerns: [],
          recommended_fruits: [],
          limit_fruits: [],
          breakfast_plan:
            'Emphasize whole fruits, fiber, and hydration. This is general information.',
          notes: 'No structured AI response was returned.'
        }
      });
    }

    if (
      typeof analysis.breakfast_plan === 'string' &&
      !/general information/i.test(analysis.breakfast_plan)
    ) {
      analysis.breakfast_plan = `${analysis.breakfast_plan} This is general information.`;
    }

    return res.json({ analysis });
  } catch (error) {
    console.error('Health analyze error:', error);
    return res.status(500).json({
      reply: 'Sorry, something went wrong on the server. This is general information.'
    });
  }
});

app.post('/recipe/generate', async (req, res) => {
  try {
    const { fruits: fruitNames, recipeType } = req.body || {};

    if (!Array.isArray(fruitNames) || fruitNames.length < 2) {
      return res.status(400).json({
        reply: 'Please select at least two fruits. This is general information.'
      });
    }

    const typeLabel = recipeType || 'recipe';
    const provider =
      (process.env.DIETITIAN_LLM_PROVIDER || 'openai').toLowerCase();
    const demoMode =
      process.env.DIETITIAN_DEMO_MODE === 'true' || provider === 'demo';
    const requireLlm = process.env.DIETITIAN_REQUIRE_LLM === 'true';

    if (demoMode) {
      return res.json({
        recipe: {
          title: 'Fruit Fusion Bowl',
          description: 'A simple fruit bowl using your selected fruits.',
          time: 8,
          servings: 2,
          ingredients: fruitNames.map((name) => `${name} (sliced)`),
          steps: [
            'Wash and slice all fruits.',
            'Combine in a bowl and toss gently.',
            'Serve fresh.'
          ],
          fruits: fruitNames
        }
      });
    }

    const messages = [
      { role: 'system', content: RECIPE_SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Recipe type: ${typeLabel}. Fruits: ${fruitNames.join(', ')}`
      },
      { role: 'user', content: 'Generate the recipe now.' }
    ];

    let reply = '';
    try {
      if (provider === 'ollama') {
        reply =
          (await callOllama(messages)) ||
          'Sorry, I could not generate a response.';
      } else {
        const isGroq = provider === 'groq';
        const apiKey = isGroq
          ? process.env.GROQ_API_KEY
          : process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error(isGroq ? 'Missing GROQ_API_KEY' : 'Missing OPENAI_API_KEY');
        }

        const openai = new OpenAI({
          apiKey,
          baseURL: isGroq
            ? 'https://api.groq.com/openai/v1'
            : process.env.OPENAI_BASE_URL || undefined
        });

        const model = isGroq
          ? process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
          : process.env.OPENAI_MODEL || 'gpt-4o-mini';

        const completion = await openai.chat.completions.create({
          model,
          temperature: 0.4,
          max_tokens: 400,
          messages,
          ...(provider === 'openai' ? { response_format: { type: 'json_object' } } : {})
        });
        reply = completion.choices?.[0]?.message?.content?.trim() || '';
      }
    } catch (error) {
      if (requireLlm) {
        return res.status(503).json({
          reply: 'The AI service is not available right now.'
        });
      }
      reply = '';
    }

    const recipe = extractJsonFromText(reply);
    if (!recipe) {
      return res.json({
        recipe: {
          title: 'Fruit Fusion Bowl',
          description: 'A simple fruit bowl using your selected fruits.',
          time: 8,
          servings: 2,
          ingredients: fruitNames.map((name) => `${name} (sliced)`),
          steps: [
            'Wash and slice all fruits.',
            'Combine in a bowl and toss gently.',
            'Serve fresh.'
          ],
          fruits: fruitNames
        }
      });
    }

    recipe.fruits = recipe.fruits && recipe.fruits.length ? recipe.fruits : fruitNames;

    return res.json({ recipe });
  } catch (error) {
    console.error('Recipe generate error:', error);
    return res.status(500).json({
      reply: 'Sorry, something went wrong on the server.'
    });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { userMessage, currentSelectedFruit, fruitNutritionData, chatHistory } =
      req.body || {};

    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ reply: "Please ask a nutrition question." });
    }

    if (isMedicalQuery(userMessage)) {
      return res.json({ reply: buildMedicalSafetyReply() });
    }

    const nutritionContext = {
      currentSelectedFruit: currentSelectedFruit || null,
      fruitNutritionData: fruitNutritionData || {},
    };

    const provider = (process.env.DIETITIAN_LLM_PROVIDER || "openai").toLowerCase();
    const demoMode =
      process.env.DIETITIAN_DEMO_MODE === "true" || provider === "demo";
    const requireLlm = process.env.DIETITIAN_REQUIRE_LLM === "true";

    let reply = "";

    if (!demoMode) {
      try {
        const sanitizedHistory = Array.isArray(chatHistory)
          ? chatHistory.filter(
              (msg) =>
                msg &&
                (msg.role === "user" || msg.role === "assistant") &&
                typeof msg.content === "string"
            )
          : [];
        const trimmedHistory = sanitizedHistory.slice(-8);

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `Nutrition context JSON: ${JSON.stringify(nutritionContext)}`,
          },
          ...trimmedHistory,
          { role: "user", content: userMessage },
        ];

        if (provider === "ollama") {
          reply =
            (await callOllama(messages)) ||
            "Sorry, I could not generate a response. This is general information.";
        } else {
          const isGroq = provider === 'groq';
          const apiKey = isGroq
            ? process.env.GROQ_API_KEY
            : process.env.OPENAI_API_KEY;

          if (!apiKey) {
            throw new Error(
              isGroq ? 'Missing GROQ_API_KEY' : 'Missing OPENAI_API_KEY'
            );
          }

          const openai = new OpenAI({
            apiKey,
            baseURL: isGroq
              ? 'https://api.groq.com/openai/v1'
              : process.env.OPENAI_BASE_URL || undefined
          });

          const model = isGroq
            ? process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
            : process.env.OPENAI_MODEL || 'gpt-4o-mini';
          const completion = await openai.chat.completions.create({
            model,
            temperature: 0.3,
            max_tokens: 220,
            messages,
          });

          reply =
            completion.choices?.[0]?.message?.content?.trim() ||
            "Sorry, I could not generate a response. This is general information.";
        }
      } catch (error) {
        if (requireLlm) {
          return res.status(503).json({
            reply:
              "The AI service is not available right now. Please ensure your LLM is running. This is general information.",
          });
        }
        console.log("Using mock dietitian response");
        reply = buildMockReply(userMessage, nutritionContext);
      }
    } else {
      reply = buildMockReply(userMessage, nutritionContext);
    }

    if (!/general information/i.test(reply)) {
      reply = `${reply} This is general information.`;
    }

    return res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      reply: "Sorry, something went wrong on the server. This is general information.",
    });
  }
});

/**
 * Serve the Vite build (dist/) in production
 * This makes http://localhost:<PORT>/ show the UI
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "dist");

app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Dietitian chat server running on port", PORT));
