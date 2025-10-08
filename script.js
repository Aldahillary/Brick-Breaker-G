// ===== VARIABLES =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const levelScreen = document.getElementById("levelScreen");
const gameScreen = document.getElementById("gameScreen");

const playBtn = document.getElementById("playBtn");
const levelBtn = document.getElementById("levelBtn");
const backBtn = document.getElementById("backBtn");

const livesContainer = document.getElementById("livesContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

const lifePopup = document.getElementById("lifePopup");
const endPopup = document.getElementById("endPopup");
const endMessage = document.getElementById("endMessage");
const replayBtn = document.getElementById("replayBtn");
const menuBtn = document.getElementById("menuBtn");

const levelGrid = document.getElementById("levelGrid");

let paddle, ball, bricks;
let rightPressed = false, leftPressed = false;
let lives = 3, score = 0, currentLevel = 1;

// ===== EVENT LISTENERS =====
playBtn.onclick = () => startGame(currentLevel);
levelBtn.onclick = () => { startScreen.classList.add("hidden"); showLevels(); levelScreen.classList.remove("hidden"); }
backBtn.onclick = () => { levelScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); }
replayBtn.onclick = () => { endPopup.classList.add("hidden"); startGame(currentLevel); }
menuBtn.onclick = () => { endPopup.classList.add("hidden"); gameScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); }

document.addEventListener("keydown", e => { if(e.key=="ArrowRight") rightPressed=true; if(e.key=="ArrowLeft") leftPressed=true; });
document.addEventListener("keyup", e => { if(e.key=="ArrowRight") rightPressed=false; if(e.key=="ArrowLeft") leftPressed=false; });
document.addEventListener("mousemove", e => { let relativeX=e.clientX-canvas.offsetLeft; if(relativeX>0 && relativeX<canvas.width) paddle.x=relativeX-paddle.width/2; });

// ===== LEVEL SELECT =====
function showLevels() {
  levelGrid.innerHTML="";
  let savedLevel = parseInt(localStorage.getItem("brickGameLevel") || "1");
  for(let i=1;i<=100;i++){
    let tile = document.createElement("div");
    tile.classList.add("levelTile");
    tile.style.background = i < savedLevel ? "green" : i===savedLevel ? "yellow" : "gray";
    tile.textContent = i;
    tile.onclick = () => { if(i<=savedLevel+1){ currentLevel=i; levelScreen.classList.add("hidden"); startGame(i); } }
    levelGrid.appendChild(tile);
  }
}

// ===== GAME SETUP =====
function startGame(level){
  lives=3; score=0;
  updateLives(); updateScore(); updateLevel(level);
  paddle = { width: canvas.width/5, height:15, x: canvas.width/2-50, speed:8 };
  ball = { x: canvas.width/2, y:canvas.height-50, radius:10, dx:4, dy:-4 };
  bricks = [];
  let rows = 5 + Math.floor(level/20); let cols = 7 + Math.floor(level/15);
  for(let r=0;r<rows;r++){ bricks[r]=[]; for(let c=0;c<cols;c++){ bricks[r][c]={x:0,y:0,status:1,color:`hsl(${(level*10+r*20+c*10)%360},70%,50%)`}; } }
  startScreen.classList.add("hidden"); levelScreen.classList.add("hidden"); gameScreen.classList.remove("hidden");
  canvas.width = Math.min(window.innerWidth*0.95, 800);
  canvas.height = canvas.width * 0.75;
  requestAnimationFrame(draw);
}

// ===== DRAW =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBricks(); drawBall(); drawPaddle(); collisionDetection();
  ball.x+=ball.dx; ball.y+=ball.dy;
  if(ball.x+ball.dx>canvas.width-ball.radius || ball.x+ball.dx<ball.radius) ball.dx=-ball.dx;
  if(ball.y+ball.dy<ball.radius) ball.dy=-ball.dy;
  else if(ball.y+ball.dy>canvas.height-ball.radius-paddle.height-10){
    if(ball.x>paddle.x && ball.x<paddle.x+paddle.width) ball.dy=-ball.dy;
    else loseLife();
  }
  if(rightPressed && paddle.x<canvas.width-paddle.width) paddle.x+=paddle.speed;
  if(leftPressed && paddle.x>0) paddle.x-=paddle.speed;
  requestAnimationFrame(draw);
}

function drawPaddle(){ ctx.fillStyle="#0ff"; ctx.fillRect(paddle.x,canvas.height-paddle.height-10,paddle.width,paddle.height); }
function drawBall(){ ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.radius,0,Math.PI*2); ctx.fillStyle="#ff0"; ctx.fill(); ctx.closePath(); }
function drawBricks(){ let w=(canvas.width-bricks[0].length*10)/bricks[0].length; let h=20; for(let r=0;r<bricks.length;r++){ for(let c=0;c<bricks[r].length;c++){ let b=bricks[r][c]; if(b.status===1){ b.x=c*(w+10)+5; b.y=r*(h+10)+50; ctx.fillStyle=b.color; ctx.fillRect(b.x,b.y,w,h); } } } }

function collisionDetection(){ for(let r=0;r<bricks.length;r++){ for(let c=0;c<bricks[r].length;c++){ let b=bricks[r][c]; if(b.status===1 && ball.x>b.x && ball.x<b.x+(canvas.width-bricks[r].length*10)/bricks[r].length && ball.y>b.y && ball.y<b.y+20){ ball.dy=-ball.dy; b.status=0; updateScore(10); if(isLevelCleared()) nextLevel(); } } } }

function isLevelCleared(){ for(let r=0;r<bricks.length;r++){ for(let c=0;c<bricks[r].length;c++){ if(bricks[r][c].status===1) return false; } return true; } }

function nextLevel(){ launchFireworks(); currentLevel++; localStorage.setItem("brickGameLevel",currentLevel); startGame(currentLevel); }

function loseLife(){ lives--; updateLives(); showLifePopup(); if(lives<=0){ gameOver(); } else { resetBall(); } }
function resetBall(){ ball.x=canvas.width/2; ball.y=canvas.height-50; ball.dx=4; ball.dy=-4; paddle.x=canvas.width/2-paddle.width/2; }

function updateLives(){ livesContainer.textContent="❤️".repeat(lives); }
function showLifePopup(){ lifePopup.classList.remove("hidden"); setTimeout(()=>lifePopup.classList.add("hidden"),1000); }
function gameOver(){ endMessage.textContent="Game Over!"; endPopup.classList.remove("hidden"); }
function updateScore(points){ score+=points; scoreDisplay.textContent=`Score: ${score}`; }
function updateLevel(level){ levelDisplay.textContent=`Level ${level}`; }

// ===== FIREWORKS =====
function launchFireworks(){
  const colors=["#0ff","#ff0","#ff0","#ff3838"];
  for(let i=0;i<20;i++){
    let particle=document.createElement("div");
    particle.className="firework";
    particle.style.background=colors[Math.floor(Math.random()*colors.length)];
    particle.style.top="50%"; particle.style.left="50%";
    document.body.appendChild(particle);
    setTimeout(()=>{ particle.style.transform=`translate(${(Math.random()-0.5)*500}px, ${(Math.random()-0.5)*500}px)`; particle.style.opacity="0"; },50);
    setTimeout(()=>particle.remove(),1200);
  }
}
