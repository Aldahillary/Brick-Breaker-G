// ===== SCREENS =====
const screens = {
  home: document.getElementById("homeScreen"),
  menu: document.getElementById("menu"),
  levelSelect: document.getElementById("levelSelect"),
  gameScreen: document.getElementById("gameScreen")
};

// ===== AUTH ELEMENTS =====
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

// ===== MENU ELEMENTS =====
const playBtn = document.getElementById("playBtn");
const levelBtn = document.getElementById("levelBtn");
const soundBtn = document.getElementById("soundBtn");
const logoutBtn = document.getElementById("logoutBtn");
const backToMenu = document.getElementById("backToMenu");
const levelGrid = document.querySelector(".levels-grid");

// ===== GAME ELEMENTS =====
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

// ===== GAME VARIABLES =====
let soundOn = true;
let currentUser = null;
let currentLevel = 1;
let totalLevels = 100;
let playerLives = 3;
let bricks = [];
let ball, paddle;
let gameRunning = false;
let gameLoopId;
let powerUps = [];

// ===== LOCAL STORAGE HELPERS =====
function getUsers() { return JSON.parse(localStorage.getItem("users") || "{}"); }
function saveUsers(users) { localStorage.setItem("users", JSON.stringify(users)); }
function saveProgress() {
  if (!currentUser) return;
  const users = getUsers();
  users[currentUser].lastLevel = currentLevel;
  saveUsers(users);
  localStorage.setItem("lastUser", currentUser);
}

// ===== SCREEN SWITCH =====
function showScreen(screen){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screen].classList.add("active");
  cancelAnimationFrame(gameLoopId);
}

// ===== LOGIN / CREATE ACCOUNT =====
loginBtnHome.addEventListener("click", ()=>{
  loginForm.classList.remove("hidden");
  createForm.classList.add("hidden");
});
createBtnHome.addEventListener("click", ()=>{
  createForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});
loginBack.addEventListener("click", ()=> loginForm.classList.add("hidden"));
createBack.addEventListener("click", ()=> createForm.classList.add("hidden"));

// Create account
createSubmit.addEventListener("click", ()=>{
  const u = createUsername.value.trim();
  const p = createPassword.value.trim();
  createMsg.textContent = "";
  if (!u || !p) { createMsg.textContent = "Enter username & password!"; return; }
  const users = getUsers();
  if (users[u]) { createMsg.textContent = "Username exists!"; return; }
  users[u] = { password: p, lastLevel: 1 };
  saveUsers(users);
  createMsg.textContent = "Account created! Please log in.";
  createUsername.value = ""; createPassword.value = "";
  createForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// Login
loginSubmit.addEventListener("click", ()=>{
  const u = loginUsername.value.trim();
  const p = loginPassword.value.trim();
  loginMsg.textContent = "";
  const users = getUsers();
  if (!u || !p) { loginMsg.textContent = "Enter username & password!"; return; }
  if (!users[u] || users[u].password !== p) { loginMsg.textContent = "Invalid credentials!"; return; }
  currentUser = u;
  currentLevel = users[u].lastLevel || 1;
  loginForm.classList.add("hidden");
  loginUsername.value = ""; loginPassword.value = "";
  showScreen("menu");
});

// Auto-login
const lastUser = localStorage.getItem("lastUser");
if (lastUser && getUsers()[lastUser]){
  currentUser = lastUser;
  currentLevel = getUsers()[lastUser].lastLevel || 1;
  showScreen("menu");
}

// Logout
logoutBtn.addEventListener("click", ()=>{
  currentUser = null;
  localStorage.removeItem("lastUser");
  showScreen("home");
});

// ===== MAIN MENU BUTTONS =====
playBtn.onclick = () => startGame(currentLevel);
levelBtn.onclick = () => { createLevels(); showScreen("levelSelect"); };
soundBtn.onclick = () => {
  soundOn = !soundOn;
  soundBtn.textContent = `Sound: ${soundOn ? "On 🔊" : "Off 🔇"}`;
};
backToMenu.onclick = () => showScreen("menu");

// ===== LEVEL GRID =====
function createLevels(){
  levelGrid.innerHTML = "";
  for (let i=1; i<=totalLevels; i++){
    const btn = document.createElement("button");
    btn.textContent = i;
    if(i<currentLevel) btn.classList.add("level-cleared");
    else if(i===currentLevel) btn.classList.add("level-current");
    else btn.classList.add("level-locked");
    btn.disabled = i>currentLevel;
    btn.onclick = () => startGame(i);
    levelGrid.appendChild(btn);
  }
}

// ===== GAME SETUP =====
function setupGame(level){
  bricks = [];
  const cols = 6 + Math.min(level, 8);
  const rows = 3 + Math.min(level, 6);
  const brickWidth = gameCanvas.width / cols - 5;
  const brickHeight = 20;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      bricks.push({
        x: c*(brickWidth+5)+5,
        y: r*(brickHeight+5)+40,
        w: brickWidth,
        h: brickHeight,
        broken: false
      });
    }
  }
  paddle = { x: gameCanvas.width/2-40, y: gameCanvas.height-20, w:80, h:10 };
  ball = { x: gameCanvas.width/2, y: gameCanvas.height-40, r:7, dx:3, dy:-3 };
  playerLives = 3;
  powerUps = [];
  gameRunning = true;
}

// ===== GAME LOOP =====
function gameLoop(){
  if(!gameRunning) return;
  ctx.clearRect(0,0,gameCanvas.width,gameCanvas.height);

  // Draw bricks
  bricks.forEach(b => {
    if(!b.broken){
      ctx.fillStyle = "#ff3838";
      ctx.fillRect(b.x,b.y,b.w,b.h);
    }
  });

  // Draw paddle
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(paddle.x,paddle.y,paddle.w,paddle.h);

  // Draw ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.closePath();

  // Ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collision
  if(ball.x+ball.r>gameCanvas.width || ball.x-ball.r<0) ball.dx*=-1;
  if(ball.y-ball.r<0) ball.dy*=-1;
  if(ball.y+ball.r>gameCanvas.height) { playerLives--; resetBall(); }

  // Paddle collision
  if(ball.y+ball.r>=paddle.y && ball.x>paddle.x && ball.x<paddle.x+paddle.w) ball.dy*=-1;

  gameLoopId = requestAnimationFrame(gameLoop);
}

// Reset ball
function resetBall(){
  ball.x = gameCanvas.width/2;
  ball.y = gameCanvas.height-40;
  ball.dx = 3;
  ball.dy = -3;
  if(playerLives<=0){
    gameRunning = false;
    alert("Game Over!");
    showScreen("menu");
  }
}

// ===== START GAME =====
function startGame(level){
  currentLevel = level;
  setupGame(level);
  createLevels();
  showScreen("gameScreen");
  gameLoop();
}
