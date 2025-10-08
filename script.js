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

const hudLives = document.getElementById("hudLives");
const hudLevel = document.getElementById("hudLevel");
const hudScore = document.getElementById("hudScore");

let soundOn = true;
let currentLevel = 1;
let totalLevels = 100;
let playerLives = 3;
let bricks = [];
let ball, paddle;
let gameRunning = false;
let score = 0;
let gameLoopId;

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

// ===== RESIZE CANVAS =====
function resizeCanvas() {
  gameCanvas.width = window.innerWidth * 0.95;
  gameCanvas.height = window.innerHeight * 0.6;
  if (paddle) paddle.y = gameCanvas.height - 20;
}
window.addEventListener("resize", resizeCanvas);

// ===== GAME SETUP =====
function setupGame(level) {
  bricks = [];
  const rows = 3 + Math.min(level, 7);
  const cols = 5 + Math.min(level, 10);
  const brickWidth = gameCanvas.width / cols - 5;
  const brickHeight = 20;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
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

  paddle = { x: gameCanvas.width/2 - 40, y: gameCanvas.height - 20, w: 80, h: 10 };
  ball = { x: gameCanvas.width/2, y: gameCanvas.height - 40, r: 7, dx: 3, dy: -3 };
  playerLives = 3;
  score = 0;
  updateHUD();
  gameRunning = true;
  resizeCanvas();
}

// ===== DRAW =====
function drawBricks() {
  ctx.fillStyle = "#00e6ff";
  bricks.forEach(b => {
    if (!b.broken) ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

function drawPaddle() {
  ctx.fillStyle = "#00ffff";
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

function updateHUD() {
  hudLives.textContent = `Lives: ${playerLives}`;
  hudLevel.textContent = `Level: ${currentLevel}`;
  hudScore.textContent = `Score: ${score}`;
}

// ===== GAME LOOP =====
function gameLoop() {
  ctx.clearRect(0,0,gameCanvas.width,gameCanvas.height);
  drawBricks();
  drawPaddle();
  drawBall();
  updateHUD();

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall bounce
  if (ball.x + ball.r > gameCanvas.width || ball.x - ball.r < 0) ball.dx*=-1;
  if (ball.y - ball.r < 0) ball.dy*=-1;

  // Paddle collision
  if (ball.x > paddle.x && ball.x < paddle.x + paddle.w && ball.y + ball.r > paddle.y) {
    ball.dy*=-1;
  }

  // Brick collision
  bricks.forEach(b => {
    if (!b.broken && ball.x>b.x && ball.x<b.x+b.w && ball.y-b.r < b.y+b.h && ball.y+b.r> b.y) {
      b.broken=true;
      ball.dy*=-1;
      score+=10;
    }
  });

  // Lose life
  if (ball.y + ball.r > gameCanvas.height) {
    playerLives--;
    if (playerLives<=0) showGameOver();
    else resetBall();
  }

  // Level complete
  if (bricks.every(b => b.broken)) showLevelComplete();

  if(gameRunning) gameLoopId = requestAnimationFrame(gameLoop);
}

// ===== RESET BALL =====
function resetBall() {
  ball.x = gameCanvas.width/2;
  ball.y = gameCanvas.height - 40;
  ball.dx = 3*(Math.random()>0.5?1:-1);
  ball.dy = -3;
}

// ===== OVERLAYS =====
function showGameOver() {
  gameRunning = false;
  const overlay = createOverlay("Game Over 💀", [
    { text: "Replay", action: () => startGame(currentLevel) },
    { text: "Main Menu", action: () => showScreen("menu") }, // added Main Menu
  ]);
}

function showLevelComplete() {
  gameRunning = false;
  const overlay = createOverlay("🎉 Level Cleared!", [
    { text: "Next Level", action: () => startGame(currentLevel + 1) },
    { text: "Main Menu", action: () => showScreen("menu") }, // added Main Menu
  ]);
}

function createOverlay(title, buttons){
  const overlay=document.createElement("div");
  overlay.className="overlay";
  const content=document.createElement("div");
  content.className="overlay-content";
  const heading=document.createElement("h2");
  heading.textContent=title;
  content.appendChild(heading);
  buttons.forEach(b=>{
    const btn=document.createElement("button");
    btn.textContent=b.text;
    btn.onclick=()=>{overlay.remove(); b.action();};
    content.appendChild(btn);
  });
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

// ===== FIREWORKS =====
function launchFireworks(){
  const colors=["#00e6ff","#fffa65","#32ff7e","#ff3838"];
  for(let i=0;i<20;i++){
    const p=document.createElement("div");
    p.style.position="absolute";
    p.style.width="6px"; p.style.height="6px"; p.style.borderRadius="50%";
    p.style.background=colors[Math.floor(Math.random()*colors.length)];
    p.style.top="50%"; p.style.left="50%";
    p.style.transition="all 1s ease-out";
    document.body.appendChild(p);
    setTimeout(()=>{p.style.transform=`translate(${(Math.random()-0.5)*500}px, ${(Math.random()-0.5)*500}px)`; p.style.opacity="0";},50);
    setTimeout(()=>p.remove(),1200);
  }
}

// ===== CONTROLS =====
// Mouse
gameCanvas.addEventListener("mousemove",e=>{
  const rect=gameCanvas.getBoundingClientRect();
  paddle.x=e.clientX-rect.left-paddle.w/2;
});
// Touch
gameCanvas.addEventListener("touchmove",e=>{
  e.preventDefault();
  const rect=gameCanvas.getBoundingClientRect();
  paddle.x=e.touches[0].clientX-rect.left-paddle.w/2;
},{passive:false});
// Keyboard
document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft") paddle.x-=20;
  if(e.key==="ArrowRight") paddle.x+=20;
});

// ===== START GAME =====
function startGame(level){
  currentLevel=level;
  createLevels();
  setupGame(level);
  showScreen("gameScreen");
  gameLoop();
}

// ===== INIT =====
createLevels();
showScreen("menu");
resizeCanvas();

