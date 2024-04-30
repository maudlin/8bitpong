const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 50;
const PADDLE_COLOR = '#FFFFFF';
const BALL_SIZE = 10;
const BALL_COLOR = '#FFFFFF';
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED_X = 2;
const INITIAL_BALL_SPEED_Y = 2;

// Constants for AI behavior
const OPPONENT_REACTION_DELAY = 3; // Frames delay in reaction
const OPPONENT_ERROR_PROBABILITY = 0.01; // 20% chance per frame of moving incorrectly

// Adjust this constant to control how much the ball speeds up
const SPEED_INCREMENT = 1.05;  // 5% speed increase
const MAX_SPEED_X = 10;  // Maximum horizontal speed limit

// Game state
let paddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let opponentPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = -INITIAL_BALL_SPEED_X;
let ballSpeedY = INITIAL_BALL_SPEED_Y;
let playerScore = 0;
let opponentScore = 0;
let lastScorer = "player";
let flashOpacity = 0;

// Constants for the center of the opponent side
const OPPONENT_CENTER_Y = canvas.height / 2 - PADDLE_HEIGHT / 2;

// Global flag for AI activation and target position
let aiActive = false;
let targetPaddleY = OPPONENT_CENTER_Y;

// Key states
const keys = {};

// Draw functions
function drawPaddle(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
}

function drawBall(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, BALL_SIZE, BALL_SIZE);
}

function drawScore() {
    ctx.fillStyle = PADDLE_COLOR;
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${playerScore} | ${opponentScore}`, canvas.width / 2, 30);
}

function flashScreen() {
    ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    flashOpacity -= 0.1;
}

// Game logic functions
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedY = Math.random() > 0.5 ? INITIAL_BALL_SPEED_Y : -INITIAL_BALL_SPEED_Y;
    ballSpeedX = lastScorer === "player" ? INITIAL_BALL_SPEED_X : -INITIAL_BALL_SPEED_X;
    setTimeout(() => {
        ballSpeedX *= 1.1;
        if (lastScorer !== "player") {
            aiActive = false; // Deactivate AI if the player did not score last
            targetPaddleY = OPPONENT_CENTER_Y; // Set AI to move back to center
        }
    }, 2000);
}

function checkCollisionWithPaddle(x, y, paddleX, paddleY) {
    if (x < paddleX + PADDLE_WIDTH && x + BALL_SIZE > paddleX &&
        y < paddleY + PADDLE_HEIGHT && y + BALL_SIZE > paddleY) {

        // Calculate the hit position on the paddle
        const hitPos = (y + (BALL_SIZE / 2)) - (paddleY + (PADDLE_HEIGHT / 2));
        const normalizedHitPos = hitPos / (PADDLE_HEIGHT / 2);  // Normalize hit position between -1 and 1

        // Adjust ball Y speed based on where it hits the paddle
        const MAX_BOUNCE_ANGLE = Math.PI / 4;  // 45 degrees maximum bounce angle
        ballSpeedY = ballSpeedX * Math.tan(normalizedHitPos * MAX_BOUNCE_ANGLE);

        // Reverse the X direction of the ball
        ballSpeedX = -ballSpeedX;

        return true;
    }
    return false;
}


function updatePaddlePosition(event, movingDown) {
    if (movingDown) {
        paddleY += PADDLE_SPEED;
    } else {
        paddleY -= PADDLE_SPEED;
    }
    paddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, paddleY));
}

function handleKeyDown(event) {
    keys[event.key] = true;
}

function handleKeyUp(event) {
    keys[event.key] = false;
}

function handleMouseWheel(event) {
    const scrollSensitivity = 2; // Reduce this value to decrease sensitivity
    const delta = Math.sign(event.deltaY);

    if (delta > 0) {
        paddleY += PADDLE_SPEED * scrollSensitivity;  // Scroll down to move paddle down
    } else if (delta < 0) {
        paddleY -= PADDLE_SPEED * scrollSensitivity;  // Scroll up to move paddle up
    }

    paddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, paddleY));
}


function updateOpponentPaddle() {
    if (aiActive) {
        // Actively trying to hit the ball
        const centerOpponentPaddle = opponentPaddleY + PADDLE_HEIGHT / 2;
        if (ballY > centerOpponentPaddle) {
            opponentPaddleY += PADDLE_SPEED;
        } else if (ballY < centerOpponentPaddle) {
            opponentPaddleY -= PADDLE_SPEED;
        }
    } else {
        // Move towards the center when not active
        if (opponentPaddleY < targetPaddleY) {
            opponentPaddleY += Math.min(PADDLE_SPEED, targetPaddleY - opponentPaddleY);
        } else if (opponentPaddleY > targetPaddleY) {
            opponentPaddleY -= Math.min(PADDLE_SPEED, opponentPaddleY - targetPaddleY);
        }
    }

    // Ensure the opponent paddle stays within the bounds
    opponentPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, opponentPaddleY));
}



function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Wall collision
    if (ballY <= 0 || ballY + BALL_SIZE >= canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    // Score check
    if (ballX <= 0) {
        opponentScore++;
        lastScorer = "opponent";
        resetBall();
    } else if (ballX >= canvas.width) {
        playerScore++;
        lastScorer = "player";
        resetBall();
    }

    // Paddle collision
    if (checkCollisionWithPaddle(ballX, ballY, 10, paddleY) ||
        checkCollisionWithPaddle(ballX, ballY, canvas.width - PADDLE_WIDTH - 10, opponentPaddleY)) {
        ballSpeedX = -ballSpeedX;

        // Increase speed each time the ball hits a paddle, up to a maximum speed
        if (Math.abs(ballSpeedX) < MAX_SPEED_X) {
            ballSpeedX *= SPEED_INCREMENT;
        }
    }

    updateOpponentPaddle(); // Update opponent paddle position

    // Drawing everything
    drawBall(ballX, ballY, BALL_COLOR);
    drawPaddle(10, paddleY, PADDLE_COLOR);
    drawPaddle(canvas.width - PADDLE_WIDTH - 10, opponentPaddleY, PADDLE_COLOR);
    drawScore();
    if (flashOpacity > 0) flashScreen();
    requestAnimationFrame(gameLoop);
}



// Event listeners
document.addEventListener('wheel', handleMouseWheel);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Initialize game loop
requestAnimationFrame(gameLoop);
