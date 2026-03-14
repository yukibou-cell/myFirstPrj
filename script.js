// Canvas and context setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameActive = false;
let gamePaused = false;
let score = 0;
let life = 3;
let level = 1;
let ballSpeed = 3;

// Paddle
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 20,
    width: 100,
    height: 15,
    speed: 8,
    dx: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 8,
    dx: 3,
    dy: -3,
    speed: ballSpeed
};

// Bricks setup
let bricks = [];
let brickRows = 4;
let brickCols = 8;
let brickWidth = 80;
let brickHeight = 15;
let brickPadding = 10;

// Input handling
const keys = {};

// Mouse tracking for paddle
let mouseX = canvas.width / 2;
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (!gameActive && !gamePaused) {
            startGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Button event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);

// Initialize game
function initBricks() {
    bricks = [];
    for (let row = 0; row < brickRows; row++) {
        for (let col = 0; col < brickCols; col++) {
            const x = col * (brickWidth + brickPadding) + brickPadding;
            const y = row * (brickHeight + brickPadding) + 50;
            bricks.push({
                x: x,
                y: y,
                width: brickWidth,
                height: brickHeight,
                active: true,
                color: getColorForRow(row)
            });
        }
    }
}

function getColorForRow(row) {
    const colors = ['#FF6B6B', '#FF8E72', '#FFB26B', '#FFC75F'];
    return colors[row % colors.length];
}

function startGame() {
    gameActive = true;
    gamePaused = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    if (Math.abs(ball.dx) < 1 && Math.abs(ball.dy) < 1) {
        ball.dx = 3;
        ball.dy = -3;
    }
    
    gameLoop();
}

function togglePause() {
    if (!gameActive) return;
    gamePaused = !gamePaused;
    document.getElementById('pauseBtn').textContent = gamePaused ? '再開' : '一時停止';
    if (!gamePaused) {
        gameLoop();
    }
}

function resetGame() {
    gameActive = false;
    gamePaused = false;
    score = 0;
    life = 3;
    level = 1;
    ballSpeed = 3;
    
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = 3;
    ball.dy = -3;
    
    paddle.x = canvas.width / 2 - 50;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    updateUI();
    draw();
}

function gameLoop() {
    if (!gameActive || gamePaused) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update paddle position
    const targetX = Math.max(0, Math.min(mouseX - paddle.width / 2, canvas.width - paddle.width));
    paddle.x += (targetX - paddle.x) * 0.15;
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
    }
    
    // Update ball
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collision
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }
    
    // Paddle collision
    if (ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        ball.dy *= -1;
        const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dx += hitPos * 2;
    }
    
    // Brick collision
    for (let brick of bricks) {
        if (!brick.active) continue;
        if (ball.x > brick.x && ball.x < brick.x + brick.width &&
            ball.y > brick.y && ball.y < brick.y + brick.height) {
            brick.active = false;
            ball.dy *= -1;
            score += level * 10;
            updateUI();
            break;
        }
    }
    
    // Check if all bricks destroyed
    if (bricks.every(b => !b.active)) {
        nextLevel();
    }
    
    // Out of bounds
    if (ball.y > canvas.height) {
        life--;
        if (life <= 0) {
            endGame();
        } else {
            resetBall();
        }
        updateUI();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
    ball.dy = -3;
}

function nextLevel() {
    level++;
    ballSpeed += 0.5;
    initBricks();
    resetBall();
    updateUI();
}

function endGame() {
    gameActive = false;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('gameOverMessage').textContent = `スコア: ${score}`;
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('life').textContent = life;
    document.getElementById('level').textContent = level;
}

function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Bricks
    for (let brick of bricks) {
        if (brick.active) {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
    }
    
    // Paddle
    ctx.fillStyle = '#667eea';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Ball
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

// Initialize
initBricks();
updateUI();
draw();
