const TOTAL_ROUNDS = 10;

let roundIndex = 0;
let score = 0;
let answered = false;

let rounds = [];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomColor() {
  return `rgb(${randomInt(20,235)},${randomInt(20,235)},${randomInt(20,235)})`;
}

function slightlyDifferent(color) {
  let nums = color.match(/\d+/g).map(Number);

  nums[0] = Math.min(255, Math.max(0, nums[0] + randomInt(-10, 10)));
  nums[1] = Math.min(255, Math.max(0, nums[1] + randomInt(-10, 10)));
  nums[2] = Math.min(255, Math.max(0, nums[2] + randomInt(-10, 10)));

  return `rgb(${nums[0]},${nums[1]},${nums[2]})`;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function buildRound(n) {

  const isSame = [1,3,4,6,7,9].includes(n);

  let bgA = randomColor();
  let bgB = randomColor();

  let centerBase = randomColor();

  let centerA = centerBase;
  let centerB = isSame ? centerBase : slightlyDifferent(centerBase);

  return {
    bgA,
    bgB,
    centerA,
    centerB,
    answer: isSame ? "same" : "different"
  };
}

function buildGame() {
  rounds = [];
  for (let i = 1; i <= TOTAL_ROUNDS; i++) {
    rounds.push(buildRound(i));
  }
}

function renderRound() {

  const r = rounds[roundIndex];

  document.getElementById("round").textContent =
    `Round ${roundIndex + 1} / ${TOTAL_ROUNDS}`;

  document.getElementById("score").textContent =
    `Score: ${score}`;

  document.getElementById("progressBar").style.width =
    ((roundIndex) / TOTAL_ROUNDS * 100) + "%";

  const panelA = document.getElementById("panelA");
  const panelB = document.getElementById("panelB");

  panelA.style.background = r.bgA;
  panelB.style.background = r.bgB;

  panelA.innerHTML = "";
  panelB.innerHTML = "";

  const squareA = document.createElement("div");
  squareA.className = "centerSquare";
  squareA.style.background = r.centerA;

  const squareB = document.createElement("div");
  squareB.className = "centerSquare";
  squareB.style.background = r.centerB;

  panelA.appendChild(squareA);
  panelB.appendChild(squareB);

  renderAnswers();
}

function renderAnswers() {

  const container = document.getElementById("answerButtons");
  container.innerHTML = "";

  const options = shuffle(["same", "different"]);

  options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option.toUpperCase();

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

  const buttons = document.querySelectorAll("#answerButtons button");

  buttons.forEach(btn => {

    const value = btn.textContent.toLowerCase();

    btn.disabled = true;

    if (value === current.answer) {
      btn.classList.add("correct");
    }

    if (value === choice && value !== current.answer) {
      btn.classList.add("wrong");
    }
  });

  document.getElementById("feedback").textContent =
    correct
      ? "Correct — your eye held steady."
      : "Not quite — the background shifted your perception.";

  document.getElementById("nextBtn").disabled = false;

  if (roundIndex === TOTAL_ROUNDS - 1) {
    finishGame();
  }
}

function nextRound() {

  if (!answered) return;

  roundIndex++;
  answered = false;

  document.getElementById("feedback").textContent =
    "New round. The illusion changes.";

  renderRound();

  document.getElementById("nextBtn").disabled = true;
}

function finishGame() {

  scormSetScore(score, 100);
  scormSetCompletion("completed");
  scormSave();

  document.getElementById("feedback").textContent =
    `Final score: ${score} / 100`;
}

function restartGame() {

  buildGame();

  roundIndex = 0;
  score = 0;
  answered = false;

  document.getElementById("feedback").textContent =
    "Fresh set of colors loaded.";

  renderRound();
}

document.getElementById("nextBtn").onclick = nextRound;
document.getElementById("restartBtn").onclick = restartGame;

window.onload = () => {
  scormInit();
  buildGame();
  renderRound();
};
