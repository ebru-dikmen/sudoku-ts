<template>
  <div v-if="board.length > 0 && board[0].length > 0" class="grid">
    <div
      v-for="(row, rowIndex) in board"
      :key="rowIndex"
      class="row"
      :class="{
        'bold-right': rowIndex % 3 === 2, // Bold border after every 3rd column
        'bold-bottom': Math.floor(rowIndex / 9) % 3 === 2, // Bold border after every 3rd row
      }"
    >
      <BoardCell
        v-for="(cell, columnIndex) in row"
        :key="columnIndex"
        class="cell"
        :class="{
          'bold-right': columnIndex % 3 === 2,
          'bold-bottom': rowIndex % 3 === 2,
        }"
        :value="getCellValue(cell)"
        :isFixed="cell.isFixed"
        :isCorrect="cell.isCorrect"
        :isError="cell.isError"
        :isHint="cell.isHint"
        :game-finished="gameFinished"
        :disabled="disabled"
        @updateValue="(newValue:string) => updateCellValue(cell, newValue)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Cell from "@/model/Cell";
import BoardCell from "./BoardCell.vue";
import {
  ref,
  defineProps,
  watch,
  defineExpose,
  defineEmits,
  Ref,
  withDefaults,
} from "vue";

const score: Ref<number> = ref(0);
const timeSpent: Ref<number> = ref(0);
const board: Ref<Cell[][]> = ref(
  Array.from({ length: 9 }, () => Array(9).fill({}))
);

const gameFinished: Ref<boolean> = ref(false);

const emit = defineEmits([
  "updateScore",
  "gameFinished",
  "updateHintCellCount",
  "digitNotAvailable",
]);

const props = withDefaults(
  defineProps<{
    initialBoard: Array<Cell[]>;
    score: number;
    timeSpent: number;
    disabled: boolean;
  }>(),
  {
    initialBoard: () => Array.from({ length: 9 }, () => Array(9).fill({})),
    score: 0,
    timeSpent: 0,
    disabled: false,
  }
);

defineExpose({ useHint: useHintIfAvailable });

function useHintIfAvailable(): void {
  const positions: number[][] = [];

  board.value.forEach((row: Cell[], rowIndex: number) =>
    row.forEach((cell: Cell, columnIndex: number) => {
      if (!cell.isFixed && !cell.isHint && cell.playerValue === "") {
        positions.push([rowIndex, columnIndex]);
      }
    })
  );

  if (positions.length > 0) {
    const [row, column] =
      positions[Math.floor(Math.random() * positions.length)];

    let cell: Cell = board.value[row][column];

    cell.isHint = true;

    updateHintCellCount();

    updateStatus();
  }
}

function getCellValue(cell: Cell): string {
  let cellValue: string;

  if (cell.isFixed || cell.isHint) {
    cellValue = String(cell.actualValue);
  } else {
    cellValue = cell.playerValue;
  }

  return cellValue;
}

function updateHintCellCount(): void {
  const hintCellCount = countHintCells();
  emit("updateHintCellCount", hintCellCount);
}

function countDigit(digit: number): number {
  let digitCount = 0;

  board.value.forEach((row: Cell[]) =>
    row.forEach((cell: Cell) => {
      if (
        // for fixed
        (cell.isFixed && cell.actualValue === digit) ||
        // for hint
        (cell.isHint && cell.actualValue === digit) ||
        // for player value
        (!cell.isFixed && !cell.isHint && cell.playerValue === String(digit))
      ) {
        digitCount++;
      }
    })
  );

  return digitCount;
}

function updateDigitNotAvailable(): void {
  for (let i = 1; i <= 9; i++) {
    const digitCount: number = countDigit(i);
    if (digitCount === 9) {
      emit("digitNotAvailable", i);
    }
  }
}

function updateStatus(): void {
  updateDigitNotAvailable();

  // check game finished
  gameFinished.value = isGameFinished();

  // update score
  updateScore();

  // finish game
  if (gameFinished.value) {
    freezeCells();
    emit("gameFinished", gameFinished);
  }
}

function updateCellValue(cell: Cell, newValue: string): void {
  cell.playerValue = newValue;
  cell.isCorrect = checkCellCorrect(cell);
  cell.isError = checkCellError(cell);

  updateStatus();
}

function checkCellCorrect(cell: Cell): boolean {
  return (
    !cell.isFixed &&
    !cell.isHint &&
    String(cell.actualValue) === cell.playerValue
  );
}

function checkCellError(cell: Cell): boolean {
  return (
    !cell.isFixed &&
    !cell.isHint &&
    String(cell.actualValue) !== cell.playerValue &&
    cell.playerValue !== ""
  );
}

function updateScore(): void {
  score.value = calculateScore();
  emit("updateScore", score.value);
}

function isGameFinished(): boolean {
  const fixedCount: number = countFixedCells();
  const hintCount: number = countHintCells();
  const correctCount: number = countCorrectCells();
  const errorCount: number = countErrorCells();

  return fixedCount + hintCount + correctCount + errorCount === 81;
}

function countFixedCells(): number {
  let fixedCount = 0;

  board.value.forEach((row: Cell[]) =>
    row.forEach((cell: Cell) => {
      if (cell.isFixed) fixedCount++;
    })
  );

  return fixedCount;
}

function countHintCells(): number {
  let hintCount = 0;

  board.value.forEach((row: Cell[]) =>
    row.forEach((cell: Cell) => {
      if (cell.isHint) hintCount++;
    })
  );

  return hintCount;
}

function countCorrectCells(): number {
  let correctCount = 0;

  board.value.forEach((row: Cell[]) =>
    row.forEach((cell: Cell) => {
      if (checkCellCorrect(cell)) correctCount++;
    })
  );

  return correctCount;
}

function countErrorCells(): number {
  let errorCount = 0;

  board.value.forEach((row: Cell[]) =>
    row.forEach((cell: Cell) => {
      if (checkCellError(cell)) errorCount++;
    })
  );

  return errorCount;
}

function freezeCells(): void {
  board.value.forEach((row: Cell[]) =>
    row.forEach((cell: Cell) => {
      cell.isFixed = true;
    })
  );
}

function calculateScore(): number {
  // score calculation part 1
  const hintCount: number = countHintCells();
  const correctCount: number = countCorrectCells();
  const errorCount: number = countErrorCells();

  let score = 0;
  score += correctCount * 5 + errorCount * -1;

  let hintChange = -3;
  for (let i = 1; i <= hintCount; i++) {
    score += hintChange;
    hintChange--;
  }

  // score calculation part 2
  if (gameFinished.value && timeSpent.value <= 120) {
    score += 500 - timeSpent.value;
  }

  return score;
}

// watcher for board changes
watch(
  () => props.initialBoard,
  (newBoard: Cell[][]) => {
    board.value = newBoard;
    gameFinished.value = false;
    updateHintCellCount();
    updateDigitNotAvailable();
  }
);

// watcher for score and timer changes
watch(
  () => [props.score, props.timeSpent],
  ([newScore, newTime]: number[]) => {
    score.value = newScore;
    timeSpent.value = newTime;
  }
);
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-rows: repeat(9, 1fr);
  gap: 5px;
  justify-content: center;
}

.row {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 5px;
}
</style>
