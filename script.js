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
let score = 0;

let bricks = [];
let ball, paddle;
let gameRunning = false;

// ===== SHOW SCREEN =====
function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
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
  const rows = Math.min(3 + Math.floor(level / 10), 8); // more rows as level increases
  const cols = Math.min(5 + Math.floor(level / 5), 12); // more columns as level increases
  const padding = 5;
  const offsetTop = 40;
  const offsetLeft = 10;

  const brickWidth = (gameCanvas.width - (cols + 1) * padding - 2 * offsetLeft) / cols;
  const brickHeight = 20;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Create a pattern: skip some bricks randomly for variety
      if (Math.random() > Math.min(level * 0.03, 0.7)) {
        // Different color per row
        const colors = ["#00e6ff", "#fffa65", "#32ff7e", "#ff3838", "#ff66cc", "#66ffcc"];
        bricks.push({
          x: offsetLeft + c * (brickWidth + padding) + padding,
          y: offsetTop + r * (brickHeight + padding),
          w: brickWidth,
          h: brickHeight,
          broken: false,
          color: colors[r % colors.length]
        });
      }
    }
  }

  paddle = {
    w: gameCanvas.width / 5,
    h: 12,
    x: (gameCanvas.width - gameCanvas.width / 5) / 2,
    y: gameCanvas.height - 30
  };

  ball = {
    x: gameCanvas.width / 2,
    y: paddle.y - 10,
    r: 8,
    dx: 3,
    dy: -3
  };

  playerLives = 3;
  score = 0;
  gameRunning = true;
}

// ===== DRAW ELEMENTS =====
function drawBricks() {
  bricks.forEach(b => {
    if (!b.broken) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#000";
      ctx.strokeRect(b.x, b.y, b.w, b.h);
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
  ctx.fillText(`Level: ${currentLevel}`, gameCanvas.width/2 - 30, 20);
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
  if (ball.x > paddle.x && ball.x < paddle.x + paddle.w &&
      ball.y + ball.r > paddle.y && ball.y - ball.r < paddle.y + paddle.h) {
    ball.dy *= -1;
  }

  // Brick collision
  bricks.forEach(b => {
    if (!b.broken &&
        ball.x > b.x && ball.x < b.x + b.w &&
        ball.y - ball.r < b.y + b.h && ball.y + ball.r > b.y) {
      b.broken = true;
      ball.dy *= -1;
      score += 10;
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
  if (bricks.every(b => b.broken)) {
    showLevelComplete();
    return;
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

// ===== RESET BALL =====
function resetBall() {
  ball.x = gameCanvas.width / 2;
  ball.y = paddle.y - 10;
  ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -3;
}

// ===== LIFE LOST MESSAGE =====
function showLifeLost() {
  const msg = document.createElement("div");
  msg.className = "message-box show";
  msg.textContent = "Life Lost!";
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 800);
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
// Mouse & touch
function movePaddle(x) {
  paddle.x = x - paddle.w / 2;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.w > gameCanvas.width) paddle.x = gameCanvas.width - paddle.w;
}

gameCanvas.addEventListener("mousemove", e => {
  const rect = gameCanvas.getBoundingClientRect();
  movePaddle(e.clientX - rect.left);
});

gameCanvas.addEventListener("touchmove", e => {
  const rect = gameCanvas.getBoundingClientRect();
  movePaddle(e.touches[0].clientX - rect.left);
});

// Arrow keys
document.addEventListener("keydown", e => {
  const step = 15;
  if (e.key === "ArrowLeft") movePaddle(paddle.x - step + paddle.w/2);
  if (e.key === "ArrowRight") movePaddle(paddle.x + step + paddle.w/2);
});

// ===== INITIALIZE =====
createLevels();
showScreen("menu");
