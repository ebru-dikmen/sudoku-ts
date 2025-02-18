class Cell {
  // default values
  actualValue = 0;
  playerValue = "";
  isFixed = false;
  isError = false;
  isCorrect = false;
  isHint = false;

  public constructor(
    actualValue: number,
    playerValue: string,
    isFixed: boolean,
    isError: boolean,
    isCorrect: boolean,
    isHint: boolean
  ) {
    this.actualValue = actualValue;
    this.playerValue = playerValue;
    this.isFixed = isFixed;
    this.isError = isError;
    this.isCorrect = isCorrect;
    this.isHint = isHint;
  }
}

export default Cell;
