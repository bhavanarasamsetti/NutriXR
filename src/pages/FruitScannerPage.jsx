import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FruitScanner from "../detection/FruitScanner.jsx";




export default function FruitScannerPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const handledRef = useRef(false);
  useEffect(() => {
  handledRef.current = false;
}, []);

  const normalizeName = (v = "") =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/ies$/, "y")
    .replace(/ves$/, "f")
    .replace(/s$/, "");

  
 const handleDetected = (detectedFruit) => {
  if (!detectedFruit) return;

  if (handledRef.current) return;
  handledRef.current = true;
const normalized = normalizeName(detectedFruit);

  setStatus(`Detected "${detectedFruit}" from camera`);

  sessionStorage.setItem("nutrixr-selected-fruit", normalized);

  navigate("/dashboard");
};



  return (
    <div style={{ padding: 20 }}>
      <h2>Fruit Scanner</h2>
      <FruitScanner onFruitDetected={handleDetected} />
      {status && <div>{status}</div>}
    </div>
  );
}
