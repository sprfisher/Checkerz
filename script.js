const canvas = document.getElementById("can0");
const ctx = canvas.getContext("2d");

const boardWidth = 16; // Columns
const boardHeight = 8; // Rows
const squareSize = 50; // Each square's size in pixels
const checkerRadius = 20; // Size of the pieces

canvas.width = boardWidth * squareSize;
canvas.height = boardHeight * squareSize;

let board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(null));

// Players and pieces
const players = {
  PLAYER_1: "blue",
  PLAYER_2: "red",
};
let currentPlayer = players.PLAYER_1;

// Turn sequence definition
const turnSequence = [
  { player: players.PLAYER_1, turns: 1 },
  { player: players.PLAYER_2, turns: 3 },
  { player: players.PLAYER_1, turns: 2 },
  { player: players.PLAYER_2, turns: 2 },
  { player: players.PLAYER_1, turns: 3 },
  { player: players.PLAYER_2, turns: 1 },
];
let turnIndex = 0; // Index to track the current turn in the sequence
let remainingTurns = turnSequence[0].turns;

// Initialize pawns
function initializeBoard() {
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      if (row === 1 && col >= 4 && col < 12) {
        board[row][col] = { player: players.PLAYER_1 };
      } else if (row === 6 && col >= 4 && col < 12) {
        board[row][col] = { player: players.PLAYER_2 };
      }
    }
  }
  drawBoard();
}

// Draw the board
function drawBoard() {
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#ddd" : "#fff";
      ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);

      if (board[row][col]) {
        drawPiece(row, col, board[row][col].player);
      }
    }
  }
}

// Draw a piece
function drawPiece(row, col, color) {
  ctx.beginPath();
  ctx.arc(
    col * squareSize + squareSize / 2,
    row * squareSize + squareSize / 2,
    checkerRadius,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

// Handle click events
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / squareSize);
  const y = Math.floor((e.clientY - rect.top) / squareSize);

  handleCellClick(y, x);
});

let selectedPiece = null;

function handleCellClick(row, col) {
  if (selectedPiece) {
    movePiece(selectedPiece.row, selectedPiece.col, row, col);
    selectedPiece = null;
  } else if (board[row][col] && board[row][col].player === currentPlayer) {
    selectedPiece = { row, col };
  }
}

function movePiece(startRow, startCol, targetRow, targetCol) {
  if (
    isValidMove(startRow, startCol, targetRow, targetCol) &&
    !board[targetRow][targetCol]
  ) {
    board[targetRow][targetCol] = board[startRow][startCol];
    board[startRow][startCol] = null;

    if (
      (currentPlayer === players.PLAYER_1 && targetRow === boardHeight - 1) ||
      (currentPlayer === players.PLAYER_2 && targetRow === 0)
    ) {
      alert(`${currentPlayer} wins!`);
      resetGame();
      return;
    }

    remainingTurns--;
    if (remainingTurns === 0) {
      // Move to the next turn in the sequence
      turnIndex = (turnIndex + 1) % turnSequence.length;
      currentPlayer = turnSequence[turnIndex].player;
      remainingTurns = turnSequence[turnIndex].turns;
    }

    drawBoard();
  }
}

function isValidMove(startRow, startCol, targetRow, targetCol) {
  const rowDiff = Math.abs(targetRow - startRow);
  const colDiff = Math.abs(targetCol - startCol);

  // Allow forward and side-to-side moves, capture diagonally or horizontally
  return (
    (rowDiff === 1 && colDiff === 0) || // Forward
    (rowDiff === 0 && colDiff === 1) || // Side-to-side
    (rowDiff === 1 && colDiff === 1) // Diagonal
  );
}

function resetGame() {
  board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(null));
  initializeBoard();
  currentPlayer = players.PLAYER_1;
  turnIndex = 0;
  remainingTurns = turnSequence[0].turns;
}

initializeBoard();
