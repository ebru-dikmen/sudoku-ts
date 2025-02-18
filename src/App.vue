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
      <ul>
        <li v-for="(player, index) in sortedLeadership" :key="index">
          <div v-if="player.playerDifficulty === 'beginner'">
            <h3>Beginner:</h3>
            <span class="rank">{{ index + 1 }}.</span>
            <span class="name">{{ player.name }} - </span>
            <span class="score">{{ player.playerScore }}</span>
          </div>
          <div v-if="player.playerDifficulty === 'intermediate'">
            <h3>intermediate:</h3>
            <span class="rank">{{ index + 1 }}.</span>
            <span class="name">{{ player.name }} - </span>
            <span class="score">{{ player.playerScore }}</span>
          </div>
          <div v-if="player.playerDifficulty === 'hard'">
            <h3>hard:</h3>
            <span class="rank">{{ index + 1 }}.</span>
            <span class="name">{{ player.name }} - </span>
            <span class="score">{{ player.playerScore }}</span>
          </div>
          <div v-if="player.playerDifficulty === 'expert'">
            <h3>expert:</h3>
            <span class="rank">{{ index + 1 }}.</span>
            <span class="name">{{ player.name }} - </span>
            <span class="score">{{ player.playerScore }}</span>
          </div>
        </li>
      </ul>
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
import { ref, onMounted, onUnmounted, Ref } from "vue";

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
let sortedLeadership = [];
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
  playerName.value = "";
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
  showIfPlayerNameEmpty();
}

function showIfPlayerNameEmpty() {
  if (playerName.value) {
    console.log("Starting game for player:", playerName.value);
  } else {
    alert("Please enter your name");
  }
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

function fillBoard(board: number[][], row: number, column: number): boolean {
  if (column === 9) {
    row++;
    column = 0;
  }
  if (row === 9) return true;

  let digits: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(
    () => Math.random() - 0.5
  );

  for (let digit of digits) {
    if (isValidMove(board, row, column, digit)) {
      board[row][column] = digit;
      if (fillBoard(board, row, column + 1)) return true;
      board[row][column] = 0;
    }
  }
  return false;
}

function createBoard(): Cell[][] {
  let board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  fillBoard(board, 0, 0);

  // Convert board to Cell matrix from number matrix
  return board.map((row: number[]) =>
    row.map(
      (digit: number) =>
        new Cell(digit, String(digit), true, false, false, false)
    )
  );
}

const handleFinishedGame = (isGameFinished: boolean) => {
  gameFinished.value = isGameFinished;
  playerResult.value = {
    playerScore: score.value,
    name: playerName.value,
    playerDifficulty: difficulty.value,
  };
  if (gameFinished.value) {
    stopTimer();
    leadership.value.push(playerResult.value);
    sortedLeadership = leadership.value.sort(
      (a, b) => a.playerScore - b.playerScore
    );
    displayAnimation.value = true;
  }

  console.log("leadership:", leadership);
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
  // switch (difficulty) {
  //   case "beginner":
  //     return Math.floor(Math.random() * (40 - 36 + 1)) + 36;
  //   case "intermediate":
  //     return Math.floor(Math.random() * (36 - 32 + 1)) + 32;
  //   case "hard":
  //     return Math.floor(Math.random() * (32 - 28 + 1)) + 28;
  //   case "expert":
  //     return Math.floor(Math.random() * (28 - 24 + 1)) + 24;
  //   default:
  //     return 32;
  // }
  difficulty = "rfvrgfb";
  return 79;
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
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  flex-wrap: wrap; /* Makes it responsive */
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
.button {
  margin: 0.9375rem;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  /* background-color: #0c3e77; */
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
.button:hover {
  background-color: #0c3e77;
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
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  flex-wrap: wrap; /* Makes it responsive */
  gap: 0.5rem;
}
.animation-content {
  color: #0c3e77;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 400px; /* Keeps it responsive */
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
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* Semi-transparent overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  backdrop-filter: blur(5px); /* Optional blur effect */
  z-index: 10;
  pointer-events: none; /* So clicks pass through */
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

.button {
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  background-color: #0c3e77;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #0056b3;
}
.leaderboard {
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 8px;
}
h2 {
  text-align: center;
  margin-bottom: 20px;
}

table,
ul {
  width: 100%;
  margin: 0 auto;
  border-collapse: collapse;
}

th,
td,
li {
  padding: 10px;
}
th {
  background-color: #0c3e77;
  color: white;
}

.rank {
  font-weight: bold;
}
</style>
