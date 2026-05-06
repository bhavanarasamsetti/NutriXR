import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Scene from './components/Scene.jsx';
import NutrientDetails from './components/NutrientDetails.jsx';
import FruitSelector from './components/FruitSelector.jsx'; 
import { generateRecipe } from "./data/recipes.js";
import KnowledgeGraph from './components/KnowledgeGraph.jsx';
import DietitianChat from './components/DietitianChat.jsx';
import { getFruitNutrition } from './api/wikidata.js';
import { checkARSupport } from './utils/ar.js';
import { detectFruitFromImage } from './utils/detectFruitFromImage.js';


const compactOrder = [
  'energy',
  'calories',
  'protein',
  'carbohydrate',
  'carbohydrates',
  'fiber',
  'sugar',
  'vitamin c',
  'vitamin a',
  'potassium',
  'calcium',
  'iron'
];

const nutrientSwatches = {
  energy: '#f97316',
  calories: '#f97316',
  protein: '#2563eb',
  carbohydrate: '#f59e0b',
  carbohydrates: '#f59e0b',
  fiber: '#16a34a',
  sugar: '#ec4899',
  'vitamin c': '#eab308',
  'vitamin a': '#a855f7',
  potassium: '#6366f1',
  calcium: '#06b6d4',
  iron: '#ef4444',
  default: '#94a3b8'
};

function tidyValue(val) {
  if (typeof val !== 'number') return '--';
  if (Math.abs(val) >= 100) return Math.round(val);
  return Number(val).toFixed(1);
}
 

function FruitDisplay() {
  const navigate = useNavigate();
  const location = useLocation();

  const [fruits, setFruits] = useState([]);
  const [selectedFruit, setSelectedFruit] = useState(null);

  const [nutrients, setNutrients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [detectionStatus, setDetectionStatus] = useState('');

  const [sliceMode] = useState(false);
  const [slicePercentage, setSlicePercentage] = useState(100);
  const [selectedNutrient, setSelectedNutrient] = useState(null);
  const [arSupported, setArSupported] = useState(false);
  const [arChecking, setArChecking] = useState(true);
  const [arMessage, setArMessage] = useState('');
  const [expandedNutrientId, setExpandedNutrientId] = useState(null);
  const [filteredFruits, setFilteredFruits] = useState([]);
  const [showArNotification, setShowArNotification] = useState(false);

  
  
  // Check AR support on mount

  useEffect(() => {
    let active = true;
    async function checkAR() {
      const result = await checkARSupport();
      if (active) {
        setArSupported(result.supported);
        setArChecking(false);
      }
    }
    checkAR();
    return () => {
      active = false;
    };
  }, []);
 


  useEffect(() => {
    let cancelled = false;

    async function loadNutrition() {
      if (!selectedFruit) return;
      setLoading(true);
      setError(null);
      setNutrients([]);
      try {
        const data = await getFruitNutrition(selectedFruit.name);
        if (cancelled) return;
        setNutrients(data.nutrients || []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || 'Failed to load nutrition data. Please retry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNutrition();
    return () => {
      cancelled = true;
    };
  }, [selectedFruit]);

  const adjustedNutrients = nutrients.map((nutrient) => ({
    ...nutrient,
    amount: nutrient.amount ? (nutrient.amount * slicePercentage) / 100 : nutrient.amount,
    originalAmount: nutrient.amount
  }));

  useEffect(() => {
    let active = true;
    async function loadFruits() {
      try {
        const modules = import.meta.glob('./data/*.js');
        const inlineKey = Object.keys(modules).find((k) => k.endsWith('fruits.inline.js'));
        const imagesKey = Object.keys(modules).find((k) => k.endsWith('fruits.images.js'));
        const fallbackKey = Object.keys(modules).find((k) => k.endsWith('fruits.js'));
        let mod = null;
        if (inlineKey) {
          mod = await modules[inlineKey]();
        } else if (imagesKey) {
          mod = await modules[imagesKey]();
        } else if (fallbackKey) {
          mod = await modules[fallbackKey]();
        } else {
          mod = { default: [] };
        }
        if (!active) return;
        const fullList = mod.default || [];
        const list = fullList.slice(0, 6);
        setFruits(list);
        setFilteredFruits(list);
      
        if (list.length && !selectedFruit) setSelectedFruit(list[0]);
      } catch (err) {
        console.error('Failed to load fruits data', err);
      }
    }
    loadFruits();
    return () => {
      active = false;
    };
  }, [selectedFruit]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFruits(fruits);
      if (detectionStatus?.includes('from search')) {
    setDetectionStatus('');
  

         }   return;
    }

    const term = searchTerm.toLowerCase();
    const matches = fruits.filter((fruit) => fruit.name.toLowerCase().includes(term));
    setFilteredFruits(matches);

   if (matches.length === 1) {
  setSelectedFruit(matches[0]);
  setDetectionStatus(`Detected "${matches[0].name}" from search.`);
} else if (matches.length === 0) {
  setDetectionStatus('No matching fruits found');
}

  }, [searchTerm, fruits]);

  const matchFruitByName = (input) => {
    if (!input) return null;

    const spoken = input.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const sortedFruits = [...fruits].sort((a, b) => b.name.length - a.name.length);

    let match = sortedFruits.find((f) => f.name.toLowerCase() === spoken);
    if (match) return match;

    match = sortedFruits.find((f) => f.name.toLowerCase().replace(/\s+/g, '') === spoken.replace(/\s+/g, ''));
    if (match) return match;

    match = sortedFruits.find((f) => spoken.includes(f.name.toLowerCase()));
    if (match) return match;

    const spokenWords = spoken.split(/\s+/);
    match = sortedFruits.find((f) => spokenWords.includes(f.name.toLowerCase()));

    return match || null;
  };


  const normalizeFruitId = (value = "") => {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")   // normalize spaces
    .replace(/ies$/, "y")   // berries → berry
    .replace(/s$/, "");     // grapes → grape
};
const handleFile = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

   setDetectionStatus('');

  // 1️⃣ Filename-based detection (FAST + ACCURATE)
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const nameMatch = matchFruitByName(baseName);

  if (nameMatch) {
    setSelectedFruit(nameMatch);
    setDetectionStatus(`Detected from filename: ${nameMatch.name}`);
    addFruitToRecipe(nameMatch.id);
    return;
  }

  // 2️⃣ Teachable Machine detection (NOT MobileNet)
  setDetectionStatus("Analyzing image…");

  const detected = await detectFruitFromImage(file); // TM-based

  if (!detected) {
    setDetectionStatus("Could not recognize fruit");
    return;
  }

  const normalized = normalizeFruitId(detected);

  const fruit = fruits.find(
    (f) =>
      normalizeFruitId(f.id) === normalized ||
      normalizeFruitId(f.name) === normalized
  );

  if (fruit) {
    setSelectedFruit(fruit);
    setDetectionStatus(`Detected from image: ${fruit.name}`);
    addFruitToRecipe(fruit.id);
  } else {
    setDetectionStatus("Fruit detected but not in list");
  }
};


  const handleARMode = async () => {
     if (showArNotification) {
    setShowArNotification(false);
    setArMessage('');
    return;
  }

    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const modelPath = selectedFruit?.modelPath || '/models/Apple.glb';
    const target = `${base}/ar.html?model=${encodeURIComponent(modelPath.replace(/^\//, ''))}`;

    const payload = {
      fruit: selectedFruit
        ? {
            id: selectedFruit.id,
            name: selectedFruit.name,
            modelPath: selectedFruit.modelPath,
            scale: selectedFruit.scale || null
          }
        : null,
      nutrients: adjustedNutrients,
      sliceMode,
      slicePercentage,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem('nutrixr-ar-payload', JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to persist AR payload', err);
    }

    try {
      const supported = await navigator?.xr?.isSessionSupported?.('immersive-ar');
      if (!supported) {
        setArMessage('AR not supported on this device/browser. Please use a WebXR-capable mobile browser.');
setShowArNotification(true);
return;

        return;
      }
      setArMessage('');
    } catch (err) {
      console.warn('WebXR support check failed', err);
      setArMessage('Attempting AR without WebXR check.');
      setShowArNotification(true);
    }

    window.location.assign(target);
  };

  const orderedNutrients = useMemo(() => {
    const names = adjustedNutrients.map((n) => n.name);
    const seen = new Map();
    names.forEach((name) => {
      const key = name?.toLowerCase() || '';
      if (!seen.has(key)) seen.set(key, name);
    });
    return Array.from(seen.values()).sort((a, b) => {
      const aIdx = compactOrder.indexOf(a.toLowerCase());
      const bIdx = compactOrder.indexOf(b.toLowerCase());
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }, [adjustedNutrients]);

  const prioritizedNutrients = useMemo(() => {
    return orderedNutrients
      .map((name) => adjustedNutrients.find((n) => n.name === name))
      .filter(Boolean);
  }, [adjustedNutrients, orderedNutrients]);

  const bubbleNutrients = useMemo(() => prioritizedNutrients.slice(0, 6), [prioritizedNutrients]);
  const summaryNutrients = useMemo(() => prioritizedNutrients.slice(0, 8), [prioritizedNutrients]);

  return (
    <div className="viewer-page">
      <header className="viewer-nav">
        <div className="viewer-nav-left">
          
          <div className="viewer-title">
             <img
           src="/icons/appleicon.jpeg"
             alt="NutriXR Apple Icon"
          className="viewer-logo clickable"
         onClick={() => navigate("/dashboard")}
       title="Go to Dashboard"
         />

          
               NutriXR Viewer
            </div>

        </div>
        <div className="viewer-nav-actions">

          {sliceMode && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                Slice: {slicePercentage}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={slicePercentage}
                onChange={(e) => setSlicePercentage(Number(e.target.value))}
                style={{
                  width: 150,
                  height: 6,
                  borderRadius: 3,
                  outline: 'none',
                  accentColor: '#3B82F6'
                }}
              />
            </div>
          )}

        
        </div>
      </header>

      <div className="viewer-grid">
        <div className="viewer-canvas-card">

        <section className="canvas-area" aria-label="Main area">
          <Scene
            fruit={selectedFruit}
            sliceMode={sliceMode}
            nutrients={nutrients}
            selectedNutrient={selectedNutrient}
            onSelectNutrient={setSelectedNutrient}
          />
        </section>

        
              {expandedNutrientId && selectedFruit && (
             <KnowledgeGraph
              nutrients={adjustedNutrients}
              selectedNutrient={expandedNutrientId === 'all' ? null : selectedNutrient}
              onClose={() => {
                setExpandedNutrientId(null);
                setSelectedNutrient(null);
              }}
                fruitName={selectedFruit.name}
                fruitEmoji={selectedFruit.emoji || '🍌'}
             />
             )}



          <div className="viewer-cta-row">
            <button className="primary-cta" onClick={handleARMode} disabled={arChecking}>
              Switch to AR Mode
            </button>
            <div className="info-hint">
             <span className="info-icon">ℹ️</span>
              <span>Tap nutrient bubbles to explore detailed values</span>
           </div>
            
          </div>
        </div>

        <aside className="viewer-side">
          
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Nutrition Summary</div>
            </div>
            <div className="summary-list">
              {loading && <div className="detect-status">Loading nutrition data...</div>}
              {error && <div className="detect-status warning">{error}</div>}
              {!loading &&
                !error &&
                summaryNutrients.map((n) => (
                  <div className="summary-row" key={n?.id || n?.name}>
                    <div>{n?.name}</div>
                    <span
                      className="summary-pill"
                      style={{
                        background: `${nutrientSwatches[n?.name?.toLowerCase()] || nutrientSwatches.default}20`,
                        color: nutrientSwatches[n?.name?.toLowerCase()] || nutrientSwatches.default
                      }}
                    >
                      {tidyValue(n?.amount)} {n?.unit || ''}
                    </span>
                  </div>
                ))}
            </div>
          </div>

        </aside>
      </div>

      {showArNotification && arMessage && (
  <div
    className="ar-toast"
    onClick={() => {
      setShowArNotification(false);
      setArMessage('');
    }}
  >
    <strong>AR Notice</strong>
    <p>{arMessage}</p>
    <span className="toast-hint">Tap to dismiss</span>
  </div>
)}

    </div>

  );
}

export default FruitDisplay;
