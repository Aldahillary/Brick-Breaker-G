const startScreen = document.getElementById('startScreen');
const levelScreen = document.getElementById('levelScreen');
const gameScreen = document.getElementById('gameScreen');
const playBtn = document.getElementById('playBtn');
const levelBtn = document.getElementById('levelBtn');
const backBtn = document.getElementById('backBtn');
const exitBtn = document.getElementById('exitBtn');
const levelGrid = document.getElementById('levelGrid');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelDisplay = document.getElementById('levelDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');

let currentLevel = 1;
let score = 0;
let lives = 3;
let paddle, ball, bricks, brickRowCount, brickColumnCount;
let rightPressed = false;
let leftPressed = false;

// Load saved level
if (localStorage.getItem('brickGameLevel')) {
  currentLevel = parseInt(localStorage.getItem('brickGameLevel'));
}

// ---------------- Start/Level Screen ----------------
playBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  initLevel(currentLevel);
  gameScreen.classList.remove('hidden');
});

levelBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  showLevels();
  levelScreen.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
  levelScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

exitBtn.addEventListener('click', () => {
  gameScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  saveProgress();
});

// ---------------- Level Select ----------------
function showLevels() {
  levelGrid.innerHTML = '';
  for (let i = 1; i <= 100; i++) {
    const tile = document.createElement('div');
    tile.classList.add('levelTile');

    let playedLevel = parseInt(localStorage.getItem('brickGameLevel') || '0');

    if (i < playedLevel) tile.style.background = 'green';
    else if (i === playedLevel) tile.style.background = 'yellow';
    else tile.style.background = 'gray';

    tile.textContent = i;
    tile.addEventListener('click', () => {
      if (i <= playedLevel + 1) {
        currentLevel = i;
        levelScreen.classList.add('hidden');
        initLevel(currentLevel);
        gameScreen.classList.remove('hidden');
      }
    });
    levelGrid.appendChild(tile);
  }
}

// ---------------- Game Mechanics ----------------
function initLevel(level) {
  levelDisplay.textContent = `Level: ${level}`;
  scoreDisplay.textContent = `Score: ${score}`;
  livesDisplay.textContent = `Lives: ${'❤️'.repeat(lives)}`;

  paddle = {
    height: 15,
    width: 100,
    x: canvas.width/2 - 50,
    speed: 8
  };

  ball = {
    x: canvas.width/2,
    y: canvas.height - 50,
    radius: 10,
    dx: 4,
    dy: -4
  };

  // Level-based brick setup
  brickRowCount = Math.min(5 + Math.floor(level/20), 10);
  brickColumnCount = Math.min(7 + Math.floor(level/15), 14);
  bricks = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[r] = [];
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[r][c] = { x: 0, y: 0, status: 1, color: `hsl(${(level*10 + r*20 + c*10)%360},70%,50%)` };
    }
  }

  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);
  document.addEventListener('mousemove', mouseMoveHandler);

  requestAnimationFrame(draw);
}

function keyDownHandler(e) {
  if(e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
  else if(e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
}

function keyUpHandler(e) {
  if(e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
  else if(e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
}

function mouseMoveHandler(e) {
  let relativeX = e.clientX - canvas.offsetLeft;
  if(relativeX > 0 && relativeX < canvas.width) paddle.x = relativeX - paddle.width/2;
}

// ---------------- Draw Functions ----------------
function drawPaddle() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  const brickWidth = (canvas.width - brickColumnCount*10) / brickColumnCount;
  const brickHeight = 20;
  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < brickColumnCount; c++) {
      if (bricks[r][c].status === 1) {
        let brickX = c*(brickWidth+10) + 5;
        let brickY = r*(brickHeight+10) + 50;
        bricks[r][c].x = brickX;
        bricks[r][c].y = brickY;
        ctx.fillStyle = bricks[r][c].color;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
      }
    }
  }
}

// ---------------- Collision ----------------
function collisionDetection() {
  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < brickColumnCount; c++) {
      let b = bricks[r][c];
      if(b.status === 1) {
        if(ball.x > b.x && ball.x < b.x + (canvas.width - brickColumnCount*10)/brickColumnCount &&
           ball.y > b.y && ball.y < b.y + 20) {
          ball.dy = -ball.dy;
          b.status = 0;
          score += 10;
          scoreDisplay.textContent = `Score: ${score}`;
          if(isLevelCleared()) nextLevel();
        }
      }
    }
  }
}

function isLevelCleared() {
  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < brickColumnCount; c++) {
      if (bricks[r][c].status === 1) return false;
    }
  }
  return true;
}

function nextLevel() {
  currentLevel++;
  localStorage.setItem('brickGameLevel', currentLevel);
  initLevel(currentLevel);
}

// ---------------- Game Loop ----------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  // Ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collision
  if(ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) ball.dx = -ball.dx;
  if(ball.y + ball.dy < ball.radius) ball.dy = -ball.dy;
  else if(ball.y + ball.dy > canvas.height - ball.radius - paddle.height - 10) {
    if(ball.x > paddle.x && ball.x < paddle.x + paddle.width) ball.dy = -ball.dy;
    else loseLife();
  }

  // Paddle movement
  if(rightPressed && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;
  if(leftPressed && paddle.x > 0) paddle.x -= paddle.speed;

  requestAnimationFrame(draw);
}

// ---------------- Life ----------------
function loseLife() {
  lives--;
  livesDisplay.textContent = `Lives: ${'❤️'.repeat(lives)}`;
  if(lives === 0) {
    alert('Game Over!');
    lives = 3;
    score = 0;
    currentLevel = 1;
    localStorage.setItem('brickGameLevel', currentLevel);
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  } else {
    ball.x = canvas.width/2;
    ball.y = canvas.height - 50;
    ball.dx = 4;
    ball.dy = -4;
    paddle.x = canvas.width/2 - paddle.width/2;
  }
}

// ---------------- Save Progress ----------------
function saveProgress() {
  localStorage.setItem('brickGameLevel', currentLevel);
}
