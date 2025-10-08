// ===== SCREENS =====
const screens = {
  login: document.getElementById("loginScreen"),
  menu: document.getElementById("menu"),
  levelSelect: document.getElementById("levelSelect"),
  gameScreen: document.getElementById("gameScreen")
};

const playBtn = document.getElementById("playBtn");
const levelBtn = document.getElementById("levelBtn");
const soundBtn = document.getElementById("soundBtn");
const backToMenu = document.getElementById("backToMenu");
const levelGrid = document.querySelector(".levels-grid");

const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

const loginScreen = document.getElementById("loginScreen");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const welcomeMsg = document.getElementById("welcomeMsg");

let username = null;
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

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screen].classList.add("active");
  cancelAnimationFrame(gameLoopId);
}

// ===== LOGIN =====
loginBtn.addEventListener("click", () => {
  const input = usernameInput.value.trim();
  if (!input) return alert("Enter a username!");
  username = input;
  localStorage.setItem("brickBreakerUsername", username);

  // Load last level
  const saved = localStorage.getItem(username + "_level") || 1;
  currentLevel = parseInt(saved);

  welcomeMsg.textContent = `Welcome back, ${username}! Last level: ${currentLevel}`;

  setTimeout(() => showScreen("menu"), 1000);
});

// If user already logged in
window.addEventListener("load", () => {
  const savedUser = localStorage.getItem("brickBreakerUsername");
  if (savedUser) {
    username = savedUser;
    const savedLevel = localStorage.getItem(username + "_level") || 1;
    currentLevel = parseInt(savedLevel);
    welcomeMsg.textContent = `Welcome back, ${username}! Last level: ${currentLevel}`;
    showScreen("menu");
  } else {
    showScreen("login");
  }
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

// ===== BRICKS =====
function generatePattern(level) {
  const cols = 6 + Math.min(level, 8);
  const rows = 3 + Math.min(level, 6);
  const pattern = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let brick = 1;
      if (level >= 5 && (c < r || c >= cols - r)) brick = 0;
      if (level >= 8 && (r + c) % 2 === 0) brick = 1;
      else if (level >= 8) brick = 0;
      row.push(brick);
    }
    pattern.push(row);
  }
  return pattern;
}

function getBrickColorByHits(hits) {
  const hitColors = ["#ff3838", "#ff7eff", "#32ff7e", "#fffa65", "#00e6ff"];
  return hitColors[Math.max(0, hits - 1)];
}

// ===== GAME SETUP =====
function setupGame(level) {
  bricks = [];
  const pattern = generatePattern(level);
  const rows = pattern.length;
  const cols = pattern[0].length;
  const brickWidth = gameCanvas.width / cols - 5;
  const brickHeight = 20;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pattern[r][c] === 1) {
        const maxHits = Math.min(3, Math.floor(level / 3) + 1);
        bricks.push({
          x: c * (brickWidth + 5) + 5,
          y: r * (brickHeight + 5) + 40,
          w: brickWidth,
          h: brickHeight,
          broken: false,
          hits: maxHits,
          color: getBrickColorByHits(maxHits)
        });
      }
    }
  }

  paddle = { x: gameCanvas.width / 2 - 40, y: gameCanvas.height - 20, w: 80, h: 10 };
  ball = { x: gameCanvas.width / 2, y: gameCanvas.height - 40, r: 7, dx: 3, dy: -3 };
  playerLives = 3;
  powerUps = [];
  gameRunning = true;
}

// ===== DRAW ELEMENTS =====
function drawBricks() {
  bricks.forEach(b => {
    if (!b.broken) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  });
}

function drawPaddle() {
  ctx.fillStyle = "#00ffff";
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

function drawLives() {
  ctx.font = "16px Poppins";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Lives: ${playerLives}`, 10, 20);
  ctx.fillText(`Level: ${currentLevel}`, 200, 20);
}

// ===== GAME LOOP =====
function gameLoop() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  if (pointerX !== null) {
    let x = Math.max(paddle.w / 2, Math.min(gameCanvas.width - paddle.w / 2, pointerX));
    paddle.x = x - paddle.w / 2;
  }

  drawBricks();
  drawPaddle();
  drawBall();
  drawLives();

  // Ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Bounce walls
  if (ball.x + ball.r > gameCanvas.width || ball.x - ball.r < 0) ball.dx *= -1;
  if (ball.y - ball.r < 0) ball.dy *= -1;

  // Paddle collision
  if (ball.x > paddle.x && ball.x < paddle.x + paddle.w &&
      ball.y + ball.r > paddle.y && ball.y + ball.r < paddle.y + paddle.h + 5) {
    ball.dy *= -1;
  }

  // Brick collision
  bricks.forEach(b => {
    if (!b.broken) {
      if (ball.x > b.x && ball.x < b.x + b.w &&
          ball.y - ball.r < b.y + b.h && ball.y + ball.r > b.y) {
        b.hits--;
        if (b.hits <= 0) b.broken = true;
        else b.color = getBrickColorByHits(b.hits);
        ball.dy *= -1;
      }
    }
  });

  // Lose life
  if (ball.y + ball.r > gameCanvas.height) {
    playerLives--;
    if (playerLives <= 0) { showGameOver(); return; }
    else resetBall();
  }

  // Win level
  if (bricks.every(b => b.broken)) { showLevelComplete(); return; }

  gameLoopId = requestAnimationFrame(gameLoop);
}

// ===== RESET BALL =====
function resetBall() {
  ball.x = gameCanvas.width / 2;
  ball.y = gameCanvas.height - 40;
  ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -3;
}

// ===== SAVE PROGRESS =====
function saveProgress() {
  if (username) {
    localStorage.setItem(username + "_level", currentLevel);
  }
}

// ===== GAME EVENTS =====
function showGameOver() {
  gameRunning = false;
  alert("Game Over!"); // simple popup
  showScreen("menu");
}

function showLevelComplete() {
  saveProgress();
  currentLevel++;
  gameRunning = false;
  alert("Level Cleared!");
  showScreen("menu");
}

// ===== START GAME =====
function startGame(level) {
  currentLevel = level;
  createLevels();
  setupGame(level);
  showScreen("gameScreen");
