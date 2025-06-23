// Game constants
const COLS = 10;
const ROWS = 20;
const EMPTY = 'white';

// Tetromino shapes
const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

// Tetromino colors
const COLORS = {
    I: 'I',
    J: 'J',
    L: 'L',
    O: 'O',
    S: 'S',
    T: 'T',
    Z: 'Z'
};

// Game variables
let grid;
let currentPiece;
let nextPiece;
let score;
let level;
let lines;
let gameOver;
let isPaused;
let dropInterval;
let dropStart;
let isMobile;

// DOM elements
const gridElement = document.getElementById('grid');
const nextPieceElement = document.getElementById('nextPiece');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const gameOverElement = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const mobileControls = document.getElementById('mobileControls');
const mobileLeft = document.getElementById('mobileLeft');
const mobileRight = document.getElementById('mobileRight');
const mobileDown = document.getElementById('mobileDown');
const mobileRotate = document.getElementById('mobileRotate');
const mobileDrop = document.getElementById('mobileDrop');

// Initialize the game
function init() {
    // Check if mobile device
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create grid
    grid = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
    
    // Initialize game state
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    
    // Update UI
    updateScore();
    createGrid();
    generateNextPiece();
    spawnPiece();
    
    // Event listeners
    document.addEventListener('keydown', control);
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    
    // Mobile controls
    if (isMobile) {
        mobileLeft.addEventListener('touchstart', () => moveLeft());
        mobileRight.addEventListener('touchstart', () => moveRight());
        mobileDown.addEventListener('touchstart', () => moveDown());
        mobileRotate.addEventListener('touchstart', () => rotate());
        mobileDrop.addEventListener('touchstart', () => hardDrop());
        
        // Prevent default to avoid scrolling when touching buttons
        mobileControls.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    } else {
        mobileLeft.addEventListener('click', () => moveLeft());
        mobileRight.addEventListener('click', () => moveRight());
        mobileDown.addEventListener('click', () => moveDown());
        mobileRotate.addEventListener('click', () => rotate());
        mobileDrop.addEventListener('click', () => hardDrop());
    }
}

// Create the game grid in the DOM
function createGrid() {
    gridElement.innerHTML = '';
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.style.backgroundColor = grid[row][col] === EMPTY ? 'transparent' : grid[row][col];
            if (grid[row][col] !== EMPTY) {
                cell.classList.add('filled');
            }
            gridElement.appendChild(cell);
        }
    }
}

// Generate a random tetromino
function randomPiece() {
    const keys = Object.keys(SHAPES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
        shape: SHAPES[randomKey],
        color: COLORS[randomKey],
        pos: {x: Math.floor(COLS / 2) - 1, y: 0}
    };
}

// Generate the next piece and display it
function generateNextPiece() {
    nextPiece = randomPiece();
    displayNextPiece();
}

// Display the next piece in the sidebar
function displayNextPiece() {
    nextPieceElement.innerHTML = '';
    
    const size = nextPiece.shape.length;
    const offset = size === 2 ? 1 : size === 3 ? 0.5 : 0;
    
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const cell = document.createElement('div');
            cell.classList.add('next-cell');
            
            if (row < size && col < size && nextPiece.shape[row][col]) {
                cell.classList.add('filled');
                cell.classList.add(nextPiece.color);
            }
            
            nextPieceElement.appendChild(cell);
        }
    }
}

// Spawn a new piece
function spawnPiece() {
    currentPiece = {
        shape: nextPiece.shape,
        color: nextPiece.color,
        pos: {x: Math.floor(COLS / 2) - Math.floor(nextPiece.shape[0].length / 2), y: 0}
    };
    
    generateNextPiece();
    
    // Check if game over
    if (collision()) {
        gameOver = true;
        clearInterval(dropInterval);
        gameOverElement.classList.add('active');
    }
}

// Rotate the current piece
function rotate() {
    const originalShape = currentPiece.shape;
    
    // Transpose the matrix
    const rows = currentPiece.shape.length;
    const cols = currentPiece.shape[0].length;
    const newShape = Array(cols).fill().map(() => Array(rows).fill(0));
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            newShape[col][rows - 1 - row] = currentPiece.shape[row][col];
        }
    }
    
    currentPiece.shape = newShape;
    
    // If rotation causes collision, revert
    if (collision()) {
        currentPiece.shape = originalShape;
    } else {
        draw();
    }
}

// Check for collisions
function collision() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const x = currentPiece.pos.x + col
