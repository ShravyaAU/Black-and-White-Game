/**
 * Size Perception Game Logic (GRA 121 - Black on White / White on Black)
 */

const SizeGame = (function () {
  const BASE_SIZE = 140; // Base reference size in pixels
  const OPTICAL_BALANCED_SIZE = 133; // ~95% of base size due to irradiation illusion
  const MAX_ATTEMPTS = 2;

  let state = {
    currentSize: BASE_SIZE,
    adjustedSquare: 'white', // white square is adjusted against black square base
    locked: false,
    attempt: 1,
    scores: [], // stores score per attempt
    bestScore: 0,
    opticalScore: 0,
    reflectionText: "",
    reflectionScore: 0,
    reflectionSubmitted: false
  };

  function init() {
    loadSavedState();
    renderUI();
  }

  function loadSavedState() {
    const saved = localStorage.getItem("gra121_size_game_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      } catch (e) {
        console.warn("Failed to load size game state:", e);
      }
    }
  }

  function saveState() {
    localStorage.setItem("gra121_size_game_state", JSON.stringify(state));
  }

  function setSize(newSize) {
    if (state.locked) return;
    state.currentSize = Math.max(90, Math.min(190, parseInt(newSize, 10)));
    updateVisuals();
    saveState();
  }

  function stepSize(delta) {
    if (state.locked) return;
    setSize(state.currentSize + delta);
  }

  function updateVisuals() {
    const squareA = document.getElementById("sizeSquareA"); // Black square on White
    const squareB = document.getElementById("sizeSquareB"); // White square on Black
    const sizeVal = document.getElementById("sizeValueDisplay");

    if (squareA && squareB) {
      squareA.style.width = `${BASE_SIZE}px`;
      squareA.style.height = `${BASE_SIZE}px`;

      squareB.style.width = `${state.currentSize}px`;
      squareB.style.height = `${state.currentSize}px`;
    }

    if (sizeVal) {
      const diffPercent = Math.round(((state.currentSize - BASE_SIZE) / BASE_SIZE) * 100);
      const sign = diffPercent > 0 ? "+" : "";
      sizeVal.textContent = `${state.currentSize}px (${sign}${diffPercent}%)`;
    }

    const slider = document.getElementById("sizeSlider");
    if (slider && slider.value !== String(state.currentSize)) {
      slider.value = state.currentSize;
    }
  }

  function calculateOpticalScore(adjustedSize) {
    // Optical balance target is ~133px (white looks equal to 140px black)
    const diff = Math.abs(adjustedSize - OPTICAL_BALANCED_SIZE);
    if (diff <= 2) return 10;
    if (diff <= 5) return 9;
    if (diff <= 8) return 8;
    if (diff <= 12) return 6;
    if (diff <= 18) return 4;
    return 2;
  }

  function submitAnswer() {
    if (state.locked) return;
    state.locked = true;

    const currentScore = calculateOpticalScore(state.currentSize);
    state.opticalScore = currentScore;
    state.scores.push({
      attempt: state.attempt,
      size: state.currentSize,
      score: currentScore
    });

    state.bestScore = Math.max(...state.scores.map(s => s.score));
    saveState();
    renderUI();

    // Announce for accessibility
    const feedback = document.getElementById("sizeFeedback");
    if (feedback) {
      feedback.focus();
    }
  }

  function evaluateReflection(text) {
    if (!text || text.trim().length === 0) {
      return { score: 0, sentences: 0, feedback: "Please enter your reflection paragraph." };
    }

    const cleanText = text.trim();
    // Count sentences using regex split on [.!?]
    const sentenceMatches = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const sentenceCount = sentenceMatches.length;

    // Check key vocabulary related to design principles
    const keywords = [
      "bigger", "smaller", "equal", "perception", "contrast", "background",
      "white", "black", "shrink", "expand", "irradiation", "light", "dark",
      "illusion", "visual", "size", "adjust"
    ];

    const lower = cleanText.toLowerCase();
    let keywordHits = 0;
    keywords.forEach(kw => {
      if (lower.includes(kw)) keywordHits++;
    });

    let score = 0;
    let feedback = "";

    if (sentenceCount < 3) {
      score = Math.min(5, sentenceCount * 2 + Math.min(3, keywordHits));
      feedback = `Your reflection is a bit short (${sentenceCount} sentence${sentenceCount === 1 ? '' : 's'}). Aim for 3–5 complete sentences to get full credit.`;
    } else if (sentenceCount > 7) {
      score = Math.min(8, 6 + Math.min(3, keywordHits));
      feedback = `Good detail (${sentenceCount} sentences), but try to keep your response concise (3–5 sentences).`;
    } else {
      // Ideal sentence count 3-5
      if (keywordHits >= 4) {
        score = 10;
        feedback = `Excellent reflection! (${sentenceCount} sentences). You clearly articulated how value and background contrast affect visual perception.`;
      } else if (keywordHits >= 2) {
        score = 8;
        feedback = `Great job! (${sentenceCount} sentences). To improve, include more specific design terms like contrast, perception, or background lightness.`;
      } else {
        score = 7;
        feedback = `Good effort (${sentenceCount} sentences). Make sure to directly explain what this exercise teaches about light vs. dark shapes in design.`;
      }
    }

    return { score, sentences: sentenceCount, keywordHits, feedback };
  }

  function submitReflection() {
    const textEl = document.getElementById("reflectionInput");
    if (!textEl) return;
    const text = textEl.value;

    const evaluation = evaluateReflection(text);
    state.reflectionText = text;
    state.reflectionScore = evaluation.score;
    state.reflectionSubmitted = true;

    // Update SCORM combined total score
    const totalScore = Math.min(100, Math.round(((state.bestScore + state.reflectionScore) / 20) * 100));
    SCORM.setScore(totalScore, 100);
    if (state.reflectionSubmitted) {
      SCORM.setCompletion("completed");
    }

    saveState();
    renderUI();
  }

  function retryAttempt() {
    if (state.attempt >= MAX_ATTEMPTS) return;
    state.attempt++;
    state.currentSize = BASE_SIZE;
    state.locked = false;
    saveState();
    renderUI();
  }

  function resetAll() {
    state = {
      currentSize: BASE_SIZE,
      adjustedSquare: 'white',
      locked: false,
      attempt: 1,
      scores: [],
      bestScore: 0,
      opticalScore: 0,
      reflectionText: "",
      reflectionScore: 0,
      reflectionSubmitted: false
    };
    localStorage.removeItem("gra121_size_game_state");
    renderUI();
  }

  function renderUI() {
    const container = document.getElementById("sizeGameContainer");
    if (!container) return;

    const totalPoints = state.opticalScore + state.reflectionScore;
    const canRetry = state.locked && state.attempt < MAX_ATTEMPTS;

    container.innerHTML = `
      <div class="card glass-card">
        <div class="game-header-bar">
          <div>
            <span class="badge badge-primary">GRA 121 — Design Principles I</span>
            <h2 class="game-title">Black on White / White on Black Size Illusion</h2>
          </div>
          <div class="attempt-tracker">
            <span class="attempt-pill ${state.attempt >= 1 ? 'active' : ''}">Attempt 1 ${state.scores[0] ? `(${state.scores[0].score}/10 pts)` : ''}</span>
            <span class="attempt-pill ${state.attempt >= 2 ? 'active' : ''}">Attempt 2 ${state.scores[1] ? `(${state.scores[1].score}/10 pts)` : ''}</span>
          </div>
        </div>

        <p class="game-instructions">
          <strong>Instructions:</strong> Light shapes on dark backgrounds often appear larger than dark shapes on light backgrounds (irradiation illusion). 
          Adjust the <strong>White Square</strong> on the right until both center squares appear <em>visually equal</em> in size.
        </p>

        <!-- Side by Side Perception Stage -->
        <div class="perception-stage" aria-label="Visual comparison area with two squares">
          <div class="panel panel-white" id="panelWhite">
            <div class="panel-label">Black Square on White</div>
            <div class="square-wrapper">
              <div class="center-square square-black" id="sizeSquareA" aria-label="Reference black square of fixed 140px size"></div>
            </div>
            <div class="panel-tag">Fixed Reference (140px)</div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="panel panel-black" id="panelBlack">
            <div class="panel-label">White Square on Black</div>
            <div class="square-wrapper">
              <div class="center-square square-white" id="sizeSquareB" aria-label="Adjustable white square"></div>
            </div>
            <div class="panel-tag" id="sizeValueDisplay">${state.currentSize}px</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls-panel">
          <div class="control-row">
            <label for="sizeSlider" class="control-label">
              <span>Adjust White Square Size:</span>
              <span id="sliderValueText" class="value-highlight">${state.currentSize} px</span>
            </label>
            <div class="slider-group">
              <button type="button" class="btn btn-secondary btn-icon" id="btnMinus" ${state.locked ? 'disabled' : ''} aria-label="Decrease size by 1 pixel">-</button>
              <input 
                type="range" 
                id="sizeSlider" 
                min="100" 
                max="180" 
                value="${state.currentSize}" 
                ${state.locked ? 'disabled' : ''}
                aria-label="Square size slider"
              />
              <button type="button" class="btn btn-secondary btn-icon" id="btnPlus" ${state.locked ? 'disabled' : ''} aria-label="Increase size by 1 pixel">+</button>
            </div>
          </div>

          <div class="action-bar">
            ${!state.locked ? `
              <button type="button" class="btn btn-primary btn-lg" id="btnSubmitSize">
                🔒 Lock Your Answer & Check Score
              </button>
            ` : `
              <div class="lock-status-box">
                <span>Answer Locked for Attempt ${state.attempt}</span>
                ${canRetry ? `
                  <button type="button" class="btn btn-warning" id="btnRetrySize">
                    🔄 Try Attempt 2 (Highest score counts)
                  </button>
                ` : `
                  <span class="badge badge-success">Maximum Attempts Reached</span>
                `}
              </div>
            `}
          </div>
        </div>

        <!-- Feedback & Scoring Panel -->
        ${state.locked ? `
          <div class="feedback-card" id="sizeFeedback" tabindex="-1">
            <div class="feedback-header">
              <h3>Score for Attempt ${state.attempt}: <span class="score-number">${state.opticalScore} / 10 pts</span></h3>
              ${state.scores.length > 1 ? `<p>Highest Score Kept: <strong>${state.bestScore} / 10 pts</strong></p>` : ''}
            </div>

            <div class="optical-breakdown">
              <div class="breakdown-item">
                <span class="lbl">Your Adjusted Size:</span>
                <span class="val">${state.currentSize}px (${state.currentSize === BASE_SIZE ? 'Measured Equal' : state.currentSize < BASE_SIZE ? 'Made Smaller' : 'Made Larger'})</span>
              </div>
              <div class="breakdown-item">
                <span class="lbl">True Optical Balance Point:</span>
                <span class="val">~${OPTICAL_BALANCED_SIZE}px (White shrunk by ~5%)</span>
              </div>
              <div class="breakdown-item">
                <span class="lbl">Measured Equal Size:</span>
                <span class="val">140px (100%)</span>
              </div>
            </div>

            <div class="insight-callout">
              💡 <strong>Optical Principle:</strong> White shapes bleed light into surrounding dark areas (irradiation effect), causing white squares to look ~3–7% larger than identical black squares. To make them visually balanced, the white square must actually be slightly smaller!
            </div>
          </div>
        ` : ''}

        <!-- Reflection Section (Required for Credit) -->
        <div class="reflection-section card-nested">
          <div class="section-title">
            <h3>📝 Reflection for Credit (10 Points)</h3>
            <span class="badge ${state.reflectionSubmitted ? 'badge-success' : 'badge-neutral'}">
              ${state.reflectionSubmitted ? `Submitted (${state.reflectionScore}/10 pts)` : 'Required'}
            </span>
          </div>

          <p class="reflection-prompt">
            Write a short paragraph (3–5 sentences) answering:
          </p>
          <ul class="reflection-bullets">
            <li>Which square looked bigger or smaller at first?</li>
            <li>What did you change to make them feel equal?</li>
            <li>What does this tell you about how black and white affect perception in design?</li>
          </ul>

          <div class="reflection-editor">
            <textarea 
              id="reflectionInput" 
              class="form-control" 
              rows="4" 
              placeholder="Example: The white square looked smaller at first. I increased its size slightly until both felt equal. This showed me that light shapes seem to shrink against dark backgrounds..."
              aria-label="Reflection text response"
            >${state.reflectionText}</textarea>

            <div class="editor-footer">
              <span id="charSentenceCount" class="count-text">0 sentences</span>
              <button type="button" class="btn btn-success" id="btnSubmitReflection">
                Submit Reflection
              </button>
            </div>
          </div>

          ${state.reflectionSubmitted ? `
            <div class="reflection-result">
              <h4>Reflection Feedback (Score: ${state.reflectionScore}/10)</h4>
              <p>${evaluateReflection(state.reflectionText).feedback}</p>
            </div>
          ` : ''}
        </div>

        <!-- Total Module Score Card -->
        <div class="total-score-banner">
          <div class="score-column">
            <span>Size Balance Score:</span>
            <strong>${state.bestScore} / 10 pts</strong>
          </div>
          <div class="score-column">
            <span>Reflection Score:</span>
            <strong>${state.reflectionScore} / 10 pts</strong>
          </div>
          <div class="score-column highlight">
            <span>Total Module Grade:</span>
            <strong>${totalPoints} / 20 pts (${Math.round((totalPoints / 20) * 100)}%)</strong>
          </div>
        </div>
      </div>
    `;

    bindEvents();
    updateVisuals();
  }

  function bindEvents() {
    const slider = document.getElementById("sizeSlider");
    if (slider) {
      slider.oninput = (e) => {
        setSize(e.target.value);
        const text = document.getElementById("sliderValueText");
        if (text) text.textContent = `${e.target.value} px`;
      };
    }

    const btnMinus = document.getElementById("btnMinus");
    if (btnMinus) {
      btnMinus.onclick = () => stepSize(-1);
    }

    const btnPlus = document.getElementById("btnPlus");
    if (btnPlus) {
      btnPlus.onclick = () => stepSize(1);
    }

    const btnSubmitSize = document.getElementById("btnSubmitSize");
    if (btnSubmitSize) {
      btnSubmitSize.onclick = submitAnswer;
    }

    const btnRetrySize = document.getElementById("btnRetrySize");
    if (btnRetrySize) {
      btnRetrySize.onclick = retryAttempt;
    }

    const btnSubmitReflection = document.getElementById("btnSubmitReflection");
    if (btnSubmitReflection) {
      btnSubmitReflection.onclick = submitReflection;
    }

    const reflectionInput = document.getElementById("reflectionInput");
    if (reflectionInput) {
      const updateCounts = () => {
        const text = reflectionInput.value;
        const evaluation = evaluateReflection(text);
        const countText = document.getElementById("charSentenceCount");
        if (countText) {
          countText.textContent = `${text.trim().length} chars | ${evaluation.sentences} sentence${evaluation.sentences === 1 ? '' : 's'}`;
        }
      };
      reflectionInput.oninput = updateCounts;
      updateCounts();
    }
  }

  return {
    init,
    resetAll,
    getState: () => ({ ...state })
  };
})();
