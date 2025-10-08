// ===== SCREENS =====
const screens = {
  home: document.getElementById("homeScreen"),
  menu: document.getElementById("menu"),
  levelSelect: document.getElementById("levelSelect"),
  gameScreen: document.getElementById("gameScreen")
};

const loginBtnHome = document.getElementById("loginBtnHome");
const createBtnHome = document.getElementById("createBtnHome");
const loginForm = document.getElementById("loginForm");
const createForm = document.getElementById("createForm");
const loginSubmit = document.getElementById("loginSubmit");
const createSubmit = document.getElementById("createSubmit");
const loginBack = document.getElementById("loginBack");
const createBack = document.getElementById("createBack");
const loginMsg = document.getElementById("loginMsg");
const createMsg = document.getElementById("createMsg");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const createUsername = document.getElementById("createUsername");
const createPassword = document.getElementById("createPassword");

const playBtn = document.getElementById("playBtn");
const levelBtn = document.getElementById("levelBtn");
const soundBtn = document.getElementById("soundBtn");
const logoutBtn = document.getElementById("logoutBtn");
const backToMenu = document.getElementById("backToMenu");
const levelGrid = document.querySelector(".levels-grid");

const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

let currentUser = null;
let soundOn = true;
let currentLevel = 1;
let totalLevels = 100;
let playerLives = 3;
let bricks = [];
let ball, paddle;
let gameRunning = false;
let gameLoopId;
let powerUps = [];
let pointerX = null;

// ===== RESPONSIVE CANVAS =====
function resizeCanvas() {
  const margin = 20;
  const maxWidth = 480;
  const width = Math.min(window.innerWidth - margin, maxWidth);
  const height = width * 0.75;
  gameCanvas.width = width;
  gameCanvas.height = height;

  if (paddle) {
    paddle.x = gameCanvas.width / 2 - paddle.w / 2;
    paddle.y = gameCanvas.height - 20;
  }
  if (ball) {
    ball.x = gameCanvas.width / 2;
    ball.y = gameCanvas.height - 40;
  }
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ===== SHOW SCREEN =====
function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screen].classList.add("active");
  cancelAnimationFrame(gameLoopId);
}

// ===== LOGIN / CREATE ACCOUNT LOGIC =====
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// Show login form
loginBtnHome.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  createForm.classList.add("hidden");
});
// Show create account form
createBtnHome.addEventListener("click", () => {
  createForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});
// Back buttons
loginBack.addEventListener("click", () => loginForm.classList.add("hidden"));
createBack.addEventListener("click", () => createForm.classList.add("hidden"));

// Create account submit
createSubmit.addEventListener("click", () => {
  const u = createUsername.value.trim();
  const p = createPassword.value.trim();
  if (!u || !p) return createMsg.textContent = "Enter username & password!";
  const users = getUsers();
  if (users[u]) return createMsg.textContent = "Username exists!";
  users[u] = { password: p, lastLevel: 1 };
  saveUsers(users);
  createMsg.textContent = "Account created! You can now log in.";
});

// Login submit
loginSubmit.addEventListener("click", () => {
  const u = loginUsername.value.trim();
  const p = loginPassword.value.trim();
  if (!u || !p) return loginMsg.textContent = "Enter username & password!";
  const users = getUsers();
  if (!users[u] || users[u].password !== p) return loginMsg.textContent = "Invalid credentials!";
  currentUser = u;
  currentLevel = users[u].lastLevel || 1;
  loginForm.classList.add("hidden");
  showScreen("menu");
});

// Logout
logoutBtn.addEventListener("click", () => {
  currentUser = null;
  showScreen("home");
});

// ===== MENU BUTTONS =====
playBtn.onclick = () => startGame(currentLevel);
levelBtn.onclick = () => showScreen("levelSelect");
soundBtn.onclick = () => {
  soundOn = !soundOn;
  soundBtn.textContent = `Sound: ${soundOn ? "On 🔊" : "Off 🔇"}`;
};
backToMenu.onclick = () => showScreen("menu");

// ===== LEVEL GRID =====
function createLevels() {
  levelGrid.innerHTML = "";
  for (let i = 1; i <= totalLevels; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i < currentLevel) btn.classList.add("level-cleared");
    else if (i === currentLevel) btn.classList.add("level-current");
    else btn.classList.add("level-locked");
    btn.disabled = i > currentLevel;
    btn.onclick = () => startGame(i);
    levelGrid.appendChild(btn);
  }
}

// ===== REST OF GAME =====
// Keep all your Brick Breaker game logic exactly the same as your current script
// (setupGame, draw functions, gameLoop, resetBall, paddle/ball collision, power-ups, etc.)
// Just before showing LevelComplete, save progress:

function saveProgress() {
  if (!currentUser) return;
  const users = getUsers();
  users[currentUser].lastLevel = currentLevel;
  saveUsers(users);
}

function showLevelComplete() {
  saveProgress();
  currentLevel++;
  gameRunning = false;
  alert("Level Cleared!");
  showScreen("menu");
}

