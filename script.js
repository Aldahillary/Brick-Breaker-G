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

let rightPressed = false;
let leftPressed = false;

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

// ===== PREDEFINED PATTERNS =====
function generatePattern(level) {
  const rows = Math.min(3 + level, 8);
  const cols = Math.min(5 + level, 12);
  const brickWidth = gameCanvas.width / cols - 5;
  const brickHeight = 20;
  const colors = ["#00e6ff", "#fffa65", "#32ff7e", "#ff3838", "#ff66cc"];

  bricks = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let addBrick = false;
      switch (level % 5) {
        case 1: addBrick = true; break;
        case 2: if (c >= r && c < cols - r) addBrick = true; break;
        case 3: if ((r + c) % 2 === 0) addBrick = true; break;
        case 4: if (r % 2 === c % 2) addBrick = true; break;
        case 0: addBrick = Math.random() > 0.3; break;
      }
      if (addBrick) {
        bricks.push({
          x: c * (brickWidth + 5) + 5,
          y: r * (brickHeight + 5) + 40,
          w: brickWidth,
          h: brickHeight,
          broken: false,
          color: colors[r % colors.length],
        });
      }
    }
  }
}

// ===== GAME SETUP =====
function setupGame(level) {
  generatePattern(level);

  paddle = { x: 0, y: gameCanvas.height - 20, w: 80, h: 10, speed: 7 };
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
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.r > paddle.y &&
    ball.y - ball.r < paddle.y + paddle.h
  ) {
    ball.dy = -Math.abs(ball.dy);
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
    showLifeLostPopup();
    if (playerLives <= 0) {
      showGameOver();
      return;
    } else {
      resetBall();
    }
  }

  // Win level
  if (bricks.every((b) => b.broken)) {
    showLevelComplete();
    return;
  }

  // Paddle arrow movement
  if (rightPressed) paddle.x += paddle.speed;
  if (leftPressed) paddle.x -= paddle.speed;

  // Clamp paddle fully
  paddle.x = Math.max(0, Math.min(gameCanvas.width - paddle.w, paddle.x));

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
function showLifeLostPopup() {
  const popup = document.createElement("div");
  popup.className = "message-box";
  popup.textContent = "💔 Life Lost!";
  popup.style.position = "absolute";
  popup.style.top = "10%"; // top instead of middle
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.padding = "10px 20px";
  popup.style.background = "rgba(255,0,0,0.7)";
  popup.style.color = "#fff";
  popup.style.borderRadius = "10px";
  popup.style.fontSize = "18px";
  popup.style.zIndex = "1000";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 800);
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
  const overlay = createOverlay("🎉 Level Cleared!", [
    { text: "Next Level", action: () => startGame(currentLevel + 1) },
    { text: "Main Menu", action: () => showScreen("menu") },
  ]);
  document.body.appendChild(overlay);
}

// ===== OVERLAY CREATION =====
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
gameCanvas.addEventListener("mousemove", (e) => {
  const rect = gameCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.max(0, Math.min(gameCanvas.width - paddle.w, mouseX - paddle.w / 2));
});
gameCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const rect = gameCanvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddle.x = Math.max(0, Math.min(gameCanvas.width - paddle.w, touchX - paddle.w / 2));
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft") leftPressed = false;
});

// ===== INITIALIZE =====
createLevels();
showScreen("menu");
