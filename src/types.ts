export interface Cell {
  isBlack: boolean;
  isCircle?: boolean;
  isShaded?: boolean;
  paintColor?: string; // Color for completion paint mode
  number?: number;
  letter?: string;
  isSelected?: boolean;
}

export interface Clue {
  number: number;
  text: string;
  answer: string;
}

export interface Crossword {
  grid: Cell[][];
  acrossClues: Clue[];
  downClues: Clue[];
  title?: string;
  author?: string;
}

