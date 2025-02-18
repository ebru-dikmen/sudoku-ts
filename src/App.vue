<template>
  <div class="container">
    <h1 class="header">Sudoku Game</h1>
  </div>
  <div class="container">
    <div>
      <input
        :disabled="isTriggerPause"
        class="player-name-input"
        type="text"
        v-model="playerName"
        placeholder="Player Name"
      />
    </div>
    <div class="difficulty">
      <select
        v-model="difficulty"
        @change="selectDifficulty"
        :disabled="isTriggerPause"
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="hard">Hard</option>
        <option value="expert">Expert</option>
      </select>
    </div>
    <h4>Score: {{ score }}</h4>
    <h4>Time Spent: {{ timeSpent }}</h4>
    <button @click="pauseTimer"><span>⏸️</span></button>
    <button
      class="button"
      @click="showHintIfAvailable"
      :disabled="gameFinished || isTriggerPause"
    >
      Hint ({{ 10 - hintCellCount }})
    </button>
    <button class="button" :disabled="isTriggerPause" @click="resetGame">
      Restart
    </button>
  </div>

  <div class="board-container">
    <Board
      :disabled="isTriggerPause"
      :initialBoard="board"
      :timeSpent="timeSpent"
      @updateScore="handleScoreUpdate"
      @gameFinished="handleFinishedGame"
      @updateHintCellCount="handleHintCellCount"
      @digitNotAvailable="handleDigitNotAvailable"
      ref="hint"
    />

    <div class="leaderboard">
      <h2>Leadersboard:</h2>
      <div v-for="(group, difficulty) in groupedLeadership" :key="difficulty">
        <h3>{{ capitalize(difficulty) }}:</h3>
        <ul>
          <li v-for="(player, index) in group" :key="index">
            <span class="rank">{{ index + 1 }}.</span>
            <span class="name">{{ player.name }} - </span>
            <span class="score">{{ player.playerScore }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="container">
    <transition name="fade">
      <div v-if="displayAnimation" class="animation">
        <div class="animation-content">
          <h1>Game Over</h1>
          <p>Your Score: {{ score }}</p>
        </div>
      </div>
    </transition>
  </div>

  <div class="digit-selection">
    <button
      class="digit-button"
      v-for="digit in 9"
      :key="digit"
      :disabled="!availableDigits[digit - 1]"
    >
      {{ digit }}
    </button>
  </div>
</template>

<script setup lang="ts">
import Board from "./components/GameBoard.vue";
import Cell from "./model/Cell";
import { ref, onMounted, onUnmounted, Ref, computed } from "vue";

const score: Ref<number> = ref(0);
// eslint-disable-next-line
const hint: Ref<{ useHint: () => void }> = ref({ useHint: () => {} });
const difficulty: Ref<string> = ref("beginner");
const timeSpent: Ref<number> = ref(0);
const hintCellCount: Ref<number> = ref(0);
const gameFinished: Ref<boolean> = ref(false);
const availableDigits: Ref<boolean[]> = ref(Array(9).fill(true));
const displayAnimation = ref(false);
const board: Ref<Cell[][]> = ref(
  Array.from({ length: 9 }, () => Array(9).fill({}))
);
let intervalId = -1;
let isTriggerPause = ref(false);
let playerName = ref("");
let leadership: Ref<
  { playerScore: number; name: string; playerDifficulty: string }[]
> = ref([]);
let playerResult = ref({
  playerScore: 0,
  name: "",
  playerDifficulty: "beginner",
});
let playerNameCount = 1;
const defaultPlayerName = "player";

const groupedLeadership = computed(() => {
  return leadership.value.reduce((groups, player) => {
    if (!groups[player.playerDifficulty]) {
      groups[player.playerDifficulty] = [];
    }
    groups[player.playerDifficulty].push(player);
    return groups;
  }, {} as Record<string, { playerScore: number; name: string; playerDifficulty: string }[]>);
});

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

onMounted(() => {
  // set default difficulty
  difficulty.value = "beginner";
  // initialize game
  resetGame();
});

onUnmounted(() => {
  stopTimer();
});

function selectDifficulty(event: Event): void {
  const target = event.target as HTMLSelectElement;
  if (target?.value) difficulty.value = target.value;
}

// initialize game
function resetGame(): void {
  if (displayAnimation.value) {
    displayAnimation.value = false;
  }
  // reset score
  score.value = 0;
  // reset available digits
  availableDigits.value = Array(9).fill(true);
  // hide animation
  displayAnimation.value = false;
  // reset game status
  gameFinished.value = false;
  setTimeout(() => {
    resetTimer();
    resetBoard();
  }, 700);
}

function startTimer(): void {
  intervalId = setInterval(() => {
    timeSpent.value += 1;
  }, 1000);
}

function stopTimer(): void {
  if (intervalId !== -1) {
    clearInterval(intervalId);
  }
}

function resetTimer(): void {
  stopTimer();
  timeSpent.value = 0;
  startTimer();
}

function pauseTimer() {
  isTriggerPause.value = !isTriggerPause.value;
  if (isTriggerPause.value) {
    stopTimer();
  } else {
    startTimer();
  }
}
function resetBoard(): void {
  board.value = createBoard();
  applyDifficultyToBoard(board.value, difficulty.value);
}

function createBoard(): Cell[][] {
  const board: number[][] = generateBoard();

  // Convert board to Cell matrix from number matrix
  return board.map((row: number[]) =>
    row.map(
      (digit: number) =>
        new Cell(digit, String(digit), true, false, false, false)
    )
  );
}
function initializeBoard(defaultValue: number): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(defaultValue));
}

function convertBoardToSequences(
  board: number[][]
): [number[][], number[][], number[][]] {
  const rows: number[][] = [];
  const columns: number[][] = [];
  const subGrids: number[][] = [];

  // initialize sequences
  for (let i = 0; i < 9; i++) {
    rows.push([]);
    columns.push([]);
  }
  for (let i = 0; i < 9; i++) {
    subGrids.push([]);
  }
  // fill sequences
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const value = board[i][j];
      rows[i].push(value);
      columns[j].push(value);
      subGrids[Math.floor(i / 3) * 3 + Math.floor(j / 3)].push(value);
    }
  }

  return [rows, columns, subGrids];
}
function validateBoard(board: number[][]): boolean {
  if (!board || board.length !== 9 || board[0].length !== 9) {
    return false;
  }

  // sequences
  const [rows, columns, subGrids] = convertBoardToSequences(board);

  // check sequences (rows, columns, subgrids) are valid
  return [...rows, ...columns, ...subGrids].every(isValidSequence);
}

function isValidSequence(sequence: number[]): boolean {
  const numbers = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return (
    sequence.length === 9 &&
    new Set(sequence).size === 9 &&
    sequence.every((value) => numbers.has(value))
  );
}

function shuffleNumbers(numbers: number[]): void {
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
}

function isPlacementValid(
  board: number[][],
  rowIndex: number,
  columnIndex: number,
  number: number
): boolean {
  // check if number already exists in row or column
  for (let i = 0; i < 9; i++) {
    if (board[rowIndex][i] === number || board[i][columnIndex] === number) {
      return false;
    }
  }

  // check if number already exists in subgrid
  const startRowIndex = Math.floor(rowIndex / 3) * 3;
  const startColumnIndex = Math.floor(columnIndex / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRowIndex + i][startColumnIndex + j] === number) {
        return false;
      }
    }
  }

  return true;
}

function fillBoard(board: number[][], defaultValue: number): boolean {
  let filled = false;

  for (let rowIndex = 0; rowIndex < 9; rowIndex++) {
    for (let columnIndex = 0; columnIndex < 9; columnIndex++) {
      if (board[rowIndex][columnIndex] === defaultValue) {
        // Shuffle possible numbers for randomness
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleNumbers(numbers);

        let validNumberFound = false;
        for (const number of numbers) {
          if (isPlacementValid(board, rowIndex, columnIndex, number)) {
            board[rowIndex][columnIndex] = number;
            validNumberFound = true;
            filled = true;

            // move to the next cell
            break;
          }
        }

        // exit if no valid number found
        if (!validNumberFound) {
          return false;
        }
      }
    }
  }

  return filled;
}

function generateBoard(): number[][] {
  const defaultValue = -1;

  // initialize board
  let board: number[][] = initializeBoard(defaultValue);

  // try to generate valid board
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // fill board
    let filled: boolean = fillBoard(board, defaultValue);

    // validate board if board filled
    if (filled && validateBoard(board)) {
      return board;
    }
    // reset board if board not filled
    else {
      board = initializeBoard(defaultValue);
    }
  }
}

const handleFinishedGame = (isGameFinished: boolean) => {
  gameFinished.value = isGameFinished;
  let name =
    playerName.value !== ""
      ? playerName.value
      : defaultPlayerName + playerNameCount;
  playerResult.value = {
    playerScore: score.value,
    name: name,
    playerDifficulty: difficulty.value,
  };
  if (gameFinished.value) {
    stopTimer();
    leadership.value.push(playerResult.value);
    playerNameCount++;

    displayAnimation.value = true;
  }
};

function applyDifficultyToBoard(board: Cell[][], difficulty: string): void {
  let positions: number[][] = [];

  board.forEach((row: Cell[], rowIndex: number) =>
    row.forEach((cell: Cell, columnIndex: number) => {
      positions.push([rowIndex, columnIndex]);
    })
  );

  let fixedCellCount: number = getFixedCellCountByDifficulty(difficulty);

  let playerCellCount: number = 81 - fixedCellCount;

  positions.sort(() => Math.random() - 0.5);

  let playerCells: number[][] = positions.slice(0, playerCellCount);

  for (let [row, column] of playerCells) {
    board[row][column] = new Cell(
      board[row][column].actualValue,
      "",
      false,
      false,
      false,
      false
    );
  }
}

function getFixedCellCountByDifficulty(difficulty: string): number {
  switch (difficulty) {
    case "beginner":
      return Math.floor(Math.random() * (40 - 36 + 1)) + 36;
    case "intermediate":
      return Math.floor(Math.random() * (36 - 32 + 1)) + 32;
    case "hard":
      return Math.floor(Math.random() * (32 - 28 + 1)) + 28;
    case "expert":
      return Math.floor(Math.random() * (28 - 24 + 1)) + 24;
    default:
      return 32;
  }
}

const handleScoreUpdate = (newScore: number) => (score.value = newScore);

const handleHintCellCount = (newHintCellCount: number) =>
  (hintCellCount.value = newHintCellCount);

const handleDigitNotAvailable = (notAvailableDigit: number) =>
  (availableDigits.value[notAvailableDigit - 1] = false);

function showHintIfAvailable(): void {
  if (hintCellCount.value >= 10) {
    alert(
      "You reached max number of hint usages! (max: 10, used:" +
        hintCellCount.value +
        ")"
    );
  } else if (hint.value) hint.value.useHint();
}

function isValidMove(
  board: number[][],
  row: number,
  column: number,
  digit: number
): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === digit || board[i][column] === digit) return false;
    let boxRow: number = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    let boxColumn: number = 3 * Math.floor(column / 3) + (i % 3);
    if (board[boxRow][boxColumn] === digit) return false;
  }
  return true;
}
</script>

<style>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background-color: #ffd700;
  color: #0c3e77;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 0px 4px 6px #0c3e77;
}
.digit-selection {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.625rem;
  pointer-events: none;
}
.digit-button {
  margin: 0.9375rem;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
}

.button:hover {
  background-color: #3d82cc;
}
.button {
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  background-color: #0c3e77;
  font-size: 1rem;
  color: white;
  border: none;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.3s ease-in-out;
}
.button:disabled {
  background-color: #ccc; /* Gray when disabled */
  cursor: not-allowed;
  opacity: 0.6;
}

select {
  padding: 0.3125rem;
  font-size: 1rem;
  height: 2.7em;
}

.difficulty {
  display: flex;
  max-height: auto;
}

.board-container {
  position: relative; /* So the animation is positioned within this */
  display: inline-block;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.animation-content {
  color: #0c3e77;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
.animation {
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-wrap: break-word;
  font-size: 2rem;
  font-weight: bold;
  z-index: 0;
  pointer-events: none;
}
/* Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease-in-out, transform 0.5s;
}
.fade-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.player-name-input {
  padding: 0.6rem;
  font-size: 0.8rem;
  margin: 1em 0;
  border-radius: 1em;
  border: #0c3e77;
  outline: auto;
}

.leaderboard {
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 8px;
  overflow-y: scroll;
  overflow-x: hidden;
  height: 20em;
}
h2 {
  text-align: center;
  margin-bottom: 20px;
}

.rank {
  font-weight: bold;
}
</style>
