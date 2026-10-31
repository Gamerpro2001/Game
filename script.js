const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreLeftEl = document.getElementById('score-left');
const scoreRightEl = document.getElementById('score-right');
const statusEl = document.getElementById('status');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GOAL_HEIGHT = 170;
const PLAYER_WIDTH = 18;
const PLAYER_HEIGHT = 110;
const BALL_RADIUS = 12;
const FIELD_PADDING = 30;

const keys = {
  w: false,
  s: false,
  ArrowUp: false,
  ArrowDown: false,
};

const playerLeft = {
  x: FIELD_PADDING + 32,
  y: HEIGHT / 2 - PLAYER_HEIGHT / 2,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  speed: 360,
  color: '#f5d76e',
  score: 0,
};

const playerRight = {
  x: WIDTH - FIELD_PADDING - 32 - PLAYER_WIDTH,
  y: HEIGHT / 2 - PLAYER_HEIGHT / 2,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  speed: 310,
  color: '#7dd3fc',
  score: 0,
};

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: BALL_RADIUS,
  vx: 0,
  vy: 0,
};

let kickoffTimer = 0;
let lastFrame = 0;
let gameStarted = false;

function resetBall(direction = 1) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.vx = direction * (Math.random() * 120 + 240);
  ball.vy = (Math.random() - 0.5) * 220;
  kickoffTimer = 0;
  statusEl.textContent = 'Play on!';
}

function updateScore() {
  scoreLeftEl.textContent = String(playerLeft.score);
  scoreRightEl.textContent = String(playerRight.score);
}

function handleInput(dt) {
  let move = 0;

  if (keys.w || keys.ArrowUp) move -= 1;
  if (keys.s || keys.ArrowDown) move += 1;

  if (move !== 0) {
    playerLeft.y += move * playerLeft.speed * dt;
  }

  playerLeft.y = clamp(playerLeft.y, FIELD_PADDING, HEIGHT - FIELD_PADDING - playerLeft.height);

  const targetY = ball.y - playerRight.height / 2;
  const aiMove = targetY > playerRight.y ? 1 : -1;
  const aiSpeed = ball.x > WIDTH * 0.4 ? 1 : 0.65;

  playerRight.y += aiMove * playerRight.speed * aiSpeed * dt;
  playerRight.y = clamp(playerRight.y, FIELD_PADDING, HEIGHT - FIELD_PADDING - playerRight.height);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function circleRectCollision(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function updateBall(dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.y - ball.radius <= FIELD_PADDING) {
    ball.y = FIELD_PADDING + ball.radius;
    ball.vy *= -1;
  }

  if (ball.y + ball.radius >= HEIGHT - FIELD_PADDING) {
    ball.y = HEIGHT - FIELD_PADDING - ball.radius;
    ball.vy *= -1;
  }

  const leftCollision = circleRectCollision(ball, playerLeft);
  if (leftCollision && ball.vx < 0) {
    const hitPoint = (ball.y - (playerLeft.y + playerLeft.height / 2)) / (playerLeft.height / 2);
    const angle = hitPoint * 1.2;
    const speed = Math.hypot(ball.vx, ball.vy) + 70;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
    ball.x = playerLeft.x + playerLeft.width + ball.radius + 1;
  }

  const rightCollision = circleRectCollision(ball, playerRight);
  if (rightCollision && ball.vx > 0) {
    const hitPoint = (ball.y - (playerRight.y + playerRight.height / 2)) / (playerRight.height / 2);
    const angle = hitPoint * 1.2;
    const speed = Math.hypot(ball.vx, ball.vy) + 70;
    ball.vx = -Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
    ball.x = playerRight.x - ball.radius - 1;
  }

  const leftGoal = ball.x - ball.radius < 0;
  const rightGoal = ball.x + ball.radius > WIDTH;

  if (leftGoal) {
    playerRight.score += 1;
    updateScore();
    statusEl.textContent = 'Goal for Away!';
    resetBall(-1);
  } else if (rightGoal) {
    playerLeft.score += 1;
    updateScore();
    statusEl.textContent = 'Goal for Home!';
    resetBall(1);
  }
}

function drawPitch() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#0b6b3f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 3;
  ctx.strokeRect(FIELD_PADDING, FIELD_PADDING, WIDTH - FIELD_PADDING * 2, HEIGHT - FIELD_PADDING * 2);

  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, FIELD_PADDING);
  ctx.lineTo(WIDTH / 2, HEIGHT - FIELD_PADDING);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  ctx.strokeRect(0, HEIGHT / 2 - GOAL_HEIGHT / 2, FIELD_PADDING, GOAL_HEIGHT);
  ctx.strokeRect(WIDTH - FIELD_PADDING, HEIGHT / 2 - GOAL_HEIGHT / 2, FIELD_PADDING, GOAL_HEIGHT);
}

function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(player.x + 3, player.y + 3, player.width - 6, player.height - 6);
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = '#f8fafc';
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#111827';
  ctx.arc(ball.x, ball.y, ball.radius * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  drawPitch();
  drawPlayer(playerLeft);
  drawPlayer(playerRight);
  drawBall();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0.016, 0.03);
  lastFrame = timestamp;

  if (gameStarted) {
    handleInput(dt);
    updateBall(dt);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const keyName = event.key;
  if (keyName in keys) {
    keys[keyName] = true;
  }

  if (!gameStarted) {
    gameStarted = true;
    statusEl.textContent = 'Play on!';
    resetBall(Math.random() > 0.5 ? 1 : -1);
  }
});

window.addEventListener('keyup', (event) => {
  const keyName = event.key;
  if (keyName in keys) {
    keys[keyName] = false;
  }
});

updateScore();
resetBall(1);
requestAnimationFrame(gameLoop);
