import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import fruits from '../data/fruits';
import {
  HEALTH_GOALS,
  FRUIT_LIBRARY,
  buildRecommendations,
  computeBmi,
  parseHealthConcerns
} from '../data/healthRecommendations';

const union = (base = [], next = []) => {
  const set = new Set(base);
  next.forEach((item) => item && set.add(item));
  return Array.from(set);
};

const resolveFruitMeta = (id) => {
  if (!id) return null;
  if (FRUIT_LIBRARY[id]) return { id, ...FRUIT_LIBRARY[id] };
  const match = fruits.find(
    (fruit) => fruit.id === id || fruit.name.toLowerCase() === id.toLowerCase()
  );
  if (match) {
    return {
      id: match.id,
      name: match.name,
      emoji: match.emoji || '🍎',
      portion: '1 serving',
      note: 'Great choice to keep on rotation.'
    };
  }
  return null;
};

const SuggestionCard = ({ fruitId, tone = 'recommended' }) => {
  const meta = resolveFruitMeta(fruitId);
  if (!meta) return null;
  const badge = tone === 'limit' ? 'Limit intake' : 'Recommended';
  const badgeClass = tone === 'limit' ? 'health-badge warning' : 'health-badge';

  return (
    <div className="health-tile">
      <div className="health-tile__header">
        <span className="health-emoji" aria-hidden="true">
          {meta.emoji || '🍎'}
        </span>
        <div>
          <div className="health-tile__title">{meta.name}</div>
          <div className={badgeClass}>{badge}</div>
        </div>
      </div>
      <p className="health-tile__note">{meta.note}</p>
      <p className="health-tile__portion">
        Portion: <strong>{meta.portion || '1 serving'}</strong>
      </p>
    </div>
  );
};

function HealthProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('bmi');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [bmiResult, setBmiResult] = useState(null);
  const [bmiError, setBmiError] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [reportMessage, setReportMessage] = useState(
    'We analyze locally and only keep nutrition insights.'
  );
  const [reportFileName, setReportFileName] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const recommendations = useMemo(
    () =>
      buildRecommendations({
        bmiCategory: bmiResult?.category,
        goals: selectedGoals
      }),
    [bmiResult, selectedGoals]
  );

  const normalizeFruitId = (value) => {
    if (!value) return null;
    const lower = value.toLowerCase().trim();
    if (FRUIT_LIBRARY[lower]) return lower;
    const libraryMatch = Object.keys(FRUIT_LIBRARY).find(
      (id) => FRUIT_LIBRARY[id].name.toLowerCase() === lower
    );
    if (libraryMatch) return libraryMatch;
    const fruitMatch = fruits.find(
      (fruit) =>
        fruit.id.toLowerCase() === lower || fruit.name.toLowerCase() === lower
    );
    return fruitMatch?.id || null;
  };

  const mapAiFruits = (list = []) =>
    Array.from(
      new Set(
        list
          .map((item) => normalizeFruitId(item))
          .filter(Boolean)
      )
    );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['bmi', 'report', 'plan'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const toggleGoal = (goalId) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleBmi = () => {
    const result = computeBmi(weight, height);
    if (!result) {
      setBmiError('Enter weight (kg) and height (cm) to calculate BMI.');
      setBmiResult(null);
      return;
    }
    setBmiError('');
    setBmiResult(result);
    if (result.category === 'overweight' || result.category === 'obese') {
      setSelectedGoals((prev) => union(prev, ['weight_loss']));
    }

    const bmiNotes = [
      `BMI value: ${result.value}`,
      `BMI category: ${result.category}`,
      age ? `Age: ${age}` : null,
      `Weight: ${weight} kg`,
      `Height: ${height} cm`
    ]
      .filter(Boolean)
      .join('\n');
    runAiAnalysis({ file: null, notes: bmiNotes });
  };

  const analyzeTextForConcerns = (text) => {
    const detected = parseHealthConcerns(text);
    if (detected.length) {
      setSelectedGoals((prev) => union(prev, detected));
      setReportMessage(`Detected concerns: ${detected.join(', ')}`);
    } else {
      setReportMessage('No specific markers found. You can pick concerns manually.');
    }
  };

  const runAiAnalysis = async ({ file, notes }) => {
    setIsAnalyzing(true);
    setAiError('');
    setAiAnalysis(null);
    try {
      const formData = new FormData();
      if (file) formData.append('report', file);
      if (notes) formData.append('notes', notes);
      if (selectedGoals.length) {
        const goalLabels = selectedGoals
          .map((id) => HEALTH_GOALS.find((goal) => goal.id === id)?.label)
          .filter(Boolean);
        formData.append('goals', goalLabels.join(', '));
      }

      const response = await fetch('/health/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      if (data?.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiError('No analysis returned.');
      }
    } catch (error) {
      setAiError('Unable to analyze the report right now.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReportFile = (file) => {
    if (!file) return;
    setAiError('');
    setReportFileName(file.name);
    setReportMessage('Analyzing report...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = typeof event.target.result === 'string' ? event.target.result : '';
      if (!text) {
        setReportMessage('Could not read the file. Try a text/PDF file or add notes.');
        runAiAnalysis({ file, notes: notesInput });
        return;
      }
      analyzeTextForConcerns(text);
      runAiAnalysis({ file, notes: notesInput });
    };
    reader.onerror = () => {
      setReportMessage('Could not read the file. Try again or paste key notes.');
      runAiAnalysis({ file, notes: notesInput });
    };
    reader.readAsText(file);
  };

  const handleNotesAnalyze = () => {
    if (!notesInput.trim()) {
      setAiError('Paste notes or upload a report to analyze.');
      return;
    }
    setAiError('');
    analyzeTextForConcerns(notesInput);
    runAiAnalysis({ file: null, notes: notesInput });
  };

  return (
    <div className="health-page">
      <header className="health-header">
        <div className="health-nav-left">
          <button type="button" className="health-back" onClick={() => navigate("/dashboard")}>
            <span className="health-back-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M14.5 6.5l-5 5 5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Back</span>
          </button>
          <div className="health-nav-title">
            <span className="health-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 3l1.6 4.6 4.8.1-3.8 2.8 1.4 4.5-4-2.7-4 2.7 1.4-4.5-3.8-2.8 4.8-.1L12 3z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>Health Profile</span>
          </div>
        </div>
      </header>
      <p className="health-subtitle">Personalized fruit picks from BMI and your health report.</p>

      <div className="health-tabs" role="tablist" aria-label="Health profile sections">
        <button
          type="button"
          className={activeTab === 'bmi' ? 'health-tab active' : 'health-tab'}
          onClick={() => setActiveTab('bmi')}
          role="tab"
          aria-selected={activeTab === 'bmi'}
        >
          ⚖️ BMI & Profile
        </button>
        <button
          type="button"
          className={activeTab === 'report' ? 'health-tab active' : 'health-tab'}
          onClick={() => setActiveTab('report')}
          role="tab"
          aria-selected={activeTab === 'report'}
        >
          📄 Health Report
        </button>
        <button
          type="button"
          className={activeTab === 'plan' ? 'health-tab active' : 'health-tab'}
          onClick={() => setActiveTab('plan')}
          role="tab"
          aria-selected={activeTab === 'plan'}
        >
          🍽️ Breakfast Plan
        </button>
      </div>

      {activeTab === 'bmi' && (
        <div className="health-grid">
          <div className="health-card">
            <div className="health-card__header">
              <h3>BMI Calculator</h3>
              <p>Use your latest measurements to tune fruit suggestions.</p>
            </div>
            <div className="health-form">
              <label>
                Weight (kg)
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                />
              </label>
              <label>
                Height (cm)
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                />
              </label>
              <button type="button" className="primary-btn" onClick={handleBmi}>
                Calculate BMI
              </button>
              {bmiError && <p className="health-error">{bmiError}</p>}
              {bmiResult && (
                <div className="health-bmi-result">
                  <div>
                    <p className="health-bmi-value">{bmiResult.value}</p>
                    <p className="health-bmi-label">{bmiResult.label}</p>
                  </div>
                  <p className="health-bmi-note">{bmiResult.note}</p>
                </div>
              )}
              {aiAnalysis && (
                <div className="health-ai">
                  <p><strong>AI summary:</strong> {aiAnalysis.summary}</p>
                  {aiAnalysis.breakfast_plan && (
                    <p><strong>AI plan:</strong> {aiAnalysis.breakfast_plan}</p>
                  )}
                  {aiAnalysis.notes && <p><strong>AI notes:</strong> {aiAnalysis.notes}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="health-card">
            <div className="health-card__header">
              <h3>Health Goals</h3>
              <p>Select your goals to personalize fruit picks.</p>
            </div>
            <div className="health-goals">
              {HEALTH_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className={
                    selectedGoals.includes(goal.id) ? 'goal-chip selected' : 'goal-chip'
                  }
                  onClick={() => toggleGoal(goal.id)}
                >
                  <span className="goal-icon" aria-hidden="true">
                    {goal.icon}
                  </span>
                  <span>{goal.label}</span>
                </button>
              ))}
            </div>
            <div className="health-hint">
              Tap to toggle. We will combine BMI + goals to pick fruits.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="health-grid single">
          <div className="health-card">
            <div className="health-card__header">
              <h3>Upload Health Report</h3>
              <p>{reportMessage}</p>
            </div>
            <label className="upload-drop">
              <input
                type="file"
                accept=".pdf,.txt,.json,.png,.jpg,.jpeg"
                onChange={(e) => handleReportFile(e.target.files?.[0])}
                hidden
              />
              <div className="upload-body">
                <div className="upload-icon">⬆️</div>
                <p className="upload-title">Drop your health report here</p>
                <p className="upload-sub">PDF, JPG, PNG, TXT (max 10MB)</p>
                {reportFileName && <p className="upload-file">{reportFileName}</p>}
              </div>
            </label>

            <div className="notes-block">
              <label>
                Paste important lines (lab values or clinician notes)
                <textarea
                  rows="3"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. HbA1c 6.8%, LDL 160 mg/dL, mild anemia"
                />
              </label>
              <div className="notes-actions">
                <button type="button" className="ghost-btn" onClick={() => setNotesInput('')}>
                  Clear
                </button>
                <button type="button" className="primary-btn" onClick={handleNotesAnalyze}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze notes'}
                </button>
              </div>
            </div>

            <div className="health-goals mini">
              {HEALTH_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className={
                    selectedGoals.includes(goal.id) ? 'goal-chip selected' : 'goal-chip'
                  }
                  onClick={() => toggleGoal(goal.id)}
                >
                  <span className="goal-icon" aria-hidden="true">
                    {goal.icon}
                  </span>
                  <span>{goal.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="health-card">
            <div className="health-card__header">
              <h3>AI Report Analysis</h3>
              <p>Personalized insights from your report and notes.</p>
            </div>
            {aiError && <p className="health-error">{aiError}</p>}
            {!aiError && !aiAnalysis && (
              <p className="health-hint">
                Upload a report or analyze notes to see AI insights.
              </p>
            )}
            {aiAnalysis && (
              <div className="health-ai">
                <p><strong>Summary:</strong> {aiAnalysis.summary}</p>
                {Array.isArray(aiAnalysis.concerns) && aiAnalysis.concerns.length > 0 && (
                  <p><strong>Concerns:</strong> {aiAnalysis.concerns.join(', ')}</p>
                )}
                {aiAnalysis.breakfast_plan && (
                  <p><strong>Breakfast plan:</strong> {aiAnalysis.breakfast_plan}</p>
                )}
                {aiAnalysis.notes && <p><strong>Notes:</strong> {aiAnalysis.notes}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="health-grid plan">
          <div className="health-card full">
            <div className="health-card__header">
              <h3>Personalized Breakfast Fruits</h3>
              <p>
                Based on your BMI and selected concerns. Always confirm with a clinician for
                medical decisions.
              </p>
              <div className="health-reasons">
                {recommendations.reasons.map((reason) => (
                  <span key={reason} className="reason-pill">
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            <div className="health-tiles">
              {(() => {
                const aiRecommended = mapAiFruits(aiAnalysis?.recommended_fruits || []);
                const aiLimit = mapAiFruits(aiAnalysis?.limit_fruits || []);
                const recommendedList = aiRecommended.length
                  ? aiRecommended
                  : recommendations.recommended;
                const limitList = aiLimit.length ? aiLimit : recommendations.limit;

                return (
                  <>
                    {recommendedList.map((id) => (
                      <SuggestionCard key={id} fruitId={id} tone="recommended" />
                    ))}
                    {limitList.map((id) => (
                      <SuggestionCard key={`limit-${id}`} fruitId={id} tone="limit" />
                    ))}
                  </>
                );
              })()}
            </div>

            {aiAnalysis && (
              <div className="health-ai">
                <p><strong>AI breakfast plan:</strong> {aiAnalysis.breakfast_plan}</p>
                {aiAnalysis.notes && <p><strong>AI notes:</strong> {aiAnalysis.notes}</p>}
              </div>
            )}

            <div className="health-disclaimer">
              These suggestions are general nutrition guidance, not medical advice.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthProfile;
