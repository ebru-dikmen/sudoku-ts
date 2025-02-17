<template>
  <input
    class="cell"
    type="number"
    min="1"
    max="9"
    v-model="currentValue"
    @input="updateValueIfValid"
    :disabled="isFixed || isHint"
    :class="{
      fixed: isFixed,
      correct: gameFinished && isCorrect,
      error: gameFinished && isError,
      hint: isHint,
    }"
  />
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, Ref, withDefaults } from "vue";

const currentValue: Ref<string> = ref("");

const emit = defineEmits(["updateValue"]);

const props = withDefaults(
  defineProps<{
    value: string;
    isFixed: boolean;
    isCorrect: boolean;
    isError: boolean;
    isHint: boolean;
    gameFinished: boolean;
  }>(),
  {
    value: "",
    isFixed: false,
    isCorrect: false,
    isError: false,
    isHint: false,
    gameFinished: false,
  }
);

function updateValueIfValid(event: Event): void {
  const target = event.target as HTMLSelectElement;

  if (target?.value) {
    let numberValue = Number(target.value);

    // reset cell value if not valid input
    if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 9) {
      target.value = "";
      currentValue.value = "";
    }

    // update cell value
    else {
      emit("updateValue", String(numberValue));
    }
  }
}

watch(
  () => props.value,
  (newValue: string) => {
    currentValue.value = newValue;
  }
);
</script>

<style scoped>
.cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 1px solid black;
  cursor: pointer;
  background-color: white;
}

.fixed {
  background-color: lightgray;
  cursor: not-allowed;
}

.correct {
  background-color: lightgreen;
}

.error {
  background-color: pink;
}

.hint {
  background-color: yellow;
  cursor: not-allowed;
}
</style>
