import { useState, useEffect, useMemo } from 'react';
import type { Crossword, Cell } from './types';
import { createEmptyGrid, calculateClueNumbers, getCluesForGrid } from './utils/crossword';
import { exportToHTML } from './utils/export';
import { GridEditor } from './components/GridEditor';
import { ClueEditor } from './components/ClueEditor';
import './App.css';

const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 15;
const STORAGE_KEY = 'crossword-architect-save';

interface SavedCrossword {
  gridRows: number;
  gridCols: number;
  grid: Cell[][];
  acrossClues: Crossword['acrossClues'];
  downClues: Crossword['downClues'];
  title: string;
  author: string;
}

function App() {
  const [gridRows, setGridRows] = useState(DEFAULT_ROWS);
  const [gridCols, setGridCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [acrossClues, setAcrossClues] = useState<Crossword['acrossClues']>([]);
  const [downClues, setDownClues] = useState<Crossword['downClues']>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [title, setTitle] = useState('My Crossword Puzzle');
  const [author, setAuthor] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Track black squares pattern to detect changes
  const blackSquaresKey = useMemo(() => 
    grid.map(r => r.map(c => c.isBlack ? '1' : '0').join('')).join('|'),
    [grid]
  );

  // Calculate numbered grid and clues when black squares change
  const { numberedGrid, across, down } = useMemo(() => {
    const numbered = calculateClueNumbers(grid);
    const clues = getCluesForGrid(numbered);
    return { numberedGrid: numbered, across: clues.across, down: clues.down };
  }, [blackSquaresKey]);

  // Update grid with numbers when they change
  useEffect(() => {
    setGrid(numberedGrid);
  }, [numberedGrid]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: SavedCrossword = JSON.parse(saved);
        setIsLoading(true);
        setGridRows(data.gridRows);
        setGridCols(data.gridCols);
        setGrid(data.grid);
        setAcrossClues(data.acrossClues || []);
        setDownClues(data.downClues || []);
        setTitle(data.title || 'My Crossword Puzzle');
        setAuthor(data.author || '');
        // Mark as loaded after a brief delay to let state settle
        setTimeout(() => setIsLoading(false), 100);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setIsLoading(false);
    }
  }, []);

  // Update clues when they change, preserving existing clue text/answers
  useEffect(() => {
    // Don't merge clues while loading from localStorage
    if (isLoading) return;
    
    const mergeClues = (existing: typeof across, newClues: typeof across) => {
      // Start with new clues from grid, then preserve text/answers from existing clues
      const existingMap = new Map(existing.map(c => [c.number, c]));
      return newClues.map(clue => {
        const existingClue = existingMap.get(clue.number);
        if (existingClue) {
          // Preserve existing text and answer
          return {
            ...clue,
            text: existingClue.text,
            answer: existingClue.answer
          };
        }
        return clue;
      });
    };
    
    setAcrossClues(prev => mergeClues(prev, across));
    setDownClues(prev => mergeClues(prev, down));
  }, [across, down, isLoading]);

  const handleGridChange = (newGrid: Cell[][]) => {
    setGrid(newGrid);
  };

  const handleNewGrid = () => {
    if (confirm('Create a new grid? This will clear your current crossword.')) {
      const newGrid = createEmptyGrid(gridRows, gridCols);
      setGrid(newGrid);
      setAcrossClues([]);
      setDownClues([]);
      setSelectedCell(null);
    }
  };

  const handleSizeChange = (rows: number, cols: number) => {
    if (rows >= 5 && rows <= 50 && cols >= 5 && cols <= 50) {
      // Check if grid has been modified (has black squares or clues with content)
      const hasBlackSquares = grid.some(row => row.some(cell => cell.isBlack));
      const hasCluesWithContent = [...acrossClues, ...downClues].some(
        clue => clue.text.trim() !== '' || clue.answer.trim() !== ''
      );
      
      const shouldWarn = hasBlackSquares || hasCluesWithContent;
      
      if (!shouldWarn || confirm('Change grid size? This will clear your current crossword.')) {
        setGridRows(rows);
        setGridCols(cols);
        const newGrid = createEmptyGrid(rows, cols);
        setGrid(newGrid);
        setAcrossClues([]);
        setDownClues([]);
        setSelectedCell(null);
      }
    }
  };

  const saveToLocalStorage = () => {
    try {
      const data: SavedCrossword = {
        gridRows,
        gridCols,
        grid,
        acrossClues,
        downClues,
        title,
        author,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Auto-save with debounce
  useEffect(() => {
    // Don't auto-save while loading
    if (isLoading) return;
    
    const timeoutId = setTimeout(() => {
      saveToLocalStorage();
    }, 500); // Save after 500ms of inactivity

    return () => clearTimeout(timeoutId);
  }, [grid, acrossClues, downClues, title, author, gridRows, gridCols, isLoading]);

  const handleExport = () => {
    const crossword: Crossword = {
      grid,
      acrossClues,
      downClues,
      title,
      author,
    };

    const html = exportToHTML(crossword);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const titlePart = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const authorPart = author ? `_by_${author.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` : '';
    a.download = `${titlePart}${authorPart}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧩 Crossword Architect</h1>
        <p className="subtitle">Build beautiful crossword puzzles for your friends</p>
      </header>

      <div className="app-content">
        <div className="sidebar">
          <div className="sidebar-section">
            <h2>Settings</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Crossword Title"
              />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your Name"
              />
            </div>
            <div className="form-group">
              <label>Grid Size</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={gridRows}
                  onChange={(e) => {
                    const rows = parseInt(e.target.value) || gridRows;
                    if (rows >= 5 && rows <= 50) {
                      handleSizeChange(rows, gridCols);
                    }
                  }}
                  style={{ width: '80px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                />
                <span>×</span>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={gridCols}
                  onChange={(e) => {
                    const cols = parseInt(e.target.value) || gridCols;
                    if (cols >= 5 && cols <= 50) {
                      handleSizeChange(gridRows, cols);
                    }
                  }}
                  style={{ width: '80px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h2>Actions</h2>
            <button onClick={handleNewGrid} className="btn btn-secondary">
              New Grid
            </button>
            <button onClick={handleExport} className="btn btn-primary">
              Export HTML
            </button>
            <p style={{ marginTop: '10px', fontSize: '0.85em', color: '#666', fontStyle: 'italic' }}>
              Auto-saves as you work
            </p>
          </div>
        </div>

        <div className="main-content">
          <div className="grid-section">
            <GridEditor
              grid={grid}
              onGridChange={handleGridChange}
              selectedCell={selectedCell}
              onCellSelect={(row, col) => setSelectedCell({ row, col })}
            />
          </div>

          <div className="clues-section">
            <div className="clues-container">
              <ClueEditor
                title="Across"
                clues={acrossClues}
                onCluesChange={setAcrossClues}
              />
              <ClueEditor
                title="Down"
                clues={downClues}
                onCluesChange={setDownClues}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
