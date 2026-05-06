import React from 'react';
import { useNavigate } from 'react-router-dom';

function getPayload() {
  try {
    const raw = sessionStorage.getItem('nutrixr-ar-payload');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse AR payload', err);
    return null;
  }
}

export default function ARPage() {
  const navigate = useNavigate();
  const payload = getPayload();
  const selectedFruit = payload?.fruit || null;
  const modelPath = selectedFruit?.modelPath || '/models/Apple.glb';
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const fallbackUrl = `${base}/ar.html?model=${encodeURIComponent(modelPath.replace(/^\//, ''))}`;

  const fruitName = selectedFruit?.name || 'your fruit';

  return (
    <div className="ar-shell">
      <header className="ar-top">
        <button className="viewer-ghost" onClick={() => navigate('/display')}>
          {'<'} Back to 3D
        </button>
        <div className="ar-mode-chip">AR Mode</div>
      </header>

      <div className="ar-banner">
        To enable AR mode, please allow camera access. Your device needs camera permissions to place the 3D fruit model
        in your real environment.
      </div>

      <div className="ar-hero">
        <div className="ar-icon">AR</div>
        <h1>Experience {fruitName} in AR</h1>
        <p>
          Place this fruit in your real environment. Tap on nutrient bubbles to learn more about each nutritional value.
        </p>
        <button className="ar-cta" onClick={() => window.location.assign(fallbackUrl)}>
          Start AR Experience
        </button>
      </div>

      <footer className="ar-footer">
        <div className="ar-meta">{fruitName}</div>
        <div className="ar-ready">AR Ready</div>
      </footer>
    </div>
  );
}
