// ===== SCREEN MANAGEMENT =====
const screens = {
  menu: document.getElementById("menu"),
  levelSelect: document.getElementById("levelSelect"),
  gameScreen: document.getElementById("gameScreen"),
};

const playBtn = document.getElementById("playBtn");
const levelBtn = document.getElementById("levelBtn");
const soundBtn = document.getElementById("soundBtn");
const backToMenu = document.getElementById("backToMenu");
const levelGrid = document.querySelector(".levels-grid");

const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

let soundOn = true;
let currentLevel = 1;
let totalLevels = 100;
let playerLives = 3;
let bricks = [];
let ball, paddle;
let gameRunning = false;
let score = 0;

// ===== SHOW SCREEN =====
function showScreen(screen) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[screen].classList.add("active");
  cancelAnimationFrame(gameLoopId);
}

// ===== MENU BUTTONS =====
playBtn.onclick = () => startGame(currentLevel);
levelBtn.onclick = () => showScreen("levelSelect");
soundBtn.onclick = () => {
  soundOn = !soundOn;
  soundBtn.textContent = `Sound: ${soundOn ? "On 🔊" : "Off 🔇"}`;
};
backToMenu.onclick = () => showScreen("menu");

// ===== LEVEL GRID SETUP =====
function createLevels() {
  levelGrid.innerHTML = "";
  for (let i = 1; i <= totalLevels; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;

    if (i < currentLevel) btn.classList.add("level-cleared"); // green
    else if (i === currentLevel) btn.classList.add("level-current"); // yellow
    else btn.classList.add("level-locked"); // grey

    btn.disabled = i > currentLevel;
    btn.onclick = () => startGame(i);
    levelGrid.appendChild(btn);
  }
}

// ===== GAME SETUP =====
function setupGame(level) {
  bricks = [];
  const rows = 3 + Math.min(level, 7);
  const cols = 5 + Math.min(level, 10);
  const brickWidth = gameCanvas.width / cols - 5;
  const brickHeight = 20;

  // Generate unique patterns for each level
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Randomly skip bricks for variety
      if (Math.random() > Math.min(level * 0.03, 0.7)) {
        bricks.push({
          x: c * (brickWidth + 5) + 5,
          y: r * (brickHeight + 5) + 40,
          w: brickWidth,
          h: brickHeight,
          broken: false,
        });
      }
    }
  }

  paddle = { x: gameCanvas.width / 2 - 40, y: gameCanvas.height - 20, w: 80, h: 10 };
  ball = { x: gameCanvas.width / 2, y: gameCanvas.height - 40, r: 7, dx: 3, dy: -3 };
  playerLives = 3;
  score = 0;
  gameRunning = true;
}

// ===== DRAW ELEMENTS =====
function drawBricks() {
  bricks.forEach((b) => {
    if (!b.broken) {
      ctx.fillStyle = "#00e6ff";
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

function drawHUD() {
  ctx.font = "16px Poppins";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Lives: ${playerLives}`, 10, 20);
  ctx.fillText(`Level: ${currentLevel}`, 200, 20);
  ctx.fillText(`Score: ${score}`, 350, 20);
}

// ===== GAME LOOP =====
let gameLoopId;
function gameLoop() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  drawBricks();
  drawPaddle();
  drawBall();
  drawHUD();

  // Ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Bounce walls
  if (ball.x + ball.r > gameCanvas.width || ball.x - ball.r < 0) ball.dx *= -1;
  if (ball.y - ball.r < 0) ball.dy *= -1;

  // Paddle collision
  if (
    ball.x + ball.r > paddle.x &&
    ball.x - ball.r < paddle.x + paddle.w &&
    ball.y + ball.r > paddle.y &&
    ball.y - ball.r < paddle.y + paddle.h
  ) {
    ball.dy *= -1;
  }

  // Brick collision
  bricks.forEach((b) => {
    if (!b.broken) {
      if (
        ball.x + ball.r > b.x &&
        ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y &&
        ball.y - ball.r < b.y + b.h
      ) {
        b.broken = true;
        ball.dy *= -1;
        score += 10;
      }
    }
  });

  // Lose life
  if (ball.y + ball.r > gameCanvas.height) {
    playerLives--;
    if (playerLives <= 0) {
      showGameOver();
      return;
    } else {
      showLifeLost();
      resetBall();
    }
  }

  // Win level
  if (bricks.every((b) => b.broken)) {
    showLevelComplete();
    return;
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

// ===== RESET BALL =====
function resetBall() {
  ball.x = gameCanvas.width / 2;
  ball.y = gameCanvas.height - 40;
  ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -3;
}

// ===== LIFE LOST MESSAGE =====
function showLifeLost() {
  const msg = document.createElement("div");
  msg.className = "message-box show";
  msg.textContent = "💔 Life Lost!";
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 1000);
}

// ===== POPUPS =====
function showGameOver() {
  gameRunning = false;
  const overlay = createOverlay("Game Over 💀", [
    { text: "Replay", action: () => startGame(currentLevel) }
  ]);
  document.body.appendChild(overlay);
}

function showLevelComplete() {
  gameRunning = false;
  const overlay = createOverlay("🎉 Level Cleared!", [
    { text: "Next Level", action: () => startGame(currentLevel + 1) }
  ]);
  document.body.appendChild(overlay);
  launchFireworks();
}

function createOverlay(title, buttons) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const content = document.createElement("div");
  content.className = "overlay-content";

  const heading = document.createElement("h2");
  heading.textContent = title;
  content.appendChild(heading);

  buttons.forEach((b) => {
    const btn = document.createElement("button");
    btn.textContent = b.text;
    btn.onclick = () => {
      overlay.remove();
      b.action();
    };
    content.appendChild(btn);
  });

  overlay.appendChild(content);
  document.body.appendChild(overlay);
  return overlay;
}

// ===== FIREWORKS EFFECT =====
function launchFireworks() {
  const colors = ["#00e6ff", "#fffa65", "#32ff7e", "#ff3838"];
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = "6px";
    particle.style.height = "6px";
    particle.style.borderRadius = "50%";
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.top = "50%";
    particle.style.left = "50%";
    particle.style.transition = "all 1s ease-out";
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.style.transform = `translate(${(Math.random() - 0.5) * 500}px, ${(Math.random() - 0.5) * 500}px)`;
      particle.style.opacity = "0";
    }, 50);

    setTimeout(() => particle.remove(), 1200);
  }
}

// ===== GAME START =====
function startGame(level) {
  currentLevel = level;
  createLevels();
  setupGame(level);
  showScreen("gameScreen");
  resetBall();
  gameLoop();
}

// ===== CONTROLS =====
// Mouse
gameCanvas.addEventListener("mousemove", (e) => {
  const rect = gameCanvas.getBoundingClientRect();
  paddle.x = e.clientX - rect.left - paddle.w / 2;
});

// Touch
gameCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const rect = gameCanvas.getBoundingClientRect();
  paddle.x = e.touches[0].clientX - rect.left - paddle.w / 2;
}, { passive: false });

// ===== INITIALIZE =====
createLevels();
showScreen("menu");
