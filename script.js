const c0  = document.getElementById("can0");
const ctx = c0.getContext("2d");

let crown = new Image();
crown.src = "crown.png"; // Crown icon

/* Canvas specs */
const width  = c0.width;
const height = c0.height;

const board = [
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null]
];

const sideLengthOfSquare        = width / 8;  // 50px
const halfWaySideLengthOfSquare = width / 16; // 25px
const checkerRadius             = 20;

/* User info */
let lastClickedX = -1;
let lastClickedY = -1;
let EligbleMoves = [[-1, -1], [-1, -1], [-1, -1], [-1, -1]]; // x:y coordinates of each of the four directions
let killStreakOn = false;

let redsTurn = true;
let potentialKillCoords = []; // Double digit form
let potentialCasualty   = [];

let reds   = [];
let blacks = [];

/* AI info */
let simulatedArr = []
let minPointMove = 30;

let simulateLastClickedX = -1;
let simulateLastClickedY = -1;
let bestSimulatedMove    = []; // Move from to destination 
let specifiedCasuality   = null;
let b = false;

function initializeConfiguaration() {
  drawBoard();
  for(let i = 0; i < 3; i++) {
    for(let j = (1 + i) % 2; j < 8; j+=2) {
      let checker = new Checker(j, i, false, false, 0); // Black Checker
      board[i][j] = checker;
      drawChecker(checker);
      //blacks.push(checker);
    }
  }
  for(let i = 5; i < 8; i++) {
    for(let j = (1 + i) % 2; j < 8; j+=2) {
      let checker = new Checker(j, i, true, false, 0); // Red Checker
      board[i][j] = checker;
      drawChecker(checker);
      //reds.push(checker);
    }
  }
}

function countScore(arr) {
  let count = 0;

  for(let row of arr) {
    for(let tile of row) {
      if(tile != null) {
        if(tile.colorBoolean) {
          count += 2;
          count += (tile.isKing ? 1 : 0);
        } else {
          count -= 2;
          count -= (tile.isKing ? 1 : 0);
        }
      }
    }
  }
  return count;
}

function drawBoard() {
	for(let i = 0; i < height/sideLengthOfSquare; i++) {
    for(let j = 0; j < width/sideLengthOfSquare; j++) {
      ctx.fillStyle = ((i + j) % 2 == 0 ? "Moccasin" : "Tan");
      ctx.fillRect(i * sideLengthOfSquare, j * sideLengthOfSquare, sideLengthOfSquare, sideLengthOfSquare);
    }
  }
}

function drawChecker(checkPiece) {
  ctx.fillStyle = (checkPiece.colorBoolean ? "Red" : "Black");
  ctx.beginPath();
  ctx.arc(halfWaySideLengthOfSquare + checkPiece.i * sideLengthOfSquare,
          halfWaySideLengthOfSquare + checkPiece.j * sideLengthOfSquare,
          checkerRadius,
          0,
          Math.PI*2);
  ctx.fill(); // No need for closePath();
  if(checkPiece.isKing) ctx.drawImage(crown, halfWaySideLengthOfSquare + checkPiece.i * sideLengthOfSquare - 15, halfWaySideLengthOfSquare + checkPiece.j * sideLengthOfSquare - 15, 30, 30);
}

function selectedChecker(x, y) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(halfWaySideLengthOfSquare + x * sideLengthOfSquare,
          halfWaySideLengthOfSquare + y * sideLengthOfSquare,
          10,
          0,
          Math.PI*2);
  ctx.fill(); // No need for closePath();
  if(board[y][x].isKing) ctx.drawImage(crown, halfWaySideLengthOfSquare + x * sideLengthOfSquare - 15, halfWaySideLengthOfSquare + y * sideLengthOfSquare - 15, 30, 30);
}

class Checker {
  constructor(i, j, colorBoolean, isKing, point) {
    this.i = i;
    this.j = j;
    this.colorBoolean = colorBoolean;
    this.isKing       = isKing;
    this.point        = point;
  }
}

initializeConfiguaration();

c0.addEventListener('mousedown', function(e) {
  const rect = c0.getBoundingClientRect();
  const x    = Math.floor((e.clientX - rect.left) / sideLengthOfSquare);
  const y    = Math.floor((e.clientY - rect.top)  / sideLengthOfSquare);
  // Change color and design
  actHandler(x, y);
});

function actHandler(x, y) {
  // Double click and single click for own checker piece for Red&Black to highlight all non-aggresive possible moves
  //console.log(x + ", " + y)
  if(!killStreakOn && (board[y][x] != null && board[y][x].colorBoolean == redsTurn)) {
    if(x == lastClickedX && y == lastClickedY) {
      drawChecker(board[y][x]);
      lastClickedX = -1;
      lastClickedY = -1;
      setResetHighLight(x, y, "Tan", false, redsTurn ? 1 : -1, true, board);
      if(potentialKillCoords.length != 0) potentialKillCoords = resetPotentialKillMarkerAndCasualty(potentialKillCoords);
    } else if(!killStreakOn) {
      if(lastClickedY != -1) {
        drawChecker(board[lastClickedY][lastClickedX]);
        setResetHighLight(lastClickedX, lastClickedY, "Tan", false, redsTurn ? 1 : -1, true, board);
        if(potentialKillCoords.length != 0) potentialKillCoords = resetPotentialKillMarkerAndCasualty(potentialKillCoords);
      }
      selectedChecker(x, y);
      setResetHighLight(x, y, "#9fd38d", true, redsTurn ? 1 : -1, true, board);
      potentialKill(x, y, redsTurn ? 1 : -1, board[y][x].isKing, false, true);
      lastClickedX = x;
      lastClickedY = y;
    }
  }
  // Move checker piece for Red&Black
  if(!killStreakOn 
    &&((EligbleMoves[0][0] == x && EligbleMoves[0][1] == y) 
    || (EligbleMoves[1][0] == x && EligbleMoves[1][1] == y)
    || (EligbleMoves[2][0] == x && EligbleMoves[2][1] == y)
    || (EligbleMoves[3][0] == x && EligbleMoves[3][1] == y))) {

    drawEmptyTile(lastClickedX, lastClickedY);
    setResetHighLight(lastClickedX, lastClickedY, "Tan", false, redsTurn ? 1 : -1, true, board);

    board[y][x]   = board[lastClickedY][lastClickedX];
    board[y][x].i = x;
    board[y][x].j = y;
    board[lastClickedY][lastClickedX] = null;
    lastClickedX = -1;
    lastClickedY = -1;
    if(potentialKillCoords.length != 0) potentialKillCoords = resetPotentialKillMarkerAndCasualty(potentialKillCoords);
    drawChecker(board[y][x]);
    redsTurn = !redsTurn;

    if(!board[y][x].isKing && (y == 0 || y == 7)) {
      board[y][x].isKing = true;
      ctx.drawImage(crown, halfWaySideLengthOfSquare + x * sideLengthOfSquare - 15, halfWaySideLengthOfSquare + y * sideLengthOfSquare - 15, 30, 30);
      console.log("Draw crown");
    }

    if(!redsTurn) {
      //if(board[0][7].i != 7) console.log("WRONG OCCURED");
      heuristics();
    }
    return;
  }

  if(potentialKillCoords.includes((x * 10) + y)) {
    eliminateChecker(x, y, potentialKillCoords);
    drawEmptyTile(lastClickedX, lastClickedY);
    potentialKillCoords = [];

    setResetHighLight(lastClickedX, lastClickedY, "Tan", false, redsTurn ? 1 : -1, true, board);

    board[y][x]   = board[lastClickedY][lastClickedX];
    board[y][x].i = x;
    board[y][x].j = y;
    board[lastClickedY][lastClickedX] = null;
    lastClickedX = -1;
    lastClickedY = -1;

    drawChecker(board[y][x]);
    potentialKill(x, y, (redsTurn ? 1 : -1), board[y][x].isKing, true, true);
    if(killStreakOn) {
      lastClickedX = x;
      lastClickedY = y;
    }
    redsTurn = (killStreakOn ? redsTurn : !redsTurn);
    if(!board[y][x].isKing && (y == 0 || y == 7)) {
      board[y][x].isKing = true;
      ctx.drawImage(crown, halfWaySideLengthOfSquare + x * sideLengthOfSquare - 15, halfWaySideLengthOfSquare + y * sideLengthOfSquare - 15, 30, 30);
      console.log("Draw crown");
    }
    if(!redsTurn) { heuristics(); }
  }
}

///////////////////////////////////////////
/*----------HEURISTIC FUNCTIONS----------*/
///////////////////////////////////////////

function heuristics() { // WORK HERE !!!
  // Copy board
  simulatedArr = deepCopy(board);
  minPointMove = 30;
  let points;
  let bWin = 0;
  let risingEdgeTrigger = false;
  
  for(let i = 0; i < board.length; i++) {
    for(let j = 0; j < board[0].length; j++) {
      if(board[i][j] != null && !board[i][j].colorBoolean) {
        select(j, i);
        // Exmaine kills, potential kills are not stored in EligbleMoves array
        let simulatedPotentialKillCoords      = potentialKillCoords.slice();
        let simulatedPotentialCasualityCoords = potentialCasualty.map(g => new Checker(g.i, g.j, g.isKing, g.colorBoolean, g.point));

        // compKill(x, y, sPKC, sPCy, sArr, multiKillArr, rSX, rSY);
        compKill(j, i, simulatedPotentialKillCoords, simulatedPotentialCasualityCoords, deepCopy(simulatedArr), [], j, i);


        // Examine each of the four moves
        //console.log(EligbleMoves);
        for(let move of EligbleMoves) {
          if(move[0] != -1) {
            
            simulateMove(move[0], move[1]);
            points = countScore(simulatedArr);
            if(points < minPointMove) {
              //console.log(`${i}, ${j} -> ${move[1]}, ${move[0]}---`);
              console.log(EligbleMoves);
              //console.log(move);
              bWin = 2;
              minPointMove = points;
              bestSimulatedMove = [];
              bestSimulatedMove.push([i, j]);
              bestSimulatedMove.push([move[1], move[0]]);
              //console.log(bestSimulatedMove);
            }
            simulatedArr = deepCopy(board); // Reset board
          }
        }
        EligbleMoves = [[-1, -1], [-1, -1], [-1, -1], [-1, -1]];
      }
    }
  }
  console.log((bWin == 2 ? "Move" : (bWin == 1 ? "Kill" : "None. Error")));
  console.log(bestSimulatedMove);
  //EligbleMoves = [[-1, -1], [-1, -1], [-1, -1], [-1, -1]];
  //if(board[0][7].i != 7) console.log("WRONG OCCURED");
  for(let p = 0; p < bestSimulatedMove.length; p++) setTimeout(actHandler, p * 300, bestSimulatedMove[p][1], bestSimulatedMove[p][0]);
  bestSimulatedMove = [];
}  
// Heuristic without graphics to reduce lag

function select(x, y) {
  //console.log(arr[y][x]);
  potentialKill(x, y, -1, simulatedArr[y][x].isKing, false, false)
  //simulatePotentialKill(x, y, simulatedArr[y][x].isKing, false, simulatedArr);
  // Find a way to fill EligbleMoves array
  setResetHighLight(x, y, "Tan", true, -1, false, simulatedArr);
  simulateLastClickedX = x;
  simulateLastClickedY = y;
}

function deepCopy(array) {
  let arr = [];
  for(let row of array) {
    let r = [];
    for(let i of row) {
      r.push(i == null ? null : new Checker(i.i, i.j, i.colorBoolean, i.isKing, i.point));
    }
    arr.push(r);
  }
  return arr;
}

function simulateMove(x, y) {
  // setResetHighLight(lastClickedX, lastClickedY, "Tan", false, redsTurn ? 1 : -1, true, board); Is reduntant?
  simulatedArr[y][x]   = simulatedArr[simulateLastClickedY][simulateLastClickedX];
  simulatedArr[y][x].i = x;
  simulatedArr[y][x].j = y;
  simulatedArr[simulateLastClickedY][simulateLastClickedX] = null;
  //simulateLastClickedX = -1;
  //simulateLastClickedY = -1;

  if(!simulatedArr[y][x].isKing && (y == 0 || y == 7)) {
    simulatedArr[y][x].isKing = true;
    console.log("Draw crown");
  }
  return;
}

function sPK(x, y, isKing, isCheckingForMultiKill, arr) {
  let pKC  = [];
  let pC   = [];
  let kSOn = false;

  if(isCheckingForMultiKill) kSOn = false;

  for(let i = -2; i <= 2; i+=4) {
    for(let j = -2; j <= (isKing ? 2 : 0); j+=4) {
      if(0 <= x + i && x + i < 8              // Is the x-cord within its bounds?
        && 0 <= y - j && y - j < 8            // Is the y-cord within its bounds?
        && arr[y - j/2][x + i/2] != null      // Is there a checker piece to the spot adjacent to you?
        && arr[y - j/2][x + i/2].colorBoolean // Is that checker piece red?
        && arr[y - j][x + i] == null) {       // Is the spot behind the red checker empty?
      
        pKC.push(10 * (x + i) + (y - j));
        pC.push(board[y - j/2][x + i/2]);
        if(isCheckingForMultiKill) kSOn = true;
      }
    }
  }

  return [pKC, pC, kSOn];
}

function compKill(x, y, sPKC, sPCy, sArr, multiKillArr, rSX, rSY) {
  // sPKC : simulatedPotentialKillCoords
  // sPCy : simulatedPotentialCasuality
  // sArr : simulatedArr
  // rSX  : realStepX, checker's starting position
  // rSY  : realStepY, checker's starting position

  // DCsArr : DeepCopy_sArr
  let DCsArr = deepCopy(sArr);

  for(let k = 0; k < sPKC.length; k++) {
    let kill      = sPKC[k];
    let kx        = ~~(kill / 10);
    let ky        = kill % 10;
    let killedTag = sPCy[k];
    
    // simulateCheckerElimination(x, y);
    sArr[killedTag.j][killedTag.i] = null; // Removes the enemy checker piece

    // simulatekill();
    sArr[ky][kx]   = sArr[y][x];
    sArr[ky][kx].i = kx;
    sArr[ky][kx].j = ky;
    sArr[y][x]     = null;

    // sPK(x, y, isKing, isCheckingForMultiKill, arr);
    let killData = sPK(kx, ky, sArr[ky][kx].isKing, true, sArr);

    if(!sArr[ky][kx].isKing && ky % 7 == 0) { // if, New king is crowned
      sArr[ky][kx].isKing = true;
      killData[2]         = false;
    }

    if(killData[2]) { // if, isKillStreakOn
      multiKillArr.push([ky, kx]);
      compKill(kx, ky, killData[0], killData[1], deepCopy(sArr), multiKillArr.slice(), rSX, rSY);
    } else {
      points = countScore(sArr);
      if(points < minPointMove) { // Calculate points
        minPointMove = points;
        // How will bestSimulatedMove store multi jump ? : TODO
        bestSimulatedMove.splice(1);
        bestSimulatedMove[0] = [rSY, rSX];
        bestSimulatedMove.push(...multiKillArr);
        bestSimulatedMove.push([ky, kx]);
        //bestSimulatedMove[0] = [i, j];
        //bestSimulatedMove[1] = [kill % 10, ~~(kill / 10)];
        //console.log(bestSimulatedMove);
      }
    }
    sArr = deepCopy(DCsArr);
  }
}

///////////////////////////////////////////
/*------END HEURISTIC FUNCTIONS----------*/
///////////////////////////////////////////

function setResetHighLight(x, y, color, IsGoingToRecordMove, dy, trueForColor, arr) {
  if(trueForColor) ctx.fillStyle = color;
  let k = 0;
  for(let i = -1; i <= 1; i+=2) {
    for(let j = -1; j <= (arr[y][x].isKing ? 1 : 0); j+=2)  {
      //console.log(`x:${x + i} y:${y + j * dy}`);
      if(0 <= y + j * dy && y + j * dy < 8 
        && 0 <= x + i && x + i < 8
        && arr[y + j * dy][x + i] == null) {
        if(trueForColor) ctx.fillRect((x + i) * sideLengthOfSquare, (y + j * dy) * sideLengthOfSquare, sideLengthOfSquare, sideLengthOfSquare);
        if(!redsTurn) console.log(`x:${x + i} y:${y + j * dy} --- ${x}, ${y}`);
        EligbleMoves[k] = [IsGoingToRecordMove ? x + i : -1, IsGoingToRecordMove ? y + j * dy : -1];
      }
      k++;
    }
  }
}

function potentialKill(x, y, dy, isKing, isCheckingForMultiKill, trueForColor) {
  if(trueForColor) ctx.fillStyle = "#d38d8d";
  if(isCheckingForMultiKill) killStreakOn = false;

  for(let i = -2; i <= 2; i+=4) {
    for(let j = -2; j <= (isKing ? 2 : 0); j+=4) {
      if(0 <= x + i && x + i < 8                                   // Is the x-cord within its bounds?
        && 0 <= y + j * dy && y + j * dy < 8                       // Is the y-cord within its bounds?
        && board[y + j/2 * dy][x + i/2] != null                    // Is there a checker piece to the spot adjacent to you?
        && board[y + j/2 * dy][x + i/2].colorBoolean == (dy == -1) // Is that checker piece an enemy?
        && board[y + j * dy][x + i] == null) {                     // Is the spot behind the enemy checker empty?
      
        if(trueForColor) ctx.fillRect((x + i) * sideLengthOfSquare, (y + j * dy) * sideLengthOfSquare, sideLengthOfSquare, sideLengthOfSquare);
        potentialKillCoords.push(10 * (x + i) + (y + j * dy));
        potentialCasualty.push(board[y + j/2 * dy][x + i/2]);
        if(isCheckingForMultiKill) killStreakOn = true;
      }
    }
  }
}

function resetPotentialKillMarkerAndCasualty(arr) {
  for(let i = 0; i < arr.length; i++) {
    drawEmptyTile(Math.floor(arr[i] / 10), arr[i] % 10);
  }
  potentialCasualty = [];
  return [];
}

function eliminateChecker(x, y, arr) {
  let indx = arr.indexOf((x * 10) + y);
  if(indx != -1) {
    let recentlyEliminatedChecker = potentialCasualty[indx];
    console.log("recentlyEliminatedChecker");
    console.log(recentlyEliminatedChecker);
    board[recentlyEliminatedChecker.j][recentlyEliminatedChecker.i] = null;
    resetPotentialKillMarkerAndCasualty(arr);
    drawEmptyTile(recentlyEliminatedChecker.i, recentlyEliminatedChecker.j);
  }
}

function drawEmptyTile(x, y) {
  ctx.fillStyle = "Tan";
  ctx.fillRect(x * sideLengthOfSquare, y * sideLengthOfSquare, sideLengthOfSquare, sideLengthOfSquare);
}
