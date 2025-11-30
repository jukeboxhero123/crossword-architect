import { useState, useEffect, useMemo } from 'react';
import type { Crossword, Cell } from './types';
import { createEmptyGrid, calculateClueNumbers, getCluesForGrid, getClueAnswer } from './utils/crossword';
import { exportToHTML } from './utils/export';
import { GridEditor } from './components/GridEditor';
import { ClueEditor } from './components/ClueEditor';
import { Menu } from './components/Menu';
import './App.css';

const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 15;
const STORAGE_KEY = 'crossword-architect-saves';

export interface SavedCrossword {
  id: string;
  gridRows: number;
  gridCols: number;
  grid: Cell[][];
  acrossClues: Crossword['acrossClues'];
  downClues: Crossword['downClues'];
  title: string;
  author: string;
  lastModified: number;
}

function App() {
  const [currentView, setCurrentView] = useState<'menu' | 'editor'>('menu');
  const [currentCrosswordId, setCurrentCrosswordId] = useState<string | null>(null);
  const [savedCrosswords, setSavedCrosswords] = useState<SavedCrossword[]>([]);
  
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

  // Load saved crosswords list from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const crosswords: SavedCrossword[] = JSON.parse(saved);
        setSavedCrosswords(crosswords);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setIsLoading(false);
    }
  }, []);

  // Update clues when they change, preserving existing clue text (but not answers - they come from grid)
  useEffect(() => {
    // Don't merge clues while loading from localStorage
    if (isLoading) return;
    
    const mergeClues = (existing: typeof across, newClues: typeof across) => {
      // Start with new clues from grid, then preserve text from existing clues
      const existingMap = new Map(existing.map(c => [c.number, c]));
      return newClues.map(clue => {
        const existingClue = existingMap.get(clue.number);
        if (existingClue) {
          // Preserve existing text only (answer comes from grid)
          return {
            ...clue,
            text: existingClue.text
          };
        }
        return clue;
      });
    };
    
    setAcrossClues(prev => mergeClues(prev, across));
    setDownClues(prev => mergeClues(prev, down));
  }, [across, down, isLoading]);

  // Compute answers from grid for all clues
  const computedAnswers = useMemo(() => {
    const answers = new Map<string, string>();
    
    // Compute across answers
    acrossClues.forEach(clue => {
      const answer = getClueAnswer(grid, clue.number, 'across');
      if (answer) {
        answers.set(`across-${clue.number}`, answer);
      }
    });
    
    // Compute down answers
    downClues.forEach(clue => {
      const answer = getClueAnswer(grid, clue.number, 'down');
      if (answer) {
        answers.set(`down-${clue.number}`, answer);
      }
    });
    
    return answers;
  }, [grid, acrossClues, downClues]);

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
    if (!currentCrosswordId) return; // Don't save if no active crossword
    
    try {
      const crosswordData: SavedCrossword = {
        id: currentCrosswordId,
        gridRows,
        gridCols,
        grid,
        acrossClues,
        downClues,
        title,
        author,
        lastModified: Date.now(),
      };

      // Update or add to saved crosswords list
      setSavedCrosswords(prev => {
        const updated = prev.filter(c => c.id !== currentCrosswordId);
        updated.push(crosswordData);
        // Sort by last modified (newest first)
        updated.sort((a, b) => b.lastModified - a.lastModified);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Auto-save with debounce (only when in editor view with active crossword)
  useEffect(() => {
    // Don't auto-save while loading or if not in editor view
    if (isLoading || currentView !== 'editor' || !currentCrosswordId) return;
    
    const timeoutId = setTimeout(() => {
      saveToLocalStorage();
    }, 500); // Save after 500ms of inactivity

    return () => clearTimeout(timeoutId);
  }, [grid, acrossClues, downClues, title, author, gridRows, gridCols, isLoading, currentView, currentCrosswordId]);

  const handleNewCrossword = () => {
    const newId = `crossword-${Date.now()}`;
    setIsLoading(true);
    setCurrentCrosswordId(newId);
    setGridRows(DEFAULT_ROWS);
    setGridCols(DEFAULT_COLS);
    const newGrid = createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS);
    setGrid(newGrid);
    setAcrossClues([]);
    setDownClues([]);
    setTitle('My Crossword Puzzle');
    setAuthor('');
    setSelectedCell(null);
    setCurrentView('editor');
    // Mark as loaded after a brief delay to let state settle
    setTimeout(() => {
      setIsLoading(false);
      // Save the new crossword immediately so it appears in the menu
      const crosswordData: SavedCrossword = {
        id: newId,
        gridRows: DEFAULT_ROWS,
        gridCols: DEFAULT_COLS,
        grid: newGrid,
        acrossClues: [],
        downClues: [],
        title: 'My Crossword Puzzle',
        author: '',
        lastModified: Date.now(),
      };
      setSavedCrosswords(prev => {
        const updated = [...prev, crosswordData];
        updated.sort((a, b) => b.lastModified - a.lastModified);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 100);
  };

  const handleLoadCrossword = (crossword: SavedCrossword) => {
    setIsLoading(true);
    setCurrentCrosswordId(crossword.id);
    setGridRows(crossword.gridRows);
    setGridCols(crossword.gridCols);
    setGrid(crossword.grid);
    setAcrossClues(crossword.acrossClues || []);
    setDownClues(crossword.downClues || []);
    setTitle(crossword.title || 'My Crossword Puzzle');
    setAuthor(crossword.author || '');
    setSelectedCell(null);
    setCurrentView('editor');
    // Mark as loaded after a brief delay to let state settle
    setTimeout(() => setIsLoading(false), 100);
  };

  const handleDeleteCrossword = (id: string) => {
    if (confirm('Are you sure you want to delete this crossword? This cannot be undone.')) {
      setSavedCrosswords(prev => {
        const updated = prev.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      
      // If we're viewing the deleted crossword, go back to menu
      if (currentCrosswordId === id) {
        setCurrentView('menu');
        setCurrentCrosswordId(null);
      }
    }
  };

  const handleBackToMenu = () => {
    // Save current crossword before leaving
    if (currentCrosswordId) {
      saveToLocalStorage();
    }
    setCurrentView('menu');
  };

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

  // Show menu or editor based on current view
  if (currentView === 'menu') {
    return (
      <div className="app">
        <Menu
          savedCrosswords={savedCrosswords}
          onNewCrossword={handleNewCrossword}
          onLoadCrossword={handleLoadCrossword}
          onDeleteCrossword={handleDeleteCrossword}
        />
      </div>
    );
  }

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
            <h2>Cell Types</h2>
            <div style={{ fontSize: '0.9em', color: '#666', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Shift + Click:</strong> Toggle black square
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Ctrl + Click:</strong> Toggle circle
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Alt + Click:</strong> Toggle shaded
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', fontSize: '0.85em', color: '#999' }}>
                Circles and shaded squares still contain answers
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h2>Actions</h2>
            <button onClick={handleBackToMenu} className="btn btn-secondary">
              ← Back to Menu
            </button>
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
              acrossClues={acrossClues}
              downClues={downClues}
            />
          </div>

          <div className="clues-section">
            <div className="clues-container">
              <ClueEditor
                title="Across"
                clues={acrossClues}
                onCluesChange={setAcrossClues}
                computedAnswers={computedAnswers}
              />
              <ClueEditor
                title="Down"
                clues={downClues}
                onCluesChange={setDownClues}
                computedAnswers={computedAnswers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
