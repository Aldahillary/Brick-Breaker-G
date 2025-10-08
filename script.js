// ===== GAME VERSION =====
const GAME_VERSION = "1.0";

// ===== SCREEN MANAGEMENT =====
const screens = {
  home: document.getElementById("homeScreen"),
  menu: document.getElementById("menu"),
  levelSelect: document.getElementById("levelSelect"),
  gameScreen: document.getElementById("gameScreen")
};

// ===== BUTTONS & ELEMENTS =====
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
let pointerX = null;

// ===== LOCAL STORAGE HELPERS =====
function getUsers() {
    return JSON.parse(localStorage.getItem("users") || "{}");
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveProgress() {
    if (!currentUser) return;
    const users = getUsers();
    users[currentUser].lastLevel = currentLevel;
    saveUsers(users);
    localStorage.setItem("lastUser", currentUser);
}

// ===== INITIALIZE USERS & VERSION =====
if(localStorage.getItem("gameVersion") !== GAME_VERSION) {
    localStorage.setItem("gameVersion", GAME_VERSION);
    // No overwriting old user data, just register version
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

loginBack.addEventListener("click", ()=>loginForm.classList.add("hidden"));
createBack.addEventListener("click", ()=>createForm.classList.add("hidden"));

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
  if (!u || !p) { loginMsg.textContent = "Enter username & password!"; return; }
  const users = getUsers();
  if (!users[u] || users[u].password !== p) { loginMsg.textContent = "Invalid credentials!"; return; }
  currentUser = u;
  currentLevel = users[u].lastLevel || 1;
  loginForm.classList.add("hidden");
  loginUsername.value = ""; loginPassword.value = "";
  showScreen("menu");
});

// Auto-login if user exists
const lastUser = localStorage.getItem("lastUser");
if (lastUser && getUsers()[lastUser]) {
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

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screen].classList.add("active");
  cancelAnimationFrame(gameLoopId);
}

// ===== MAIN MENU BUTTONS =====
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

// ===== GAME LOGIC =====
// Use your original game setup, draw, and loop functions here
// Make sure every time a level is completed, call saveProgress()

