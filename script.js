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

    if (i < currentLevel) btn.classList.add("level-cleared");
    else if (i === currentLevel) btn.classList.add("level-current");
    else btn.classList.add("level-locked");

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

  // Dynamic brick patterns and colors
  const brickColors = ["#ff3838", "#32ff7e", "#fffa65", "#00e6ff", "#ff9f1a"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > Math.min(level * 0.03, 0.7)) {
        bricks.push({
          x: c * (brickWidth + 5) + 5,
          y: r * (brickHeight + 5) + 40,
          w: brickWidth,
          h: brickHeight,
          broken: false,
          color: brickColors[Math.floor(Math.random() * brickColors.length)],
        });
      }
    }
  }

  paddle = { x: gameCanvas.width / 2 - 40, y: gameCanvas.height - 20, w: 80, h: 10, speed: 8 };
  ball = { x: gameCanvas.width / 2, y: gameCanvas.height - 40, r: 7, dx: 3, dy: -3 };
  playerLives = 3;
  score = 0;
  gameRunning = true;
}

// ===== DRAW ELEMENTS =====
function drawBricks() {
  bricks.forEach((b) => {
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

function drawHUD() {
  ctx.font = "16px Poppins";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Lives: ${playerLives}`, 10, 20);
  ctx.fillText(`Level: ${currentLevel}`, gameCanvas.width / 2 - 30, 20);
  ctx.fillText(`Score: ${score}`, gameCanvas.width - 90, 20);
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
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.r > paddle.y &&
    ball.y - ball.r < paddle.y + paddle.h
  ) {
    ball.dy *= -1;
  }

  // Brick collision
  bricks.forEach((b) => {
    if (!b.broken) {
      if (
        ball.x > b.x &&
        ball.x < b.x + b.w &&
        ball.y - ball.r < b.y + b.h &&
        ball.y + ball.r > b.y
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
      resetBall();
      showLifeLost();
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

// ===== LIFE LOST POPUP =====
function showLifeLost() {
  const msg = document.createElement("div");
  msg.className = "message-box show";
  msg.textContent = "💔 Life Lost!";
  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 1000);
}

// ===== FIREWORKS =====
function launchFireworks() {
  const colors = ["#ff3838", "#32ff7e", "#fffa65", "#00e6ff", "#ff9f1a"];
  for (let i = 0; i < 25; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = "6px";
    particle.style.height = "6px";
    particle.style.borderRadius = "50%";
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = `${gameCanvas.offsetLeft + gameCanvas.width / 2}px`;
    particle.style.top = `${gameCanvas.offsetTop + gameCanvas.height / 2}px`;
    particle.style.transition = "all 1s ease-out";
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.style.transform = `translate(${(Math.random() - 0.5) * 500}px, ${(Math.random() - 0.5) * 500}px)`;
      particle.style.opacity = "0";
    }, 50);

    setTimeout(() => particle.remove(), 1200);
  }
}

// ===== POPUPS =====
function showGameOver() {
  gameRunning = false;
  const overlay = createOverlay("Game Over 💀", [
    { text: "Replay", action: () => startGame(currentLevel) },
    { text: "Main Menu", action: () => showScreen("menu") },
  ]);
  document.body.appendChild(overlay);
}

function showLevelComplete() {
  gameRunning = false;
  launchFireworks();
  const overlay = createOverlay("🎉 Level Cleared!", [
    { text: "Next Level", action: () => startGame(currentLevel + 1) },
    { text: "Main Menu", action: () => showScreen("menu") },
  ]);
  document.body.appendChild(overlay);
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
  return overlay;
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
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.min(Math.max(mouseX - paddle.w / 2, 0), gameCanvas.width - paddle.w);
});

// Touch
gameCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const rect = gameCanvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddle.x = Math.min(Math.max(touchX - paddle.w / 2, 0), gameCanvas.width - paddle.w);
}, { passive: false });

// Keyboard
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") paddle.x -= paddle.speed;
  if (e.key === "ArrowRight") paddle.x += paddle.speed;
  paddle.x = Math.min(Math.max(paddle.x, 0), gameCanvas.width - paddle.w);
});

// ===== INITIALIZE =====
createLevels();
showScreen("menu");
