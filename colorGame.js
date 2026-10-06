/**
 * Color Perception Game Logic (Simultaneous Contrast Illusion)
 * Based on requirement specification from Color Game Java Script.docx
 */

const ColorGame = (function () {
  const TOTAL_ROUNDS = 10;
  let roundIndex = 0;
  let score = 0;
  let answered = false;
  let rounds = [];
  let userChoices = [];

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomColor() {
    return `rgb(${randomInt(30, 225)}, ${randomInt(30, 225)}, ${randomInt(30, 225)})`;
  }

  function slightlyDifferent(color) {
    let nums = color.match(/\d+/g).map(Number);
    // Ensure noticeable subtle shift (at least 12 units diff in at least one channel)
    let deltaR = (Math.random() < 0.5 ? -1 : 1) * randomInt(12, 22);
    let deltaG = (Math.random() < 0.5 ? -1 : 1) * randomInt(12, 22);
    let deltaB = (Math.random() < 0.5 ? -1 : 1) * randomInt(12, 22);

    let r = Math.min(255, Math.max(0, nums[0] + deltaR));
    let g = Math.min(255, Math.max(0, nums[1] + deltaG));
    let b = Math.min(255, Math.max(0, nums[2] + deltaB));

    return `rgb(${r}, ${g}, ${b})`;
  }

  function shuffle(array) {
    return array.slice().sort(() => Math.random() - 0.5);
  }

  function buildRound(n) {
    const isSame = [1, 3, 4, 6, 7, 9].includes(n);
    let bgA = randomColor();
    // Ensure background B contrasts differently from bgA
    let bgB = randomColor();
    let centerBase = randomColor();
    let centerA = centerBase;
    let centerB = isSame ? centerBase : slightlyDifferent(centerBase);

    return {
      roundNum: n,
      bgA,
      bgB,
      centerA,
      centerB,
      answer: isSame ? "same" : "different"
    };
  }

  function buildGame() {
    rounds = [];
    userChoices = [];
    for (let i = 1; i <= TOTAL_ROUNDS; i++) {
      rounds.push(buildRound(i));
    }
  }

  function init() {
    buildGame();
    roundIndex = 0;
    score = 0;
    answered = false;
    renderContainer();
    renderRound();
  }

  function renderContainer() {
    const container = document.getElementById("colorGameContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="card glass-card">
        <div class="game-header-bar">
          <div>
            <span class="badge badge-accent">GRA 121 — Design Principles I</span>
            <h2 class="game-title">Simultaneous Contrast Color Illusion Challenge</h2>
          </div>
          <div class="score-badge">
            <span id="scoreText">Score: 0 / 100</span>
          </div>
        </div>

        <p class="game-instructions">
          <strong>Instructions:</strong> Background colors drastically alter how human eyes perceive adjacent center colors.
          In each round, decide if the <strong>two center squares</strong> are identical in color (<strong>SAME</strong>) or slightly non-identical (<strong>DIFFERENT</strong>).
        </p>

        <!-- Progress Tracker -->
        <div class="progress-bar-container">
          <div class="progress-labels">
            <span id="roundCounterText">Round 1 / ${TOTAL_ROUNDS}</span>
            <span id="progressPercentText">0% Complete</span>
          </div>
          <div class="progress-track">
            <div id="colorProgressBar" class="progress-fill" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Color Stage -->
        <div class="perception-stage color-stage" aria-label="Color comparison stage with two panels">
          <div class="panel color-panel" id="panelA">
            <div class="panel-label light-text">Panel A</div>
            <div class="square-wrapper">
              <div class="centerSquare" id="squareA" aria-label="Center square color A"></div>
            </div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="panel color-panel" id="panelB">
            <div class="panel-label light-text">Panel B</div>
            <div class="square-wrapper">
              <div class="centerSquare" id="squareB" aria-label="Center square color B"></div>
            </div>
          </div>
        </div>

        <!-- Answer Options -->
        <div class="answer-section">
          <div id="answerButtons" class="answer-buttons-grid"></div>
        </div>

        <!-- Feedback Box -->
        <div class="feedback-banner" id="colorFeedback" tabindex="-1">
          <div id="feedbackMsg" class="feedback-text">Select your answer above to test your optical perception.</div>
          <div id="rgbInfo" class="rgb-info hidden"></div>
        </div>

        <!-- Navigation Buttons -->
        <div class="action-bar flex-between">
          <button type="button" class="btn btn-secondary" id="restartBtn">
            🔄 Restart Challenge
          </button>
          <button type="button" class="btn btn-primary" id="nextBtn" disabled>
            Next Round ➔
          </button>
        </div>
      </div>
    `;

    document.getElementById("nextBtn").onclick = nextRound;
    document.getElementById("restartBtn").onclick = restartGame;
  }

  function renderRound() {
    if (roundIndex >= TOTAL_ROUNDS) return;

    const r = rounds[roundIndex];

    const roundText = document.getElementById("roundCounterText");
    if (roundText) roundText.textContent = `Round ${roundIndex + 1} / ${TOTAL_ROUNDS}`;

    const scoreText = document.getElementById("scoreText");
    if (scoreText) scoreText.textContent = `Score: ${score} / 100`;

    const progressFill = document.getElementById("colorProgressBar");
    if (progressFill) progressFill.style.width = `${(roundIndex / TOTAL_ROUNDS) * 100}%`;

    const progressPercent = document.getElementById("progressPercentText");
    if (progressPercent) progressPercent.textContent = `${Math.round((roundIndex / TOTAL_ROUNDS) * 100)}% Complete`;

    const panelA = document.getElementById("panelA");
    const panelB = document.getElementById("panelB");
    if (panelA && panelB) {
      panelA.style.backgroundColor = r.bgA;
      panelB.style.backgroundColor = r.bgB;
    }

    const squareA = document.getElementById("squareA");
    const squareB = document.getElementById("squareB");
    if (squareA && squareB) {
      squareA.style.backgroundColor = r.centerA;
      squareB.style.backgroundColor = r.centerB;
    }

    const rgbInfo = document.getElementById("rgbInfo");
    if (rgbInfo) {
      rgbInfo.classList.add("hidden");
      rgbInfo.innerHTML = "";
    }

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) nextBtn.disabled = true;

    renderAnswers();
  }

  function renderAnswers() {
    const container = document.getElementById("answerButtons");
    if (!container) return;
    container.innerHTML = "";

    const options = ["same", "different"];
    options.forEach(option => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-choice";
      btn.textContent = option.toUpperCase();
      btn.setAttribute("aria-label", `Select option ${option}`);
      btn.onclick = () => handleAnswer(option);
      container.appendChild(btn);
    });
  }

  function handleAnswer(choice) {
    if (answered) return;
    answered = true;

    const current = rounds[roundIndex];
    const correct = choice === current.answer;

    if (correct) {
      score += 10;
    }

    userChoices.push({
      round: roundIndex + 1,
      userChoice: choice,
      correctChoice: current.answer,
      isCorrect: correct
    });

    const scoreText = document.getElementById("scoreText");
    if (scoreText) scoreText.textContent = `Score: ${score} / 100`;

    const buttons = document.querySelectorAll("#answerButtons button");
    buttons.forEach(btn => {
      const value = btn.textContent.toLowerCase();
      btn.disabled = true;
      if (value === current.answer) {
        btn.classList.add("btn-correct");
      }
      if (value === choice && value !== current.answer) {
        btn.classList.add("btn-wrong");
      }
    });

    const feedbackEl = document.getElementById("feedbackMsg");
    if (feedbackEl) {
      feedbackEl.innerHTML = correct
        ? `<strong class="text-success">✔ Correct!</strong> Your eye held steady despite the background shift.`
        : `<strong class="text-danger">✖ Not quite.</strong> The surrounding background colors shifted your perception!`;
    }

    const rgbInfo = document.getElementById("rgbInfo");
    if (rgbInfo) {
      rgbInfo.classList.remove("hidden");
      rgbInfo.innerHTML = `
        <span>Square A Color: <code>${current.centerA}</code></span>
        <span>Square B Color: <code>${current.centerB}</code></span>
        <span>Actual Relation: <strong>${current.answer.toUpperCase()}</strong></span>
      `;
    }

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) nextBtn.disabled = false;

    if (roundIndex === TOTAL_ROUNDS - 1) {
      finishGame();
    }
  }

  function nextRound() {
    if (!answered) return;
    roundIndex++;
    answered = false;

    const feedbackEl = document.getElementById("feedbackMsg");
    if (feedbackEl) {
      feedbackEl.textContent = "New round loaded. Watch how the backgrounds affect your perception!";
    }

    if (roundIndex < TOTAL_ROUNDS) {
      renderRound();
    }
  }

  function finishGame() {
    // Record score in SCORM LMS
    SCORM.setScore(score, 100);
    SCORM.setCompletion("completed");
    SCORM.save();

    const progressFill = document.getElementById("colorProgressBar");
    if (progressFill) progressFill.style.width = "100%";

    const feedbackEl = document.getElementById("feedbackMsg");
    if (feedbackEl) {
      feedbackEl.innerHTML = `
        <div class="completion-banner">
          🎉 <strong>Challenge Completed!</strong><br/>
          Final Score: <strong class="highlight-score">${score} / 100</strong> (${score >= 80 ? 'Master Eye!' : score >= 60 ? 'Good Perception' : 'Perception Shifted'})
        </div>
      `;
    }

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent = "Finished!";
    }
  }

  function restartGame() {
    buildGame();
    roundIndex = 0;
    score = 0;
    answered = false;

    const feedbackEl = document.getElementById("feedbackMsg");
    if (feedbackEl) {
      feedbackEl.textContent = "Fresh set of colors loaded. Good luck!";
    }

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.textContent = "Next Round ➔";
    }

    renderRound();
  }

  return {
    init,
    restartGame,
    getState: () => ({ score, roundIndex, TOTAL_ROUNDS })
  };
})();
