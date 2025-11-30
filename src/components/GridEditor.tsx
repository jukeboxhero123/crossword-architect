import { useState, useMemo, useEffect } from 'react';
import type { Cell, Clue } from '../types';
import { calculateClueNumbers } from '../utils/crossword';

interface GridEditorProps {
  grid: Cell[][];
  onGridChange: (grid: Cell[][]) => void;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
  acrossClues: Clue[];
  downClues: Clue[];
}

export function GridEditor({ grid, onGridChange, selectedCell, onCellSelect, acrossClues, downClues }: GridEditorProps) {
  const [currentDirection, setCurrentDirection] = useState<'across' | 'down'>('across');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  const numCols = grid[0]?.length || grid.length;
  const numRows = grid.length;

  // Track shift key state globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Get word cells for a given position and direction
  const getWordCells = (row: number, col: number, direction: 'across' | 'down'): Array<{row: number, col: number}> => {
    const cells: Array<{row: number, col: number}> = [];
    const rowDelta = direction === 'down' ? 1 : 0;
    const colDelta = direction === 'across' ? 1 : 0;
    
    // Find start of word
    let startRow = row;
    let startCol = col;
    while (startRow >= 0 && startCol >= 0 && !grid[startRow][startCol].isBlack) {
      if (direction === 'across') {
        if (startCol === 0 || grid[startRow][startCol - 1].isBlack) break;
        startCol--;
      } else {
        if (startRow === 0 || grid[startRow - 1][startCol].isBlack) break;
        startRow--;
      }
    }
    
    // Collect all cells in word
    let r = startRow;
    let c = startCol;
    while (r >= 0 && r < numRows && c >= 0 && c < numCols && !grid[r][c].isBlack) {
      cells.push({ row: r, col: c });
      r += rowDelta;
      c += colDelta;
    }
    
    return cells;
  };

  // Get highlighted word cells based on selected cell and direction
  const highlightedWordCells = useMemo(() => {
    if (!selectedCell) return new Set<string>();
    const cells = getWordCells(selectedCell.row, selectedCell.col, currentDirection);
    return new Set(cells.map(c => `${c.row}-${c.col}`));
  }, [selectedCell, currentDirection, grid, numRows, numCols]);

  // Determine initial direction when selecting a cell
  const determineDirection = (row: number, col: number): 'across' | 'down' => {
    const hasRight = col < numCols - 1 && !grid[row][col + 1]?.isBlack;
    const hasLeft = col > 0 && !grid[row][col - 1]?.isBlack;
    const hasDown = row < numRows - 1 && !grid[row + 1]?.[col]?.isBlack;
    const hasUp = row > 0 && !grid[row - 1]?.[col]?.isBlack;
    
    const isPartOfHorizontal = hasRight || hasLeft;
    const isPartOfVertical = hasDown || hasUp;
    
    // If current direction is available, keep it
    if (currentDirection === 'across' && isPartOfHorizontal) {
      return 'across';
    }
    if (currentDirection === 'down' && isPartOfVertical) {
      return 'down';
    }
    
    // Otherwise, prefer horizontal if available
    if (isPartOfHorizontal) return 'across';
    if (isPartOfVertical) return 'down';
    
    return currentDirection;
  };
  const handleCellClick = (row: number, col: number, e?: React.MouseEvent) => {
    // Check global shift state or event shift key
    if (isShiftPressed || e?.shiftKey) {
      // Shift+click to toggle black square
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col].isBlack = !newGrid[row][col].isBlack;
      if (!newGrid[row][col].isBlack) {
        delete newGrid[row][col].number;
      }
      const numberedGrid = calculateClueNumbers(newGrid);
      onGridChange(numberedGrid);
    } else {
      // Check if clicking on the currently selected cell to toggle direction
      if (selectedCell?.row === row && selectedCell?.col === col) {
        toggleDirection(row, col);
      } else {
        const direction = determineDirection(row, col);
        setCurrentDirection(direction);
        onCellSelect(row, col);
      }
    }
  };

  const toggleDirection = (row: number, col: number) => {
    const hasRight = col < numCols - 1 && !grid[row][col + 1]?.isBlack;
    const hasLeft = col > 0 && !grid[row][col - 1]?.isBlack;
    const hasDown = row < numRows - 1 && !grid[row + 1]?.[col]?.isBlack;
    const hasUp = row > 0 && !grid[row - 1]?.[col]?.isBlack;
    
    const isPartOfHorizontal = hasRight || hasLeft;
    const isPartOfVertical = hasDown || hasUp;
    
    // Only toggle if both directions are available
    if (isPartOfHorizontal && isPartOfVertical) {
      setCurrentDirection(currentDirection === 'across' ? 'down' : 'across');
    } else if (isPartOfHorizontal && currentDirection === 'down') {
      setCurrentDirection('across');
    } else if (isPartOfVertical && currentDirection === 'across') {
      setCurrentDirection('down');
    }
  };

  const handleCellInput = (row: number, col: number, value: string) => {
    const newGrid = grid.map(r => [...r]);
    // Only allow single uppercase letter
    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    newGrid[row][col].letter = letter || undefined;
    onGridChange(newGrid);
    
    // Auto-advance to next cell if letter was typed
    if (letter) {
      moveToNextCell(row, col, currentDirection);
    }
  };

  // Find the start position of a clue
  const findClueStartPosition = (clueNumber: number): { row: number; col: number } | null => {
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (grid[r][c].number === clueNumber) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  // Check if a clue is complete (all cells have letters)
  const isClueComplete = (clueNumber: number, direction: 'across' | 'down'): boolean => {
    const cells = getWordCells(
      findClueStartPosition(clueNumber)?.row || 0,
      findClueStartPosition(clueNumber)?.col || 0,
      direction
    );
    return cells.every(({ row: r, col: c }) => {
      return grid[r]?.[c]?.letter && grid[r][c].letter.length === 1;
    });
  };

  // Get cells for a clue number in a specific direction
  const getClueCells = (clueNumber: number, direction: 'across' | 'down'): Array<{row: number, col: number}> => {
    const startPos = findClueStartPosition(clueNumber);
    if (!startPos) return [];
    return getWordCells(startPos.row, startPos.col, direction);
  };

  // Find the next fillable square in the next row/column
  const findNextClue = (row: number, col: number, direction: 'across' | 'down'): { row: number; col: number } | null => {
    const targetCoord = direction === 'across' ? row : col;
    const clues = direction === 'across' ? acrossClues : downClues;

    // First, try to find the first fillable square in the next row/column
    let bestCell: { row: number; col: number } | null = null;
    let bestCoord = Infinity;

    for (const clue of clues) {
      const pos = findClueStartPosition(clue.number);
      if (!pos) continue;

      const coord = direction === 'across' ? pos.row : pos.col;
      const cells = getClueCells(clue.number, direction);

      if (cells.length === 0) continue;

      // Find the next row/column with a fillable square (must be strictly greater)
      if (coord > targetCoord && coord < bestCoord) {
        // Find first empty or partially filled cell in this clue
        const firstFillable = cells.find(c => !grid[c.row]?.[c.col]?.letter) || cells[0];
        bestCell = firstFillable;
        bestCoord = coord;
      }
    }

    if (bestCell) return bestCell;

    // If no next row/col found, wrap around to first incomplete clue
    let firstIncomplete: { row: number; col: number } | null = null;
    let firstAny: { row: number; col: number } | null = null;
    let minCoord = Infinity;

    for (const clue of clues) {
      const pos = findClueStartPosition(clue.number);
      if (!pos) continue;

      const coord = direction === 'across' ? pos.row : pos.col;
      const cells = getClueCells(clue.number, direction);

      if (cells.length === 0) continue;

      if (coord < minCoord) {
        minCoord = coord;
        firstIncomplete = null;
        firstAny = null;
      }

      if (coord === minCoord) {
        if (!isClueComplete(clue.number, direction)) {
          if (!firstIncomplete) {
            // Find first empty or partially filled cell in this clue
            const firstFillable = cells.find(c => !grid[c.row]?.[c.col]?.letter) || cells[0];
            firstIncomplete = firstFillable;
          }
        }
        if (!firstAny) {
          firstAny = cells[0];
        }
      }
    }

    return firstIncomplete || firstAny;
  };

  // Find the previous fillable square in the previous row/column
  const findPreviousClue = (row: number, col: number, direction: 'across' | 'down'): { row: number; col: number } | null => {
    const targetCoord = direction === 'across' ? row : col;
    const clues = direction === 'across' ? acrossClues : downClues;

    // First, try to find the last fillable square in the previous row/column
    let bestCell: { row: number; col: number } | null = null;
    let bestCoord = -1;

    for (const clue of clues) {
      const pos = findClueStartPosition(clue.number);
      if (!pos) continue;

      const coord = direction === 'across' ? pos.row : pos.col;
      const cells = getClueCells(clue.number, direction);

      if (cells.length === 0) continue;

      // Find the previous row/column with a fillable square (must be strictly less)
      if (coord < targetCoord && coord > bestCoord) {
        // Get the last cell of this clue (or last empty cell if available)
        const lastEmpty = [...cells].reverse().find(c => !grid[c.row]?.[c.col]?.letter);
        bestCell = lastEmpty || cells[cells.length - 1];
        bestCoord = coord;
      }
    }

    if (bestCell) return bestCell;

    // If no previous row/col found, wrap around to last incomplete clue
    let lastIncomplete: { row: number; col: number } | null = null;
    let lastAny: { row: number; col: number } | null = null;
    let maxCoord = -1;

    for (const clue of clues) {
      const pos = findClueStartPosition(clue.number);
      if (!pos) continue;

      const coord = direction === 'across' ? pos.row : pos.col;
      const cells = getClueCells(clue.number, direction);

      if (cells.length === 0) continue;

      if (coord > maxCoord) {
        maxCoord = coord;
        lastIncomplete = null;
        lastAny = null;
      }

      if (coord === maxCoord) {
        if (!isClueComplete(clue.number, direction)) {
          if (!lastIncomplete) {
            // Get the last cell of this clue (or last empty cell if available)
            const lastEmpty = [...cells].reverse().find(c => !grid[c.row]?.[c.col]?.letter);
            lastIncomplete = lastEmpty || cells[cells.length - 1];
          }
        }
        if (!lastAny) {
          // Get the last cell of this clue
          lastAny = cells[cells.length - 1];
        }
      }
    }

    return lastIncomplete || lastAny;
  };

  const moveToNextCell = (row: number, col: number, direction: 'across' | 'down') => {
    const wordCells = getWordCells(row, col, direction);
    const currentIndex = wordCells.findIndex(c => c.row === row && c.col === col);
    
    if (currentIndex >= 0 && currentIndex < wordCells.length - 1) {
      // Move to next cell in current word
      const nextCell = wordCells[currentIndex + 1];
      setTimeout(() => {
        onCellSelect(nextCell.row, nextCell.col);
        // Focus the input in the next cell
        const nextInput = document.querySelector(
          `input[data-row="${nextCell.row}"][data-col="${nextCell.col}"]`
        ) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 0);
    } else {
      // Reached end of word, move to next clue in next row/column
      const nextClueCell = findNextClue(row, col, direction);
      if (nextClueCell) {
        setTimeout(() => {
          onCellSelect(nextClueCell.row, nextClueCell.col);
          // Focus the input in the next clue's first cell
          const nextInput = document.querySelector(
            `input[data-row="${nextClueCell.row}"][data-col="${nextClueCell.col}"]`
          ) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 0);
      }
    }
  };

  const moveToPreviousCell = (row: number, col: number, direction: 'across' | 'down') => {
    const wordCells = getWordCells(row, col, direction);
    const currentIndex = wordCells.findIndex(c => c.row === row && c.col === col);
    
    if (currentIndex > 0) {
      // Move to previous cell in current word
      const prevCell = wordCells[currentIndex - 1];
      setTimeout(() => {
        onCellSelect(prevCell.row, prevCell.col);
        // Focus the input in the previous cell
        const prevInput = document.querySelector(
          `input[data-row="${prevCell.row}"][data-col="${prevCell.col}"]`
        ) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }, 0);
    } else {
      // Reached start of word, move to previous clue in previous row/column
      const prevClueCell = findPreviousClue(row, col, direction);
      if (prevClueCell) {
        setTimeout(() => {
          onCellSelect(prevClueCell.row, prevClueCell.col);
          // Focus the input in the previous clue's last cell
          const prevInput = document.querySelector(
            `input[data-row="${prevClueCell.row}"][data-col="${prevClueCell.col}"]`
          ) as HTMLInputElement;
          if (prevInput) {
            prevInput.focus();
            prevInput.select();
          }
        }, 0);
      }
    }
  };

  const handleCellKeyDown = (row: number, col: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - clear current cell and move to previous
    if (e.key === 'Backspace') {
      const currentValue = (e.target as HTMLInputElement).value;
      // If cell is already empty, move to previous cell
      if (!currentValue || currentValue.length === 0) {
        e.preventDefault();
        moveToPreviousCell(row, col, currentDirection);
      } else {
        // Clear current cell
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col].letter = undefined;
        onGridChange(newGrid);
        // Move to previous cell
        e.preventDefault();
        moveToPreviousCell(row, col, currentDirection);
      }
    } else if (e.key === 'Delete') {
      // Delete clears current cell but doesn't move
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col].letter = undefined;
      onGridChange(newGrid);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Handle arrow key navigation
      let newRow = row;
      let newCol = col;
      
      if (e.key === 'ArrowLeft' && col > 0) newCol--;
      if (e.key === 'ArrowRight' && col < numCols - 1) newCol++;
      if (e.key === 'ArrowUp' && row > 0) newRow--;
      if (e.key === 'ArrowDown' && row < numRows - 1) newRow++;
      
      if (!grid[newRow][newCol].isBlack) {
        const direction = determineDirection(newRow, newCol);
        setCurrentDirection(direction);
        onCellSelect(newRow, newCol);
        setTimeout(() => {
          const nextInput = document.querySelector(
            `input[data-row="${newRow}"][data-col="${newCol}"]`
          ) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 0);
      }
    }
  };

  const cellSize = Math.min(600 / Math.max(numRows, numCols), 40);

  return (
    <div className="grid-editor">
      <div 
        className="grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numCols}, 1fr)`,
          gap: '2px',
          background: '#333',
          border: '3px solid #333',
          width: `${numCols * cellSize}px`,
          height: `${numRows * cellSize}px`,
        }}
      >
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`cell ${cell.isBlack ? 'black' : ''} ${
                selectedCell?.row === rowIdx && selectedCell?.col === colIdx ? 'selected' : ''
              } ${
                highlightedWordCells.has(`${rowIdx}-${colIdx}`) ? 'current-word' : ''
              }`}
              onClick={(e) => {
                // Always check global shift state on click
                handleCellClick(rowIdx, colIdx, e);
              }}
              style={{
                background: cell.isBlack 
                  ? '#333' 
                  : highlightedWordCells.has(`${rowIdx}-${colIdx}`)
                    ? selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                      ? '#90caf9'
                      : '#e3f2fd'
                    : '#fff',
                position: 'relative',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${cellSize * 0.4}px`,
                fontWeight: 'bold',
                border: selectedCell?.row === rowIdx && selectedCell?.col === colIdx 
                  ? '3px solid #667eea' 
                  : 'none',
              }}
            >
              {/* Invisible overlay when shift is pressed to handle black square toggle */}
              {isShiftPressed && !cell.isBlack && (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCellClick(rowIdx, colIdx, e);
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                  }}
                />
              )}
              {!cell.isBlack && cell.number && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '3px',
                    fontSize: `${cellSize * 0.25}px`,
                    color: '#333',
                  }}
                >
                  {cell.number}
                </span>
              )}
              {!cell.isBlack && (
                <input
                  type="text"
                  data-row={rowIdx}
                  data-col={colIdx}
                  value={cell.letter || ''}
                  onChange={(e) => handleCellInput(rowIdx, colIdx, e.target.value)}
                  onKeyDown={(e) => handleCellKeyDown(rowIdx, colIdx, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Check if clicking on the currently selected cell to toggle direction
                    if (selectedCell?.row === rowIdx && selectedCell?.col === colIdx) {
                      toggleDirection(rowIdx, colIdx);
                    } else {
                      const direction = determineDirection(rowIdx, colIdx);
                      setCurrentDirection(direction);
                      onCellSelect(rowIdx, colIdx);
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                    const direction = determineDirection(rowIdx, colIdx);
                    setCurrentDirection(direction);
                    onCellSelect(rowIdx, colIdx);
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    fontSize: `${cellSize * 0.5}px`,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    border: 'none',
                    background: 'transparent',
                    color: '#333',
                    padding: 0,
                    margin: 0,
                    outline: 'none',
                    cursor: 'text',
                    pointerEvents: isShiftPressed ? 'none' : 'auto',
                  }}
                  maxLength={1}
                />
              )}
            </div>
          ))
        )}
      </div>
      <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9em' }}>
        Type letters in cells • Auto-advances to next cell • Click current cell to toggle direction • Shift+Click to toggle black squares
      </p>
    </div>
  );
}

