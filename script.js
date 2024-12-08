// JavaScript Code for "First to the Other Side Wins"

// Wait until the DOM is fully loaded
window.onload = function () {
    // Canvas and Context
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Board Dimensions
    const COLS = 16;
    const ROWS = 8;
    const CELL_SIZE = 50;
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;

    // Players
    const PLAYER_1 = "blue";
    const PLAYER_2 = "red";
    let currentPlayer = PLAYER_1;

    // Turn Management
    const turnSequence = [
        { player: PLAYER_1, turns: 1 },
        { player: PLAYER_2, turns: 3 },
        { player: PLAYER_1, turns: 2 },
        { player: PLAYER_2, turns: 2 },
        { player: PLAYER_1, turns: 3 },
        { player: PLAYER_2, turns: 1 },
    ];
    let turnIndex = 0;
    let remainingTurns = turnSequence[turnIndex].turns;

    // Game Board
    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    // Pawns
    const pawns = {
        [PLAYER_1]: [],
        [PLAYER_2]: [],
    };

    // Initialize Game
    function initializeGame() {
        // Draw the board
        drawBoard();

        // Place pawns for Player 1
        for (let row = 1; row <= 2; row++) {
            for (let col = 4; col < 12; col++) {
                addPawn(row, col, PLAYER_1);
            }
        }

        // Place pawns for Player 2
        for (let row = 5; row <= 6; row++) {
            for (let col = 4; col < 12; col++) {
                addPawn(row, col, PLAYER_2);
            }
        }

        updateMessage();
    }

    // Draw the board
    function drawBoard() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? "#ddd" : "#fff";
                ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }

        // Draw all pawns
        Object.values(pawns).flat().forEach(drawPawn);
    }

    // Add a pawn
    function addPawn(row, col, player) {
        const pawn = { row, col, player };
        pawns[player].push(pawn);
        board[row][col] = pawn;
    }

    // Draw a pawn
    function drawPawn(pawn) {
        const { row, col, player } = pawn;
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(x, y, CELL_SIZE / 3, 0, Math.PI * 2);
        ctx.fillStyle = player;
        ctx.fill();
    }

    // Handle mouse clicks
    let selectedPawn = null;
    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

        handleClick(y, x);
    });

    // Handle pawn selection and movement
    function handleClick(row, col) {
        if (selectedPawn) {
            // Try to move the selected pawn
            if (tryMove(selectedPawn, row, col)) {
                selectedPawn = null;
                drawBoard();
                return;
            }
        }

        // Select a pawn
        const pawn = board[row][col];
        if (pawn && pawn.player === currentPlayer) {
            selectedPawn = pawn;
        }
    }

    // Attempt to move a pawn
    function tryMove(pawn, targetRow, targetCol) {
        const { row, col } = pawn;

        // Check if the target cell is empty
        if (board[targetRow][targetCol]) return false;

        // Calculate movement
        const rowDiff = Math.abs(targetRow - row);
        const colDiff = Math.abs(targetCol - col);

        // Allow forward, sideways, or diagonal moves
        if (
            (rowDiff === 1 && colDiff === 0) || // Forward
            (rowDiff === 0 && colDiff === 1) || // Sideways
            (rowDiff === 1 && colDiff === 1) // Diagonal
        ) {
            // Update board state
            board[row][col] = null;
            board[targetRow][targetCol] = pawn;

            // Update pawn position
            pawn.row = targetRow;
            pawn.col = targetCol;

            // Check for victory
            if (
                (pawn.player === PLAYER_1 && targetRow === ROWS - 1) ||
                (pawn.player === PLAYER_2 && targetRow === 0)
            ) {
                alert(`${pawn.player} Wins!`);
                resetGame();
            }

            // Manage turns
            remainingTurns--;
            if (remainingTurns === 0) {
                turnIndex = (turnIndex + 1) % turnSequence.length;
                currentPlayer = turnSequence[turnIndex].player;
                remainingTurns = turnSequence[turnIndex].turns;
            }

            updateMessage();
            return true;
        }

        return false;
    }

    // Update the message
    function updateMessage() {
        const message = document.getElementById("message");
        message.textContent = `Player ${currentPlayer === PLAYER_1 ? "1" : "2"}'s Turn. Moves Left: ${remainingTurns}`;
    }

    // Reset the game
    function resetGame() {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        pawns[PLAYER_1] = [];
        pawns[PLAYER_2] = [];
        currentPlayer = PLAYER_1;
        turnIndex = 0;
        remainingTurns = turnSequence[0].turns;
        initializeGame();
    }

    // Initialize the game
    initializeGame();
};
