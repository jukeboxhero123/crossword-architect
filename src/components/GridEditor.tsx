import type { Cell } from '../types';
import { calculateClueNumbers } from '../utils/crossword';

interface GridEditorProps {
  grid: Cell[][];
  onGridChange: (grid: Cell[][]) => void;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
}

export function GridEditor({ grid, onGridChange, selectedCell, onCellSelect }: GridEditorProps) {
  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+click to toggle black square
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col].isBlack = !newGrid[row][col].isBlack;
      if (!newGrid[row][col].isBlack) {
        delete newGrid[row][col].number;
      }
      const numberedGrid = calculateClueNumbers(newGrid);
      onGridChange(numberedGrid);
    } else {
      onCellSelect(row, col);
    }
  };

  const numCols = grid[0]?.length || grid.length;
  const numRows = grid.length;
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
              }`}
              onClick={(e) => handleCellClick(rowIdx, colIdx, e)}
              style={{
                background: cell.isBlack ? '#333' : '#fff',
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
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    fontSize: `${cellSize * 0.5}px`,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cell.letter ? '#333' : 'transparent',
                    pointerEvents: 'none',
                  }}
                >
                  {cell.letter || ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9em' }}>
        Click cells to select • Shift+Click to toggle black squares
      </p>
    </div>
  );
}

