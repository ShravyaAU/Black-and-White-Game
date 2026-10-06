/**
 * ASU GRA 121 — 10-Question Black on White / White on Black Size Perception Game
 * Removes pixel numbers during gameplay to test true visual perception without giving away numerical answers.
 */

const MAX_ATTEMPTS = 2;
const TOTAL_ROUNDS = 10;

// 10 Rounds with constant Black on White / White on Black colors, varying reference sizes & initial offsets
const ROUNDS = [
  {
    roundNum: 1,
    title: "Question 1 of 10",
    baseSize: 120,
    targetOpticalSize: 114,
    initialSize: 145,
    principle: "Light shapes bleed into dark backgrounds (irradiation effect), causing white squares to look ~3–7% larger than identical black squares."
  },
  {
    roundNum: 2,
    title: "Question 2 of 10",
    baseSize: 150,
    targetOpticalSize: 142,
    initialSize: 110,
    principle: "At larger scales, irradiation edge bleeding increases, requiring a slightly smaller white square to balance visually."
  },
  {
    roundNum: 3,
    title: "Question 3 of 10",
    baseSize: 100,
    targetOpticalSize: 95,
    initialSize: 130,
    principle: "Compact shapes test your precision threshold for light vs. dark contrast balance."
  },
  {
    roundNum: 4,
    title: "Question 4 of 10",
    baseSize: 175,
    targetOpticalSize: 166,
    initialSize: 140,
    principle: "Large surface areas expand light shape perception across adjacent borders."
  },
  {
    roundNum: 5,
    title: "Question 5 of 10",
    baseSize: 130,
    targetOpticalSize: 123,
    initialSize: 160,
    principle: "Medium size balance tests fine motor drag precision."
  },
  {
    roundNum: 6,
    title: "Question 6 of 10",
    baseSize: 160,
    targetOpticalSize: 152,
    initialSize: 125,
    principle: "High contrast edges create visual tension between light and dark boundaries."
  },
  {
    roundNum: 7,
    title: "Question 7 of 10",
    baseSize: 110,
    targetOpticalSize: 104,
    initialSize: 140,
    principle: "Small white squares against dark backgrounds appear larger than equal-size black squares on white."
  },
  {
    roundNum: 8,
    title: "Question 8 of 10",
    baseSize: 185,
    targetOpticalSize: 176,
    initialSize: 150,
    principle: "Substantial size scale tests peripheral visual balance."
  },
  {
    roundNum: 9,
    title: "Question 9 of 10",
    baseSize: 140,
    targetOpticalSize: 133,
    initialSize: 175,
    principle: "Standard GRA 121 reference benchmark size."
  },
  {
    roundNum: 10,
    title: "Question 10 of 10",
    baseSize: 200,
    targetOpticalSize: 190,
    initialSize: 160,
    principle: "Maximum scale test evaluating overall visual size perception accuracy."
  }
];

let studentName = "";
let currentRoundIndex = 0;
let userAnswers = []; // Array of { roundNum, yourSize, targetSize, baseSize, score }
let currentSize = 140;
let isDragging = false;
let startX = 0;
let startY = 0;
let startWidth = 140;
let attempt = 1;
let roundSubmitted = false;
let reflectionScore = 0;

document.addEventListener("DOMContentLoaded", () => {
  setupDragToResize();
  bindEvents();
});

// Game Initialization
function startGame() {
  const nameInput = document.getElementById("studentNameInput");
  studentName = nameInput ? nameInput.value.trim() : "Student";
  if (!studentName) studentName = "Student";

  document.getElementById("displayStudentName").textContent = studentName;
  document.getElementById("startModal").classList.add("hidden");

  currentRoundIndex = 0;
  userAnswers = [];
  renderRound(0);
}

// Render Round UI
function renderRound(index) {
  if (index >= TOTAL_ROUNDS) {
    showReflectionSection();
    return;
  }

  const r = ROUNDS[index];
  roundSubmitted = false;

  // Make sure perception stage elements are visible during questions
  document.getElementById("perceptionStage").style.display = "grid";
  document.getElementById("questionInstructions").style.display = "block";
  document.getElementById("reflectionSection").style.display = "none";
  document.getElementById("reflectionSection").classList.add("hidden");

  // Header & Progress
  document.getElementById("progressText").textContent = `Question ${index + 1} of ${TOTAL_ROUNDS}`;
  document.getElementById("questionTitle").textContent = r.title;
  document.getElementById("questionBadge").textContent = `Round ${index + 1}`;
  
  const totalScoreSoFar = userAnswers.reduce((sum, a) => sum + a.score, 0);
  document.getElementById("displayTotalScore").textContent = `${totalScoreSoFar} / 100 pts`;

  const progressFill = document.getElementById("progressBarFill");
  if (progressFill) progressFill.style.width = `${((index + 1) / TOTAL_ROUNDS) * 100}%`;

  // Left Panel (Panel A: White Background, Black Square)
  const panelA = document.getElementById("panelA");
  const panelTitleA = document.getElementById("panelTitleA");
  const fixedSquare = document.getElementById("fixedSquare");
  const fixedTag = document.getElementById("fixedTag");

  panelA.className = "stage-panel panel-white";
  panelA.style.backgroundColor = "#ffffff";
  panelTitleA.textContent = "Black Square on White";
  
  fixedSquare.className = "target-square square-black";
  fixedSquare.style.backgroundColor = "#000000";
  fixedSquare.style.width = `${r.baseSize}px`;
  fixedSquare.style.height = `${r.baseSize}px`;
  fixedTag.textContent = "Reference Square";

  // Right Panel (Panel B: Black Background, White Square)
  const panelB = document.getElementById("panelB");
  const panelTitleB = document.getElementById("panelTitleB");
  const adjustableSquare = document.getElementById("adjustableSquare");
  const sizeTag = document.getElementById("sizeTag");

  panelB.className = "stage-panel panel-black";
  panelB.style.backgroundColor = "#000000";
  panelTitleB.textContent = "White Square on Black";

  adjustableSquare.className = "target-square square-white";
  adjustableSquare.style.backgroundColor = "#ffffff";
  currentSize = r.initialSize;
  adjustableSquare.style.width = `${currentSize}px`;
  adjustableSquare.style.height = `${currentSize}px`;

  sizeTag.textContent = "Adjustable Square";

  // Reset Buttons & Feedback
  const btnSubmit = document.getElementById("btnSubmitSize");
  btnSubmit.style.display = "inline-flex";
  btnSubmit.classList.remove("hidden");
  btnSubmit.disabled = false;

  const btnNext = document.getElementById("btnNextQuestion");
  btnNext.style.display = "none";
  btnNext.classList.add("hidden");

  document.getElementById("roundFeedbackCard").classList.add("hidden");
}

// Drag to Resize Logic
function setupDragToResize() {
  const square = document.getElementById("adjustableSquare");
  const handle = document.getElementById("dragHandle");

  if (!square || !handle) return;

  function onDragStart(e) {
    if (roundSubmitted) return;
    isDragging = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    startWidth = currentSize;

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("touchend", onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging || roundSubmitted) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    const delta = (deltaX + deltaY) / 2;
    let newSize = Math.round(startWidth + delta);

    newSize = Math.max(60, Math.min(240, newSize));
    currentSize = newSize;

    square.style.width = `${currentSize}px`;
    square.style.height = `${currentSize}px`;
  }

  function onDragEnd() {
    isDragging = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);
  }

  handle.addEventListener("mousedown", onDragStart);
  handle.addEventListener("touchstart", onDragStart, { passive: false });

  square.addEventListener("mousedown", (e) => {
    if (e.target === handle || e.target === square || handle.contains(e.target)) onDragStart(e);
  });
  square.addEventListener("touchstart", (e) => {
    if (e.target === handle || e.target === square || handle.contains(e.target)) onDragStart(e);
  }, { passive: false });
}

// Scoring Algorithm per Question
function calculateRoundScore(adjustedSize, targetSize) {
  const diff = Math.abs(adjustedSize - targetSize);
  if (diff <= 2) return 10;
  if (diff <= 4) return 9;
  if (diff <= 7) return 8;
  if (diff <= 10) return 7;
  if (diff <= 14) return 5;
  if (diff <= 19) return 3;
  return 1;
}

function submitRoundSize() {
  if (roundSubmitted) return;
  roundSubmitted = true;

  const r = ROUNDS[currentRoundIndex];
  const score = calculateRoundScore(currentSize, r.targetOpticalSize);

  userAnswers.push({
    roundNum: r.roundNum,
    title: r.title,
    yourSize: currentSize,
    targetSize: r.targetOpticalSize,
    baseSize: r.baseSize,
    score: score
  });

  const totalScore = userAnswers.reduce((sum, a) => sum + a.score, 0);
  document.getElementById("displayTotalScore").textContent = `${totalScore} / 100 pts`;

  // UI Feedback Banner (Reveals numerical size measurements ONLY after submission!)
  const fbCard = document.getElementById("roundFeedbackCard");
  const fbTitle = document.getElementById("roundFeedbackTitle");
  const fbDetail = document.getElementById("roundFeedbackDetail");

  fbTitle.textContent = `Question ${r.roundNum} Result: ${score} / 10 pts`;
  fbDetail.innerHTML = `
    <strong>Your Adjusted Size:</strong> ${currentSize}px | <strong>Reference Black Square:</strong> ${r.baseSize}px | <strong>Target Optical Balance:</strong> ~${r.targetOpticalSize}px<br/>
    <strong>Optical Insight:</strong> ${r.principle}
  `;
  fbCard.classList.remove("hidden");

  const btnSubmit = document.getElementById("btnSubmitSize");
  btnSubmit.style.display = "none";
  btnSubmit.classList.add("hidden");

  const nextBtn = document.getElementById("btnNextQuestion");
  nextBtn.style.display = "inline-flex";
  nextBtn.classList.remove("hidden");
  nextBtn.textContent = currentRoundIndex === TOTAL_ROUNDS - 1 ? "Proceed to Final Reflection ➔" : "Next Question ➔";
}

function nextQuestion() {
  currentRoundIndex++;
  if (currentRoundIndex >= TOTAL_ROUNDS) {
    showReflectionSection();
  } else {
    renderRound(currentRoundIndex);
  }
}

function showReflectionSection() {
  document.getElementById("questionTitle").textContent = "Final Reflection Step";
  document.getElementById("questionBadge").textContent = "Complete!";
  document.getElementById("progressText").textContent = "Question 10 of 10 Completed";
  document.getElementById("progressBarFill").style.width = "100%";

  // Explicitly hide all question panels and buttons
  document.getElementById("perceptionStage").style.display = "none";
  document.getElementById("questionInstructions").style.display = "none";
  document.getElementById("roundFeedbackCard").style.display = "none";
  
  const btnSubmit = document.getElementById("btnSubmitSize");
  const btnNext = document.getElementById("btnNextQuestion");
  btnSubmit.style.display = "none";
  btnNext.style.display = "none";
  btnSubmit.classList.add("hidden");
  btnNext.classList.add("hidden");

  // Show Reflection Box
  const refSection = document.getElementById("reflectionSection");
  refSection.style.display = "block";
  refSection.classList.remove("hidden");
}

function evaluateReflection(text) {
  if (!text || text.trim().length === 0) return { score: 0, feedback: "No reflection provided." };

  const cleanText = text.trim();
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const count = sentences.length;

  const keywords = ["bigger", "smaller", "equal", "perception", "contrast", "background", "white", "black", "shrink", "expand", "irradiation", "light", "dark", "balance", "size"];
  const lower = cleanText.toLowerCase();
  let keywordHits = 0;
  keywords.forEach(kw => { if (lower.includes(kw)) keywordHits++; });

  if (count < 3) {
    return { score: Math.min(6, count * 2 + Math.min(2, keywordHits)), feedback: "Reflection is under 3 sentences. Aim for 3–5 sentences for full credit." };
  } else if (count > 6) {
    return { score: Math.min(8, 6 + Math.min(3, keywordHits)), feedback: "Good depth, though aim for conciseness (3–5 sentences)." };
  } else {
    if (keywordHits >= 3) {
      return { score: 10, feedback: "Excellent reflection! You accurately described how square size and contrast affect perceived visual balance across all 10 questions." };
    } else {
      return { score: 8, feedback: "Great work! Consider adding design terms like background contrast or visual size." };
    }
  }
}

function bindEvents() {
  const btnSubmitSize = document.getElementById("btnSubmitSize");
  if (btnSubmitSize) btnSubmitSize.onclick = submitRoundSize;

  const btnNextQuestion = document.getElementById("btnNextQuestion");
  if (btnNextQuestion) btnNextQuestion.onclick = nextQuestion;

  const reflectionInput = document.getElementById("reflectionInput");
  if (reflectionInput) {
    reflectionInput.oninput = () => {
      const text = reflectionInput.value.trim();
      const count = text ? text.split(/[.!?]+/).filter(s => s.trim().length > 5).length : 0;
      document.getElementById("sentenceCounter").textContent = `${count} sentence${count === 1 ? '' : 's'}`;
    };
  }

  const btnSubmitFinal = document.getElementById("btnSubmitFinal");
  if (btnSubmitFinal) {
    btnSubmitFinal.onclick = () => {
      const text = reflectionInput ? reflectionInput.value : "";
      const evaluation = evaluateReflection(text);
      reflectionScore = evaluation.score;
      showScorecardPopup(evaluation.feedback);
    };
  }

  const btnPlayAgain = document.getElementById("btnPlayAgain");
  if (btnPlayAgain) {
    btnPlayAgain.onclick = () => {
      if (attempt >= MAX_ATTEMPTS) {
        alert("Maximum 2 attempts reached! Your highest score has been logged.");
        return;
      }
      attempt++;
      document.getElementById("attemptDisplay").textContent = `${attempt} of 2`;

      // Reset game
      document.getElementById("scorecardModal").classList.add("hidden");
      if (reflectionInput) reflectionInput.value = "";
      currentRoundIndex = 0;
      userAnswers = [];
      renderRound(0);
    };
  }
}

function showScorecardPopup(feedbackText) {
  document.getElementById("scStudentName").textContent = studentName;
  document.getElementById("scAttempt").textContent = `${attempt} of ${MAX_ATTEMPTS}`;

  const perceptionTotal = userAnswers.reduce((sum, a) => sum + a.score, 0);
  document.getElementById("scSizeScore").textContent = `${perceptionTotal} / 100 pts`;
  document.getElementById("scReflectionScore").textContent = `${reflectionScore} / 10 pts`;

  const finalTotal = perceptionTotal + reflectionScore;
  const percent = Math.round((finalTotal / 110) * 100);
  document.getElementById("scTotalScore").textContent = `${finalTotal} / 110 pts (${percent}%)`;

  // Render Question Breakdown Table
  const tbody = document.getElementById("scBreakdownBody");
  if (tbody) {
    tbody.innerHTML = "";
    userAnswers.forEach((ans) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>Q${ans.roundNum}</td>
        <td>Ref: ${ans.baseSize}px</td>
        <td>${ans.yourSize}px</td>
        <td>~${ans.targetSize}px</td>
        <td><strong>${ans.score}/10</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }

  const feedbackEl = document.getElementById("scFeedbackMsg");
  feedbackEl.innerHTML = `
    <strong>Feedback:</strong> ${feedbackText}
  `;

  const modal = document.getElementById("scorecardModal");
  modal.classList.remove("hidden");
}
