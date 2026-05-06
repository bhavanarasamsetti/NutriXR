import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const stats = [
  { label: 'Fruits identified', value: 12800 },
  { label: '3D / AR previews', value: 4200 },
  { label: 'Personalized plans', value: 960 }
];

const navLinks = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'safety', label: 'Safety' },
  { id: 'toolkit', label: 'Toolkit' }
];

const highlightFeatures = [
  {
    title: 'Voice Command',
    desc: 'Select fruits hands-free with voice navigation.',
    icon: 'mic',
    route: '/app'
  },
  {
    title: 'Fruit Slicing View',
    desc: 'See cross-sections with interactive slice depth.',
    icon: 'slice',
    route: '/slice'
  },
  {
    title: 'Smart Suggestor',
    desc: 'Personalized portions based on BMI and reports.',
    icon: 'scale',
    route: '/health?tab=plan'
  },
  {
    title: 'Compare',
    desc: 'Side-by-side nutrients for quick insights.',
    icon: 'compare',
    route: '/compare'
  },
  {
    title: 'Recipes',
    desc: 'Instant recipe ideas based on fruit data.',
    icon: 'chef',
    route: '/recipe'
  },
  {
    title: 'Yoga Hub',
    desc: 'Short yoga clips for health goals.',
    icon: 'yoga',
    route: '/yoga'
  }
];

const toolkit = [
  { title: 'Voice Commands', desc: 'Select fruits hands-free.', icon: 'mic', route: '/app' },
  { title: 'Fruit Scanning', desc: 'Instant recognition via camera or upload.', icon: 'scan', route: '/app' },
  { title: '3D Model Viewer', desc: 'Rotate, zoom, and explore nutrient details.', icon: 'cube', route: '/app' },
  { title: 'AR Mode', desc: 'Place fruits in your environment.', icon: 'ar', route: '/app' },
  { title: 'Fruit Slicing', desc: 'Interactive cross-section analysis.', icon: 'slice', route: '/slice' },
  { title: 'BMI-Based Suggestor', desc: 'Personalized servings aligned to BMI.', icon: 'scale', route: '/health?tab=bmi' },
  { title: 'Health Report Analysis', desc: 'Upload reports for guided insights.', icon: 'doc', route: '/health?tab=report' },
  { title: 'Compare Fruits', desc: 'Side-by-side nutrition comparison.', icon: 'compare', route: '/compare' },
  { title: 'Dietitian Bot', desc: '24/7 nutrition Q&A assistant.', icon: 'chat', route: '/app' },
  { title: 'Semantic Filter', desc: 'Semantic nutrient search & filtering.', icon: 'eye', route: '/semantic-filter' },
  { title: 'Yoga Hub', desc: 'Short yoga clips for health goals.', icon: 'yoga', route: '/yoga' },
  { title: 'Adaptive Layout', desc: 'Adaptive Layout.', icon: 'scale', route: '/adaptive-layout' }
];

const assurances = [
  {
    title: 'Trusted Data Sources',
    desc: 'Nutrition data from USDA and verified databases.',
    icon: 'data'
  },
  {
    title: 'Privacy Friendly',
    desc: 'Your health data stays private and secure.',
    icon: 'shield'
  },
  {
    title: 'Transparent Values',
    desc: 'Clear, accurate nutrition information.',
    icon: 'eye'
  }
];

const steps = [
  { title: 'Scan or Upload', detail: 'Take a photo or scan a fruit.', icon: 'scan' },
  { title: 'Identify Fruit', detail: 'AI identifies the fruit type.', icon: 'cube' },
  { title: 'View 3D Model', detail: 'Explore in interactive 3D.', icon: 'cube' },
  { title: 'Switch to AR', detail: 'Place in your environment.', icon: 'ar' },
  { title: 'Tap to Learn', detail: 'Explore nutrient bubbles.', icon: 'eye' },
  { title: 'Save to Plan', detail: 'Add to breakfast plan.', icon: 'doc' }
];

const footerColumns = [
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', path: '/app' },
      { label: 'API Reference', path: '/app' },
      { label: 'Nutrition Database', path: '/compare' },
      { label: 'Blog', path: '/app' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', path: '/app' },
      { label: 'Terms of Service', path: '/app' },
      { label: 'Cookie Policy', path: '/app' },
      { label: 'Data Sources', section: 'safety' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', path: '/app' },
      { label: 'Contact', path: '/health' },
      { label: 'Careers', path: '/app' },
      { label: 'Press Kit', path: '/app' }
    ]
  }
];

const Icon = ({ name }) => {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  switch (name) {
    case 'mic':
      return (
        <svg {...common}>
          <path d="M15 10V7a3 3 0 0 0-6 0v3a3 3 0 0 0 6 0Z" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      );
    case 'slice':
      return (
        <svg {...common}>
          <path d="M5 15.5 17 5l2 2-9 12H7l-2-3.5Z" />
          <path d="M6.5 13 11 17" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...common}>
          <path d="M12 4v16" />
          <path d="M6 7h12" />
          <path d="M8 7 5 13a3 3 0 1 0 6 0L8 7Z" />
          <path d="M16 7 13 13a3 3 0 1 0 6 0L16 7Z" />
        </svg>
      );
    case 'compare':
      return (
        <svg {...common}>
          <rect x="5" y="4" width="6" height="14" rx="1.2" />
          <rect x="13" y="6" width="6" height="12" rx="1.2" />
          <path d="M8 4V2.5" />
          <path d="M16 6V4.5" />
        </svg>
      );
    case 'scan':
      return (
        <svg {...common}>
          <path d="M4 8V6a2 2 0 0 1 2-2h2" />
          <path d="M14 4h2a2 2 0 0 1 2 2v2" />
          <path d="M4 16v2a2 2 0 0 0 2 2h2" />
          <path d="M14 20h2a2 2 0 0 0 2-2v-2" />
          <rect x="8" y="8" width="8" height="8" rx="1.6" />
        </svg>
      );
    case 'cube':
      return (
        <svg {...common}>
          <path d="M12 3 5 7v10l7 4 7-4V7l-7-4Z" />
          <path d="M5 7 12 11l7-4" />
          <path d="M12 11v10" />
        </svg>
      );
    case 'ar':
      return (
        <svg {...common}>
          <path d="M4 9v6l8 4 8-4V9L12 5 4 9Z" />
          <path d="m12 5 8 4-8 4-8-4 8-4Z" />
          <path d="m9 12 3 1.5L15 12" />
        </svg>
      );
    case 'doc':
      return (
        <svg {...common}>
          <path d="M7 3h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v4h4" />
          <path d="M9 13h6" />
          <path d="M9 9h3" />
          <path d="M9 17h6" />
        </svg>
      );
    case 'yoga':
      return (
        <svg {...common}>
          <circle cx="12" cy="6.5" r="2.2" />
          <path d="M6.5 12.5c2 1.2 3.8 1.2 5.5 0 1.7 1.2 3.5 1.2 5.5 0" />
          <path d="M9 20c1.6-1.8 4.4-1.8 6 0" />
          <path d="M12 9.2v4.2" />
        </svg>
      );
    case 'chef':
      return (
        <svg {...common}>
          <path d="M8 12h8" />
          <path d="M9 12c0-3.5 1-5 3-5s3 1.5 3 5" />
          <path d="M7 12v3a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-3" />
          <path d="M10 6a2 2 0 0 1 4 0" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M6 17.5 4 20v-5.5" />
          <rect x="4" y="4" width="16" height="11" rx="2" />
          <path d="M8 9h8" />
          <path d="M8 12h5" />
        </svg>
      );
    case 'data':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="6" ry="2.5" />
          <path d="M6 6v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6" />
          <path d="M6 12v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 6 5v6c0 3.4 2.4 6.6 6 7.9 3.6-1.3 6-4.5 6-7.9V5l-6-2Z" />
          <path d="M9.5 12.5 11 14l3.5-3.5" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2.5 12S6.5 6.5 12 6.5 21.5 12 21.5 12 17.5 17.5 12 17.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.7" />
          <path d="M12 9.3V7.5" />
        </svg>
      );
    default:
      return null;
  }
};

function LandingPage() {
  const navigate = useNavigate();
  const [statValues, setStatValues] = useState(stats.map(() => 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStatValues(stats.map((item) => item.value));
      return;
    }
    let raf;
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setStatValues(stats.map((item) => Math.floor(item.value * progress)));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  const formatStat = (value) => (value >= 1000 ? `${Math.round(value / 100) / 10}k+` : value);

  return (
    <div className="landing">
      <div className="landing-bg-blur" aria-hidden="true" />
      <header className="landing-nav" aria-label="Primary">
        <div className="nav-shell">
          <div
            className="brand"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/')}
          >
            <img
              src="/icons/appleicon.jpeg"
              alt="NutriXR Apple Icon"
              className="viewer-logo"
            /> NutriXR
          </div>
          <nav className="nav-links">
            {navLinks.map((link) => (
              <button
                key={link.id}
                className="nav-link"
                onClick={() => scrollToSection(link.id)}
                type="button"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="nav-ctas">
            <button
              className="ghost-btn nav-ghost"
              type="button"
              onClick={() => navigate('/login')}
            >
              Login
            </button>

            <button
              className="primary-btn nav-primary"
              type="button"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </div>

        </div>
      </header>

      <main>
        <section className="hero" id="features">
          <div className="hero-content">
            <span className="pill pill-ghost hero-pill">Powered by Augmented Reality</span>
            <h1>
              Learn nutrition through <span className="accent">Augmented Reality</span>
            </h1>
            <p className="hero-sub">
              Scan fruits, use voice commands, slice to see inside, compare nutrition, and get
              personalized diet plans based on your BMI and health reports.
            </p>
            <div className="hero-actions">
              <button className="primary-btn" type="button" onClick={() => navigate('/app')}>
                Start AR Demo
              </button>
              <button
                className="ghost-btn strong"
                type="button"
                onClick={() => scrollToSection('toolkit')}
              >
                View Toolkit
              </button>
            </div>
            <div className="hero-stats" aria-label="Live counters">
              {stats.map((item, idx) => (
                <div key={item.label} className="stat-card">
                  <div className="stat-value">{formatStat(statValues[idx])}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual" aria-label="AR nutrition preview">
            <img
              src="/icons/landing-hero.jpg"
              alt="Augmented Reality nutrition visualization"
              className="hero-image"
            />
          </div>

        </section>

        <section className="section highlight-cards">
          <div className="feature-row">
            {highlightFeatures.map((item) => (
              <button
                key={item.title}
                type="button"
                className="highlight-card"
                onClick={() => navigate(item.route)}
              >
                <span className="icon-badge">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="section toolkit" id="toolkit">
          <div className="section-header center">
            <p className="section-kicker">Everything you need for nutrition learning</p>
            <h2>A complete toolkit for understanding what you eat through interactive AR.</h2>
          </div>
          <div className="toolkit-grid">
            {toolkit.map((item) => (
              <button
                key={item.title}
                className="toolkit-card"
                type="button"
                onClick={() => navigate(item.route)}
              >
                <span className="icon-badge soft">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="section value-props" id="safety">
          <div className="value-grid">
            {assurances.map((item) => (
              <div key={item.title} className="value-card">
                <span className="icon-badge soft">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="safety-note">
            NutriXR supports learning and awareness. It is not intended for medical diagnosis or
            treatment. Always consult a healthcare professional for medical advice.
          </p>
        </section>

        <section className="section cta-band">
          <div className="cta-card">
            <div>
              <h2>Ready to explore nutrition in AR?</h2>
              <p>Join thousands learning about nutrition through immersive experiences.</p>
              <div className="hero-actions">
                <button className="primary-btn light" type="button" onClick={() => navigate('/app')}>
                  Get Started Free
                </button>
                <button
                  className="ghost-btn strong light"
                  type="button"
                  onClick={() => navigate('/app')}
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="section steps" id="how">
          <div className="section-header center">
            <p className="section-kicker">Your nutrition guide in AR</p>
            <h2>Experience nutrition learning step by step.</h2>
          </div>
          <div className="steps-rail">
            {steps.map((step, idx) => (
              <div key={step.title} className="step-card">
                <div className="step-number">{idx + 1}</div>
                <span className="icon-badge ghost">
                  <Icon name={step.icon} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer footer-rich">
        <div className="footer-brand">
          <div className="brand">
            <span className="brand-mark">Nx</span> NutriXR
          </div>
          <p>
            Learn nutrition through immersive Augmented Reality experiences. Explore, compare, and
            understand what you eat.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title} className="footer-col">
            <h4>{column.title}</h4>
            <div className="footer-links">
              {column.links.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="nav-link"
                  onClick={() =>
                    link.section ? scrollToSection(link.section) : navigate(link.path)
                  }
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </footer>
    </div>
  );
}

export default LandingPage;
