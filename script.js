// ===== SCREENS =====
const screens = {
  home: document.getElementById("homeScreen"),
  menu: document.getElementById("menu"),
  levelSelect: document.getElementById("levelSelect"),
  gameScreen: document.getElementById("gameScreen")
};

const homeCanvas = document.getElementById("homeCanvas");
const hCtx = homeCanvas.getContext("2d");
let bricksHome = [];

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
  gameCanvas.width = Math.min(window.innerWidth - margin, maxWidth);
  gameCanvas.height = gameCanvas.width * 0.75;

  homeCanvas.width = window.innerWidth;
  homeCanvas.height = window.innerHeight;

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

// ===== HOME SCREEN ANIMATION =====
function initHomeBricks() {
  bricksHome = [];
  const cols = 10;
  const rows = 5;
  const w = 50, h = 20;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricksHome.push({
        x: c * (w + 10),
        y: r * (h + 10),
        w, h,
        dx: Math.random() * 0.5 - 0.25,
        dy: Math.random() * 0.5 - 0.25,
        color: `hsl(${Math.random()*360},80%,60%)`
      });
    }
  }
}

function drawHomeBricks() {
  hCtx.clearRect(0, 0, homeCanvas.width, homeCanvas.height);
  bricksHome.forEach(b => {
    b.x += b.dx; b.y += b.dy;
    // Bounce off edges
    if(b.x < 0 || b.x + b.w > homeCanvas.width) b.dx *= -1;
    if(b.y < 0 || b.y + b.h > homeCanvas.height) b.dy *= -1;
    hCtx.fillStyle = b.color;
    hCtx.fillRect(b.x, b.y, b.w, b.h);
  });
  requestAnimationFrame(drawHomeBricks);
}
initHomeBricks();
drawHomeBricks();

// ===== SHOW SCREEN =====
function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screen].classList.add("active");
  cancelAnimationFrame(gameLoopId);
}

// ===== LOGIN / CREATE ACCOUNT LOGIC =====
function getUsers() { return JSON.parse(localStorage.getItem("users") || "{}"); }
function saveUsers(users) { localStorage.setItem("users", JSON.stringify(users)); }

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
  createMsg.textContent = "";
  if(!u||!p){ createMsg.textContent="Enter username & password!"; return; }
  const users = getUsers();
  if(users[u]){ createMsg.textContent="Username exists!"; return; }
  users[u] = { password: p, lastLevel:1 };
  saveUsers(users);
  createMsg.textContent="Account created! Please log in.";
  createUsername.value=""; createPassword.value="";
  createForm.classList.add("hidden"); loginForm.classList.remove("hidden");
});

// Login submit
loginSubmit.addEventListener("click", ()=>{
  const u=loginUsername.value.trim();
  const p=loginPassword.value.trim();
  loginMsg.textContent="";
  if(!u||!p){ loginMsg.textContent="Enter username & password!"; return; }
  const users=getUsers();
  if(!users[u]||users[u].password!==p){ loginMsg.textContent="Invalid credentials!"; return; }
  currentUser=u; currentLevel=users[u].lastLevel||1;
  loginForm.classList.add("hidden");
  loginUsername.value=""; loginPassword.value=""; loginMsg.textContent="";
  showScreen("menu");
});

// Auto-login if user already logged in
if(localStorage.getItem("lastUser")){
  const lastUser = localStorage.getItem("lastUser");
  const users = getUsers();
  if(users[lastUser]){
    currentUser=lastUser; currentLevel=users[lastUser].lastLevel||1;
    showScreen("menu");
  }
}

// Logout
logoutBtn.addEventListener("click", ()=>{
  localStorage.removeItem("lastUser");
  currentUser=null;
  showScreen("home");
});

// Save progress per user
function saveProgress(){
  if(!currentUser) return;
  const users=getUsers();
  users[currentUser].lastLevel=currentLevel;
  saveUsers(users);
  localStorage.setItem("lastUser", currentUser);
}

// ===== MENU BUTTONS =====
playBtn.onclick = ()=> startGame(currentLevel);
levelBtn.onclick = ()=> showScreen("levelSelect");
soundBtn.onclick = ()=>{
  soundOn=!soundOn;
  soundBtn.textContent=`Sound: ${soundOn?"On 🔊":"Off 🔇"}`;
};
backToMenu.onclick = ()=> showScreen("menu");

// ===== LEVEL GRID =====
function createLevels(){
  levelGrid.innerHTML="";
  for(let i=1;i<=totalLevels;i++){
    const btn=document.createElement("button");
    btn.textContent=i;
    if(i<currentLevel) btn.classList.add("level-cleared");
    else if(i===currentLevel) btn.classList.add("level-current");
    else btn.classList.add("level-locked");
    btn.disabled=i>currentLevel;
    btn.onclick=()=> startGame(i);
    levelGrid.appendChild(btn);
  }
}

// ===== REST OF GAME =====
// Keep all your Brick Breaker game logic exactly the same here, just call `saveProgress()` whenever level completes
