import type { Cell, Clue } from '../types';

export function createEmptyGrid(rows: number, cols: number): Cell[][] {
  return Array(rows).fill(null).map(() => 
    Array(cols).fill(null).map(() => ({ isBlack: false }))
  );
}

export function calculateClueNumbers(grid: Cell[][]): Cell[][] {
  // Create a deep copy and clear all numbers first
  const newGrid: Cell[][] = grid.map(row => 
    row.map(cell => ({
      isBlack: cell.isBlack,
      letter: cell.letter,
      isSelected: cell.isSelected
      // number will be set below
    }))
  );
  
  let clueNumber = 1;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].isBlack) {
        continue;
      }

      const isStartOfAcross = col === 0 || grid[row][col - 1].isBlack;
      const hasAcrossSpace = col < grid[row].length - 1 && !grid[row][col + 1].isBlack;
      
      const isStartOfDown = row === 0 || grid[row - 1][col].isBlack;
      const hasDownSpace = row < grid.length - 1 && !grid[row + 1][col].isBlack;

      if ((isStartOfAcross && hasAcrossSpace) || (isStartOfDown && hasDownSpace)) {
        newGrid[row][col].number = clueNumber++;
      }
    }
  }

  return newGrid;
}

export function getCluesForGrid(grid: Cell[][]): { across: Clue[], down: Clue[] } {
  const across: Clue[] = [];
  const down: Clue[] = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      
      if (cell.isBlack || !cell.number) continue;

      // Check for across clue
      if (col === 0 || grid[row][col - 1].isBlack) {
        if (col < grid[row].length - 1 && !grid[row][col + 1].isBlack) {
          const existing = across.find(c => c.number === cell.number);
          if (!existing) {
            across.push({
              number: cell.number,
              text: '',
              answer: ''
            });
          }
        }
      }

      // Check for down clue
      if (row === 0 || grid[row - 1][col].isBlack) {
        if (row < grid.length - 1 && !grid[row + 1][col].isBlack) {
          const existing = down.find(c => c.number === cell.number);
          if (!existing) {
            down.push({
              number: cell.number,
              text: '',
              answer: ''
            });
          }
        }
      }
    }
  }

  return { across: across.sort((a, b) => a.number - b.number), down: down.sort((a, b) => a.number - b.number) };
}

