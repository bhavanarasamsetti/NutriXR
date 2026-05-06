import React, { useEffect, useMemo, useRef, useState } from 'react';
import nutritionById from '../data/nutrition.js';
import chatResponses from "../data/chatResponses";
import { useLocation } from "react-router-dom";

import "./chat.css";

const CHIP_CLASS = {
  "Compare apple vs banana": "chip-compare",
  "Diabetes-friendly breakfast": "chip-health",
  "Quick smoothie recipe": "chip-recipe",
  "Vitamins in oranges?": "chip-nutrition",
  "Low calorie fruit snacks": "chip-diet",
  "High fiber fruits": "chip-fiber",
};


const SUGGESTIONS = [
  "Compare apple vs banana",
  "Diabetes-friendly breakfast",
  "Quick smoothie recipe",
  "Vitamins in oranges?",
  "Low calorie fruit snacks",
  "High fiber fruits"
];



/* const SUGGESTIONS = [
  'How much vitamin C is in kiwi?',
  'Which fruit has more fibre: apple or banana?',
  'Is banana good for energy?',
  'What nutrients support immunity?'
];*/

const FALLBACK_ERROR =
  'Sorry, I could not reach the dietitian service right now. This is general information.';
const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function DietitianChat({
  fruits = [],
  selectedFruit,
  currentNutrients = [],
  mode = "drawer"
}) {
  
    const location = useLocation();
   const isScannerPage = location.pathname === "/scanner";

  const [isOpen, setIsOpen] = useState(mode === "page");
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm Anya, your AI Dietitian Assistant for NutriXR. Ask me about fruit nutrients.",
      id: 'intro'
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fruitMatchers = useMemo(
    () =>
      fruits.map((fruit) => ({
        id: fruit.id,
        name: fruit.name,
        matchers: [fruit.id.toLowerCase(), fruit.name.toLowerCase()]
      })),
    [fruits]
  );

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const buildFruitContext = (message) => {
    const normalized = message.toLowerCase();
    const ids = new Set();

    if (selectedFruit?.id) {
      ids.add(selectedFruit.id);
    }

    fruitMatchers.forEach((fruit) => {
      if (fruit.matchers.some((matcher) => normalized.includes(matcher))) {
        ids.add(fruit.id);
      }
    });

    const context = {};
    Array.from(ids).forEach((id) => {
      if (!id) return;
      const fruitMeta = fruits.find((fruit) => fruit.id === id);
      const fruitName = fruitMeta?.name || id;
      const nutrients =
        id === selectedFruit?.id && currentNutrients.length
          ? currentNutrients
          : nutritionById[id];

      if (!nutrients) return;

      context[fruitName] = nutrients.map((nutrient) => ({
        name: nutrient.name,
        amount: nutrient.amount,
        unit: nutrient.unit,
        benefit: nutrient.benefit
      }));
    });

    return context;
  };
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ""); // remove ? ! . :
};

const getHardcodedReply = (userMessage) => {
  const normalizedUserText = normalizeText(userMessage);

  for (const question in chatResponses) {
    const normalizedQuestion = normalizeText(question);

    if (normalizedUserText === normalizedQuestion) {
      return chatResponses[question];
    }
  }

  return null;
};



  const sendMessage = async (message) => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    const userMessage = { role: 'user', content: trimmed, id: createId() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
  
try {
  // 1️⃣ Check hardcoded responses FIRST
  const hardcodedReply = getHardcodedReply(trimmed);

  if (hardcodedReply) {
  setMessages((prev) => [
    ...prev,
    { role: 'assistant', content: hardcodedReply, id: createId() }
  ]);
  setIsSending(false); // ✅ ADD THIS
  return;
}


  // 2️⃣ Existing logic stays exactly the same

      const chatHistory = messages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-8)
        .map(({ role, content }) => ({ role, content }));
      const payload = {
        userMessage: trimmed,
        currentSelectedFruit: selectedFruit?.name ?? null,
        fruitNutritionData: buildFruitContext(trimmed),
        chatHistory
      };

      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = await response.json();
      const reply =
        typeof data?.reply === 'string' && data.reply.trim()
          ? data.reply.trim()
          : FALLBACK_ERROR;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, id: createId() }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: FALLBACK_ERROR, id: createId() }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <>
 
{mode === "drawer" && !isScannerPage && (
  <div className="chat-launcher-fixed" onClick={() => setIsOpen(prev => !prev)}>
    <div className="girl-orb">
      <model-viewer
        src="/models/Punk%20Girl.glb"
        auto-rotate
        rotation-per-second="8deg"
        camera-controls={false}
        disable-zoom
        interaction-prompt="none"
        exposure="1.3"
        tone-mapping="neutral"
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          pointerEvents: "none"
        }}
      ></model-viewer>
    </div>
  </div>
)}






      <section
  id="dietitian-chat-drawer"
  className={
    mode === "page"
      ? "chat-page"
      : `chat-drawer ${isOpen ? "open" : ""}`
  }
  aria-live="polite"
>


 {mode !== "page" && (
  <header className="chat-header">
    <div>
      <h2>AI Dietitian Chatbot</h2>
      <p>Short, friendly nutrition help grounded in fruit data.</p>
    </div>
  </header>
)}


        <div className="chat-body">
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                <p>{message.content}</p>
              </div>
            ))}
            {isSending ? (
              <div className="chat-message assistant">
                <p>Thinking...</p>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

<div className="chat-suggestions-wrapper">
  <div className="chat-suggestions" aria-label="Quick suggestions">
    {SUGGESTIONS.map((suggestion) => (
      <button
        key={suggestion}
        type="button"
        className={`chat-chip ${CHIP_CLASS[suggestion] || ""}`}
        onClick={() => sendMessage(suggestion)}
      >
        {suggestion}
      </button>
    ))}
  </div>
</div>




        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about fruit nutrients..."
          
          />
         <button
    type="submit"
    className="send-btn"
    disabled={isSending || !input.trim()}
    
  >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
       <path d="M3 12L21 3L14 21L11 13L3 12Z" fill="white"/>
       </svg>
      </button>
       </form>

        <div className="chat-disclaimer">
          This chatbot provides general nutrition information, not medical advice.
        </div>

      </section>
    </>
  );
}

export default DietitianChat;
