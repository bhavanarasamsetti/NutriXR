import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import TopNav from "../components/TopNav";
import LeftSidebar from "../components/LeftSidebar";
import FruitGrid from "../components/FruitGrid";
import RightPanel from "../components/RightPanel";
import { detectFruitFromImage } from "../utils/detectFruitFromImage";
import { getFruitNutrition } from "../api/wikidata";
import { fruitCategories } from "../data/fruitCategories";

import DietitianChat from "../components/DietitianChat";


import "../components/Dashboard.css";


export default function DashboardNew() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const [fruits, setFruits] = useState([]);
  const [filteredFruits, setFilteredFruits] = useState([]);
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [search, setSearch] = useState("");
  const [detectionStatus, setDetectionStatus] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [scanLocked, setScanLocked] = useState(false);

  // 🎙 Voice
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  /* -------------------- VOICE SETUP -------------------- */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const rawText = event.results[0][0].transcript;

      const spokenText = rawText
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();

      setSearch(spokenText);
      setDetectionStatus(`🎤 Detected: ${spokenText}`);
      setIsListening(false);
    };


    recognition.onerror = () => {
      setDetectionStatus("🎤 Voice recognition failed");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const startVoiceRecognition = () => {
    if (!recognitionRef.current || isListening) return;
    setIsListening(true);
    setDetectionStatus("🎙 Listening...");
    recognitionRef.current.start();
  };

  /* -------------------- LOAD FRUITS -------------------- */
  useEffect(() => {
    async function loadFruits() {
      const modules = import.meta.glob("../data/*.js");
      const key = Object.keys(modules).find(k => k.includes("fruits"));
      const mod = await modules[key]();
      const list = mod.default || [];

      setFruits(list);
     
      const stored = sessionStorage.getItem("nutrixr-selected-fruit");

      if (stored) {
        const normalized = stored.toLowerCase().trim();

        const normalize = (v = "") =>
          v
            .toLowerCase()
            .trim()
            .replace(/[^a-z\s]/g, "")
            .replace(/\s+/g, " ")
            .replace(/ies$/, "y")   // blueberries → blueberry
            .replace(/ves$/, "f")   // leaves → leaf
            .replace(/s$/, "");     // grapes → grape


        const detected = normalize(normalized);

        const match = list.find(f => {
          const name = normalize(f.name);
          const id = normalize(f.id || "");

          return (
            name === detected ||
            id === detected ||
            name.includes(detected) ||
            detected.includes(name)
          );
        });


        if (match) {
          setScanLocked(true); 

          setSelectedFruit(match);
          setFilteredFruits([match]);
          setSearch(match.name);
          setActiveCategory("All");
        }


        sessionStorage.removeItem("nutrixr-selected-fruit");
        return;
      }



      // default behavior
      setFilteredFruits(list);
    }

    loadFruits();
  }, []);


  /* -------------------- FILTERING -------------------- */
  useEffect(() => {
    if (scanLocked && selectedFruit) return;

    let result = fruits;

    if (activeCategory !== "All") {
      const allowedIds = fruitCategories[activeCategory] || [];
      result = result.filter(f => allowedIds.includes(f.id));
    }

    if (search) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredFruits(result);
  }, [search, activeCategory, fruits, scanLocked]);


  /* -------------------- IMAGE UPLOAD -------------------- */
  const normalizeFruitId = (v = "") =>
    v
      .toLowerCase()
      .trim()
      .replace(/[_-]/g, " ")
      .replace(/ies$/, "y")      // berries → berry
      .replace(/ves$/, "f")      // leaves → leaf
      .replace(/s$/, "")         // grapes → grape
      .replace(/\s+/g, " ");

  const matchFruitByName = (input) => {
    if (!input) return null;
    const spoken = input.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    return fruits.find(f => spoken.includes(f.name.toLowerCase()));
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    const nameMatch = matchFruitByName(baseName);

    if (nameMatch) {
      setSelectedFruit(nameMatch);
      setFilteredFruits([nameMatch]);
      setDetectionStatus(`Detected from filename: ${nameMatch.name}`);
      return;
    }

    setDetectionStatus("Analyzing image...");
    const detected = await detectFruitFromImage(file);

    if (!detected) {
      setDetectionStatus("Could not recognize fruit");
      return;
    }

    const normalized = normalizeFruitId(detected);
    const fruit =
      fruits.find(f => normalizeFruitId(f.id) === normalized) ||
      fruits.find(f => normalizeFruitId(f.name) === normalized) ||
      fruits.find(f => normalized.includes(normalizeFruitId(f.name))) ||
      fruits.find(f => normalizeFruitId(f.name).includes(normalized));


    if (fruit) {
      setSelectedFruit(fruit);
      setFilteredFruits([fruit]);
      setDetectionStatus(`Detected from image: ${fruit.name}`);
    } else {
      setDetectionStatus("Fruit detected but not in list");
    }
  };

  /* -------------------- AR OPEN -------------------- */
  const handleOpenAR = async (fruit) => {
    if (!fruit) return;

    let nutrients = [];
    try {
      const data = await getFruitNutrition(fruit.name);
      nutrients = data?.nutrients || [];
    } catch (err) {
      console.warn("Failed to load nutrients for AR payload", err);
    }

    try {
      const payload = { fruit, nutrients, timestamp: Date.now() };
      sessionStorage.setItem("nutrixr-selected-fruit", fruit.id || fruit.name);
      sessionStorage.setItem("nutrixr-ar-payload", JSON.stringify(payload));
      localStorage.setItem("nutrixr-ar-payload", JSON.stringify(payload));
    } catch { }

    navigate("/ar");
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0b1220',
        color: '#fff',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <TopNav />

      <div className="dashboard-layout">
        <LeftSidebar
          search={search}
          setSearch={setSearch}
          setScanLocked={setScanLocked}
          onUpload={handleFile}
          onStartScanner={() => navigate("/scanner")}
          detectionStatus={detectionStatus}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          voice={startVoiceRecognition}
          isListening={isListening}
        />


        <main className="dashboard-main">
          <h2>Select a Fruit</h2>
          <FruitGrid
            fruits={filteredFruits}
            selectedFruit={selectedFruit}
            onSelect={setSelectedFruit}
            onOpenAR={handleOpenAR}
          />
        </main>

        <RightPanel />
      </div>
      {/* Floating chatbot – dashboard only */}
      <DietitianChat />
    </>
  );
}
