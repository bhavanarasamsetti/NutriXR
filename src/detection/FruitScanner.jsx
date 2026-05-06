import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

// ✅ LOCAL MODEL PATH
const MODEL_URL = "/models/";

function FruitScanner({ onFruitDetected }) {
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const streamRef = useRef(null);
  const runningRef = useRef(false);

  const historyRef = useRef([]);
  const cameraStartTimeRef = useRef(0);

  const [scannerOn, setScannerOn] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState("");

  /* =======================
     LOAD MODEL
  ======================= */
  useEffect(() => {
    let active = true;

    async function loadModel() {
      try {
        const modelURL = MODEL_URL + "model.json";
        const metaURL = MODEL_URL + "metadata.json";

        const model = await tmImage.load(modelURL, metaURL);
        if (!active) return;

        modelRef.current = model;
        setModelLoaded(true);
        console.log("✅ Model loaded");
      } catch (err) {
        console.error(err);
        setError("Failed to load model");
      }
    }

    loadModel();
    return () => { active = false; };
  }, []);

  /* =======================
     CAMERA START / STOP
  ======================= */
  useEffect(() => {
    if (!scannerOn) {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [scannerOn]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        }
      });

      streamRef.current = stream;
      cameraStartTimeRef.current = Date.now();
      historyRef.current = [];

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Camera access denied");
      setScannerOn(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    runningRef.current = false;
    historyRef.current = [];
  }

  /* =======================
     DETECTION LOOP
  ======================= */
  useEffect(() => {
    if (!scannerOn || !modelLoaded) return;

    runningRef.current = true;
    runDetection();

    return () => { runningRef.current = false; };

  }, [scannerOn, modelLoaded]);

  async function runDetection() {
    if (!runningRef.current) return;

    // ⏱ Ignore first 2 seconds (camera blur)
    if (Date.now() - cameraStartTimeRef.current < 2000) {
      requestAnimationFrame(runDetection);
      return;
    }

    if (
      !videoRef.current ||
      videoRef.current.readyState !== 4 ||
      !modelRef.current
    ) {
      requestAnimationFrame(runDetection);
      return;
    }

    try {
      const predictions = await modelRef.current.predict(videoRef.current);

      let best = null;

      predictions.forEach(p => {
        if (!best || p.probability > best.probability) {
          best = p;
        }
      });

      if (best && best.className !== "notfruit" && best.probability > 0.85) {
        confirmResult(best.className);
      }

    } catch (err) {
      console.error(err);
    }

    requestAnimationFrame(runDetection);
  }

  /* =======================
     STABLE CONFIRMATION
  ======================= */
  function confirmResult(fruit) {
    const history = historyRef.current;
    history.push(fruit);

    if (history.length > 8) history.shift();

    const count = history.filter(f => f === fruit).length;

    if (history.length >= 8 && count >= 6) {
      runningRef.current = false;
      setScannerOn(false);
      onFruitDetected(fruit);
    }
  }

  /* =======================
     UI
  ======================= */
  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h3>Fruit Scanner</h3>

      <button
        onClick={() => setScannerOn(prev => !prev)}
        disabled={!modelLoaded}
        className="action-button"
      >
        {scannerOn ? "Stop Scanner" : "Start Scanner"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {scannerOn && (
        <>
          <p style={{ fontSize: 13, color: "#666" }}>
            Hold the fruit still for a moment…
          </p>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              marginTop: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: 420
            }}
          />
        </>
      )}
    </div>
  );
}

export default FruitScanner;
