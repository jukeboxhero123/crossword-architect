import type { Crossword } from '../types';
import { getClueAnswer } from './crossword';

export function exportToHTML(crossword: Crossword): string {
  const { grid, acrossClues, downClues, title, author } = crossword;
  
  // Compute answers from grid for all clues
  const cluesWithAnswers = {
    across: acrossClues.map(clue => ({
      ...clue,
      answer: getClueAnswer(grid, clue.number, 'across')
    })),
    down: downClues.map(clue => ({
      ...clue,
      answer: getClueAnswer(grid, clue.number, 'down')
    }))
  };
  const numRows = grid.length;
  const numCols = grid[0]?.length || numRows;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Crossword Puzzle'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      padding: 30px;
      max-width: 1200px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    
    .author {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-style: italic;
    }
    
    .content {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .grid-container {
      flex: 0 0 auto;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(${numCols}, 1fr);
      gap: 2px;
      background: #333;
      border: 3px solid #333;
      width: min(600px, 90vw);
      aspect-ratio: 1;
    }
    
    .cell {
      background: white;
      border: none;
      position: relative;
      font-size: clamp(12px, 2vw, 20px);
      font-weight: bold;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .cell:focus {
      outline: 3px solid #667eea;
      outline-offset: -3px;
      z-index: 10;
    }
    
    .cell.black {
      background: #333;
      cursor: default;
    }
    
    .cell.shaded {
      background: #b0b0b0;
    }
    
    .cell.current-word::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(100, 181, 246, 0.4);
      pointer-events: none;
      z-index: 2;
    }
    
    .cell.highlighted::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(66, 165, 245, 0.5);
      pointer-events: none;
      z-index: 2;
    }
    
    .cell.highlighted.current-word::before {
      background: rgba(66, 165, 245, 0.5);
    }
    
    .cell-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70%;
      height: 70%;
      border-radius: 50%;
      border: 2px solid #333;
      pointer-events: none;
      z-index: 1;
    }
    
    .cell-number {
      position: absolute;
      top: 2px;
      left: 3px;
      font-size: 0.6em;
      color: #333;
      font-weight: bold;
    }
    
    .cell input {
      width: 100%;
      height: 100%;
      border: none;
      text-align: center;
      font-size: inherit;
      font-weight: bold;
      text-transform: uppercase;
      background: transparent;
      color: #333;
    }
    
    .cell input:focus {
      outline: none;
    }
    
    .clues {
      flex: 1;
      min-width: 300px;
      display: flex;
      gap: 20px;
      align-items: stretch;
    }
    
    .clues-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-bottom: 0;
      max-height: 70vh;
      padding-right: 8px;
    }
    
    .clues-section h2 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 1.5em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 5px;
    }
    
    #across-clues,
    #down-clues {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px;
    }
    
    .clue-item {
      margin-bottom: 12px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      transition: background 0.2s;
    }
    
    .clue-item.highlighted {
      background: #e3e7ff;
      border-left-color: #667eea;
    }
    
    .clue-number {
      font-weight: bold;
      color: #667eea;
      margin-right: 8px;
    }
    
    .clue-text {
      color: #333;
    }
    
    .controls {
      margin-top: 20px;
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #eee;
    }
    
    .victory-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .victory-overlay.show,
    .modal-overlay.show {
      display: flex;
    }
    
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .modal-content {
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: victoryPop 0.5s ease-out;
    }
    
    .modal-content h2 {
      font-size: 2em;
      color: #667eea;
      margin-bottom: 20px;
    }
    
    .modal-content p {
      font-size: 1.1em;
      color: #666;
      margin-bottom: 30px;
    }
    
    .victory-content {
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: victoryPop 0.5s ease-out;
    }
    
    @keyframes victoryPop {
      0% {
        transform: scale(0.5);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    .victory-content h2 {
      font-size: 3em;
      color: #667eea;
      margin-bottom: 20px;
    }
    
    .victory-content p {
      font-size: 1.2em;
      color: #666;
      margin-bottom: 30px;
    }
    
    .victory-emoji {
      font-size: 5em;
      margin-bottom: 20px;
    }
    
    .error-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .error-overlay.show {
      display: flex;
    }
    
    .error-content {
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: errorShake 0.5s ease-out;
    }
    
    @keyframes errorShake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
      20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
    
    .error-content h2 {
      font-size: 2.5em;
      color: #ef4444;
      margin-bottom: 20px;
    }
    
    .error-content p {
      font-size: 1.2em;
      color: #666;
      margin-bottom: 30px;
    }
    
    .error-emoji {
      font-size: 4em;
      margin-bottom: 20px;
    }
    
    .btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      margin: 0 10px;
      transition: background 0.2s;
    }
    
    .btn:hover {
      background: #5568d3;
    }
    
    .btn:active {
      transform: scale(0.98);
    }
    
    @media (max-width: 768px) {
      .content {
        flex-direction: column;
      }
      
      .clues {
        flex-direction: column;
      }
      
      .grid {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h1 style="margin: 0;">${title || 'Crossword Puzzle'}</h1>
      <div id="timer-display" style="font-size: 1.5em; font-weight: bold; color: #667eea; font-family: monospace;">
        00:00
      </div>
    </div>
    ${author ? `<div class="author">By ${author}</div>` : ''}
    
    <div class="content">
      <div class="grid-container">
        <div class="grid" id="grid"></div>
      </div>
      
      <div class="clues">
        <div class="clues-section">
          <h2>Across</h2>
          <div id="across-clues"></div>
        </div>
        
        <div class="clues-section">
          <h2>Down</h2>
          <div id="down-clues"></div>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <button class="btn" onclick="checkAnswers()">Check Answers</button>
      <button class="btn" onclick="clearGrid()">Clear Grid</button>
      <button class="btn" onclick="revealAnswers()">Reveal Answers</button>
    </div>
  </div>
  
  <div class="victory-overlay" id="victory-overlay">
    <div class="victory-content">
      <div class="victory-emoji">🎉</div>
      <h2>Congratulations!</h2>
      <p>You've completed the crossword puzzle!</p>
      <p id="victory-time" style="font-size: 1.2em; font-weight: bold; color: #667eea; margin: 15px 0;"></p>
      <button class="btn btn-primary" onclick="document.getElementById('victory-overlay').classList.remove('show')">Close</button>
    </div>
  </div>
  
  <div class="error-overlay" id="error-overlay">
    <div class="error-content">
      <div class="error-emoji">❌</div>
      <h2>Not Quite Right</h2>
      <p>You've filled in all the squares, but some answers are incorrect. Keep trying!</p>
      <button class="btn btn-primary" onclick="document.getElementById('error-overlay').classList.remove('show')">Close</button>
    </div>
  </div>
  
  <div class="modal-overlay" id="pause-overlay">
    <div class="modal-content">
      <div style="font-size: 3em; margin-bottom: 20px;">⏸️</div>
      <h2>Puzzle Paused</h2>
      <p>The timer has been paused. Click continue to resume solving.</p>
      <button class="btn btn-primary" onclick="resumeTimer()">Continue</button>
    </div>
  </div>
  
  <script>
    const grid = ${JSON.stringify(grid)};
            const acrossClues = ${JSON.stringify(cluesWithAnswers.across)};
            const downClues = ${JSON.stringify(cluesWithAnswers.down)};
    const numRows = ${numRows};
    const numCols = ${numCols};
    
    let currentCell = null;
    let currentDirection = 'across';
    let userAnswers = {};
    let isPuzzleComplete = false;
    
    // Timer state
    let timerStartTime = null;
    let timerPausedTime = 0;
    let timerInterval = null;
    let isTimerPaused = false;
    let totalPausedTime = 0;
    let pauseStartTime = null;
    
    // Format time as MM:SS or HH:MM:SS
    function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return \`\${String(hours).padStart(2, '0')}:\${String(minutes).padStart(2, '0')}:\${String(secs).padStart(2, '0')}\`;
      }
      return \`\${String(minutes).padStart(2, '0')}:\${String(secs).padStart(2, '0')}\`;
    }
    
    // Update timer display
    function updateTimerDisplay() {
      if (!timerStartTime) return;
      
      const now = Date.now();
      const elapsed = Math.floor((now - timerStartTime - totalPausedTime) / 1000);
      const timerEl = document.getElementById('timer-display');
      if (timerEl) {
        timerEl.textContent = formatTime(elapsed);
      }
    }
    
    // Start the timer
    function startTimer() {
      if (timerStartTime) return; // Already started
      
      timerStartTime = Date.now();
      totalPausedTime = 0;
      timerInterval = setInterval(updateTimerDisplay, 100);
      updateTimerDisplay();
    }
    
    // Pause the timer
    function pauseTimer() {
      if (!timerStartTime || isTimerPaused || isPuzzleComplete) return;
      
      isTimerPaused = true;
      pauseStartTime = Date.now();
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      document.getElementById('pause-overlay').classList.add('show');
    }
    
    // Resume the timer
    function resumeTimer() {
      if (!isTimerPaused || isPuzzleComplete) return;
      
      if (pauseStartTime) {
        const pauseDuration = Date.now() - pauseStartTime;
        totalPausedTime += pauseDuration;
        pauseStartTime = null;
      }
      
      isTimerPaused = false;
      document.getElementById('pause-overlay').classList.remove('show');
      timerInterval = setInterval(updateTimerDisplay, 100);
      updateTimerDisplay();
    }
    
    // Get elapsed time in seconds
    function getElapsedTime() {
      if (!timerStartTime) return 0;
      const now = Date.now();
      return Math.floor((now - timerStartTime - totalPausedTime) / 1000);
    }
    
    // Handle visibility change (tab switch, window minimize, etc.)
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && !isPuzzleComplete) {
        if (timerStartTime && !isTimerPaused) {
          pauseTimer();
        }
      }
    });
    
    // Handle window blur/focus
    window.addEventListener('blur', function() {
      if (timerStartTime && !isTimerPaused && !isPuzzleComplete) {
        pauseTimer();
      }
    });
    
    // Start timer when page loads
    startTimer();
    
    function renderGrid() {
      const gridEl = document.getElementById('grid');
      gridEl.innerHTML = '';
      
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          const cell = grid[row][col];
          const cellEl = document.createElement('div');
          let cellClass = 'cell';
          if (cell.isBlack) {
            cellClass += ' black';
          } else if (cell.isShaded) {
            cellClass += ' shaded';
          }
          cellEl.className = cellClass;
          cellEl.dataset.row = row;
          cellEl.dataset.col = col;
          
          if (!cell.isBlack) {
            if (cell.number) {
              const numberEl = document.createElement('span');
              numberEl.className = 'cell-number';
              numberEl.textContent = cell.number;
              cellEl.appendChild(numberEl);
            }
            
            // Add circle if needed
            if (cell.isCircle) {
              const circleEl = document.createElement('div');
              circleEl.className = 'cell-circle';
              cellEl.appendChild(circleEl);
            }
            
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.dataset.row = row;
            input.dataset.col = col;
            input.value = userAnswers[\`\${row}-\${col}\`] || '';
            input.addEventListener('input', handleInput);
            input.addEventListener('focus', () => selectCell(row, col));
            input.addEventListener('keydown', handleKeyDown);
            input.addEventListener('click', (e) => {
              e.stopPropagation();
              // Check if this is the currently selected cell
              const isCurrentCell = currentCell && currentCell.row === row && currentCell.col === col;
              
              if (isCurrentCell) {
                // Toggle direction when clicking on current cell's input
                toggleDirection(row, col);
              } else {
                // Select this cell
                selectCell(row, col);
              }
            });
            cellEl.addEventListener('click', (e) => {
              // Only handle clicks on the cell itself, not the input
              if (e.target === cellEl || e.target === cellEl.querySelector('.cell-number')) {
                const isCurrentCell = currentCell && currentCell.row === row && currentCell.col === col;
                
                if (isCurrentCell) {
                  // Toggle direction when clicking on current cell
                  toggleDirection(row, col);
                } else {
                  // Focus the input to select the cell
                  const input = cellEl.querySelector('input');
                  if (input) {
                    input.focus();
                    selectCell(row, col);
                  }
                }
              }
            });
            cellEl.appendChild(input);
          }
          
          gridEl.appendChild(cellEl);
        }
      }
    }
    
    function isWordComplete(row, col, direction) {
      const wordCells = getWordCells(row, col, direction);
      return wordCells.every(({row: r, col: c}) => {
        const answer = userAnswers[\`\${r}-\${c}\`];
        return answer && answer.length === 1;
      });
    }
    
    function findClueStartPosition(clueNumber) {
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          if (grid[row][col].number === clueNumber) {
            return { row, col };
          }
        }
      }
      return null;
    }
    
    function isClueComplete(clueNumber, direction) {
      const cells = getClueCells(clueNumber, direction);
      // Check if all cells in the clue are filled
      return cells.every(({row, col}) => {
        const answer = userAnswers[\`\${row}-\${col}\`];
        return answer && answer.length === 1;
      });
    }
    
    function findNextClue(row, col, direction) {
      // For across: find next clue in a different row
      // For down: find next clue in a different column
      const targetCoord = direction === 'across' ? row : col;
      const clues = direction === 'across' ? acrossClues : downClues;
      
      // First, try to find the first clue in the next row/column
      let bestClue = null;
      let bestCoord = Infinity;
      
      clues.forEach(clue => {
        const pos = findClueStartPosition(clue.number);
        if (!pos) return;
        
        const coord = direction === 'across' ? pos.row : pos.col;
        const cells = getClueCells(clue.number, direction);
        
        if (cells.length === 0) return;
        
        // Find the next row/column with a clue (must be strictly greater)
        if (coord > targetCoord && coord < bestCoord) {
          // Find first empty or partially filled cell in this clue
          const firstFillable = cells.find(c => !userAnswers[\`\${c.row}-\${c.col}\`]) || cells[0];
          bestClue = firstFillable;
          bestCoord = coord;
        }
      });
      
      if (bestClue) return bestClue;
      
      // If no next row/col found, wrap around to first incomplete clue
      let firstIncomplete = null;
      let firstAny = null;
      let minCoord = Infinity;
      
      clues.forEach(clue => {
        const pos = findClueStartPosition(clue.number);
        if (!pos) return;
        
        const coord = direction === 'across' ? pos.row : pos.col;
        const cells = getClueCells(clue.number, direction);
        
        if (cells.length === 0) return;
        
        if (coord < minCoord) {
          minCoord = coord;
          firstIncomplete = null;
          firstAny = null;
        }
        
        if (coord === minCoord) {
          if (!isClueComplete(clue.number, direction)) {
            if (!firstIncomplete) {
              // Find first empty or partially filled cell in this clue
              const firstFillable = cells.find(c => !userAnswers[\`\${c.row}-\${c.col}\`]) || cells[0];
              firstIncomplete = firstFillable;
            }
          }
          if (!firstAny) {
            firstAny = cells[0];
          }
        }
      });
      
      return firstIncomplete || firstAny;
    }
    
    function findPreviousClue(row, col, direction) {
      // For across: find previous clue in a different row
      // For down: find previous clue in a different column
      const targetCoord = direction === 'across' ? row : col;
      const clues = direction === 'across' ? acrossClues : downClues;
      
      // First, try to find the last clue in the previous row/column
      let bestClue = null;
      let bestCoord = -1;
      
      clues.forEach(clue => {
        const pos = findClueStartPosition(clue.number);
        if (!pos) return;
        
        const coord = direction === 'across' ? pos.row : pos.col;
        const cells = getClueCells(clue.number, direction);
        
        if (cells.length === 0) return;
        
        // Find the previous row/column with a clue (must be strictly less)
        if (coord < targetCoord && coord > bestCoord) {
          // Get the last cell of this clue (or last empty cell if available)
          const lastEmpty = cells.slice().reverse().find(c => !userAnswers[\`\${c.row}-\${c.col}\`]);
          bestClue = lastEmpty || cells[cells.length - 1];
          bestCoord = coord;
        }
      });
      
      if (bestClue) return bestClue;
      
      // If no previous row/col found, wrap around to last incomplete clue
      let lastIncomplete = null;
      let lastAny = null;
      let maxCoord = -1;
      
      clues.forEach(clue => {
        const pos = findClueStartPosition(clue.number);
        if (!pos) return;
        
        const coord = direction === 'across' ? pos.row : pos.col;
        const cells = getClueCells(clue.number, direction);
        
        if (cells.length === 0) return;
        
        if (coord > maxCoord) {
          maxCoord = coord;
          lastIncomplete = null;
          lastAny = null;
        }
        
        if (coord === maxCoord) {
          if (!isClueComplete(clue.number, direction)) {
            if (!lastIncomplete) {
              // Get the last cell of this clue (or last empty cell if available)
              const lastEmpty = cells.slice().reverse().find(c => !userAnswers[\`\${c.row}-\${c.col}\`]);
              lastIncomplete = lastEmpty || cells[cells.length - 1];
            }
          }
          if (!lastAny) {
            // Get the last cell of this clue
            lastAny = cells[cells.length - 1];
          }
        }
      });
      
      return lastIncomplete || lastAny;
    }
    
    function moveToPreviousClue(row, col, direction) {
      const prevCell = findPreviousClue(row, col, direction);
      if (prevCell) {
        const input = document.querySelector(\`input[data-row="\${prevCell.row}"][data-col="\${prevCell.col}"]\`);
        if (input) {
          // Set direction before selecting
          currentDirection = direction;
          input.focus();
          input.select();
          selectCell(prevCell.row, prevCell.col, true);
        }
      }
    }
    
    function moveToNextClue(row, col, direction) {
      const nextCell = findNextClue(row, col, direction);
      if (nextCell) {
        const input = document.querySelector(\`input[data-row="\${nextCell.row}"][data-col="\${nextCell.col}"]\`);
        if (input) {
          // Set direction before selecting
          currentDirection = direction;
          input.focus();
          input.select();
          selectCell(nextCell.row, nextCell.col, true);
        }
      }
    }
    
    function isPuzzleFilled() {
      // Check if all cells that should have letters are filled
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          if (!grid[row][col].isBlack) {
            const answer = userAnswers[\`\${row}-\${col}\`];
            if (!answer || answer.length === 0) {
              return false;
            }
          }
        }
      }
      return true;
    }
    
    function checkVictory() {
      let allCorrect = true;
      let hasAnswers = false;
      
      acrossClues.forEach(clue => {
        if (!clue.answer) return;
        hasAnswers = true;
        const answer = clue.answer.toUpperCase();
        const cells = getClueCells(clue.number, 'across');
        
        cells.forEach(({row, col}, idx) => {
          const userLetter = userAnswers[\`\${row}-\${col}\`] || '';
          const correctLetter = answer[idx] || '';
          if (userLetter !== correctLetter) {
            allCorrect = false;
          }
        });
      });
      
      downClues.forEach(clue => {
        if (!clue.answer) return;
        hasAnswers = true;
        const answer = clue.answer.toUpperCase();
        const cells = getClueCells(clue.number, 'down');
        
        cells.forEach(({row, col}, idx) => {
          const userLetter = userAnswers[\`\${row}-\${col}\`] || '';
          const correctLetter = answer[idx] || '';
          if (userLetter !== correctLetter) {
            allCorrect = false;
          }
        });
      });
      
      // Only check if puzzle has answers
      if (!hasAnswers) return;
      
      // Check if puzzle is completely filled
      const isFilled = isPuzzleFilled();
      
      if (isFilled && allCorrect) {
        // Mark puzzle as complete
        isPuzzleComplete = true;
        
        // Stop the timer
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        
        // Disable all inputs (make read-only but still allow clicking for selection)
        document.querySelectorAll('.cell input').forEach(input => {
          input.readOnly = true;
          input.style.cursor = 'pointer';
          input.style.opacity = '1';
        });
        
        // Add paint color overlays to cells
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            const cell = grid[row][col];
            if (!cell.isBlack && cell.paintColor) {
              const cellEl = document.querySelector(\`.cell[data-row="\${row}"][data-col="\${col}"]\`);
              if (cellEl) {
                const paintOverlay = document.createElement('div');
                paintOverlay.style.position = 'absolute';
                paintOverlay.style.top = '0';
                paintOverlay.style.left = '0';
                paintOverlay.style.right = '0';
                paintOverlay.style.bottom = '0';
                paintOverlay.style.backgroundColor = cell.paintColor;
                paintOverlay.style.opacity = '0.5';
                paintOverlay.style.pointerEvents = 'none';
                paintOverlay.style.zIndex = '1';
                cellEl.appendChild(paintOverlay);
              }
            }
          }
        }
        
        // Display time in victory modal
        const elapsedTime = getElapsedTime();
        const timeEl = document.getElementById('victory-time');
        if (timeEl) {
          timeEl.textContent = \`Time: \${formatTime(elapsedTime)}\`;
        }
        
        document.getElementById('victory-overlay').classList.add('show');
      } else if (isFilled && !allCorrect) {
        // Puzzle is filled but has errors
        document.getElementById('error-overlay').classList.add('show');
      }
    }
    
    function handleInput(e) {
      // Don't allow input if puzzle is complete
      if (isPuzzleComplete) {
        e.preventDefault();
        return;
      }
      
      const input = e.target;
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      const value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
      input.value = value;
      
      userAnswers[\`\${row}-\${col}\`] = value;
      
      // Check for victory after each input
      checkVictory();
      
      if (!value) return;
      
      // Check if word is complete after this input
      if (isWordComplete(row, col, currentDirection)) {
        // Move to next clue in same direction
        setTimeout(() => {
          moveToNextClue(row, col, currentDirection);
        }, 150);
      } else if (currentDirection === 'across') {
        moveToNextCell(row, col, 0, 1);
      } else if (currentDirection === 'down') {
        moveToNextCell(row, col, 1, 0);
      }
    }
    
    function handleKeyDown(e) {
      // Don't allow keyboard input if puzzle is complete
      if (isPuzzleComplete) {
        e.preventDefault();
        return;
      }
      
      const input = e.target;
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      
      if (e.key === 'Backspace') {
        const currentValue = input.value;
        const wordCells = getWordCells(row, col, currentDirection);
        const currentIndex = wordCells.findIndex(c => c.row === row && c.col === col);
        
        // If cell has a value, clear it and move to previous
        if (currentValue && currentValue.length > 0) {
          input.value = '';
          userAnswers[\`\${row}-\${col}\`] = '';
          e.preventDefault();
          
          // Move to previous cell
          if (currentIndex > 0) {
            const prevCell = wordCells[currentIndex - 1];
            const prevInput = document.querySelector(\`input[data-row="\${prevCell.row}"][data-col="\${prevCell.col}"]\`);
            if (prevInput) {
              prevInput.focus();
              prevInput.select();
              selectCell(prevCell.row, prevCell.col, true);
            }
          } else {
            // At start of word, move to previous clue in previous row/column
            moveToPreviousClue(row, col, currentDirection);
          }
        } else {
          // Cell is empty, just move to previous
          e.preventDefault();
          if (currentIndex > 0) {
            const prevCell = wordCells[currentIndex - 1];
            const prevInput = document.querySelector(\`input[data-row="\${prevCell.row}"][data-col="\${prevCell.col}"]\`);
            if (prevInput) {
              prevInput.focus();
              prevInput.select();
              selectCell(prevCell.row, prevCell.col, true);
            }
          } else {
            // At start of word, move to previous clue in previous row/column
            moveToPreviousClue(row, col, currentDirection);
          }
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        currentDirection = 'across';
        moveToNextCell(row, col, 0, 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        currentDirection = 'across';
        moveToNextCell(row, col, 0, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentDirection = 'down';
        moveToNextCell(row, col, 1, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentDirection = 'down';
        moveToNextCell(row, col, -1, 0);
      }
    }
    
    function getWordCells(row, col, direction) {
      const cells = [];
      const rowDelta = direction === 'down' ? 1 : 0;
      const colDelta = direction === 'across' ? 1 : 0;
      
      // Find start of word
      let startRow = row;
      let startCol = col;
      while (startRow >= 0 && startCol >= 0 && 
             !grid[startRow][startCol].isBlack) {
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
    }
    
    function highlightWord(row, col, direction) {
      // Remove all highlights
      document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('current-word', 'highlighted');
      });
      
      const wordCells = getWordCells(row, col, direction);
      wordCells.forEach(({ row: r, col: c }) => {
        const cellEl = document.querySelector(\`[data-row="\${r}"][data-col="\${c}"]\`);
        if (cellEl) {
          cellEl.classList.add('current-word');
          if (r === row && c === col) {
            cellEl.classList.add('highlighted');
          }
        }
      });
    }
    
    function toggleDirection(row, col) {
      const hasRight = col < numCols - 1 && !grid[row][col + 1].isBlack;
      const hasLeft = col > 0 && !grid[row][col - 1].isBlack;
      const hasDown = row < numRows - 1 && !grid[row + 1][col].isBlack;
      const hasUp = row > 0 && !grid[row - 1][col].isBlack;
      
      const isPartOfHorizontal = hasRight || hasLeft;
      const isPartOfVertical = hasDown || hasUp;
      
      // Only toggle if both directions are available
      if (isPartOfHorizontal && isPartOfVertical) {
        if (currentDirection === 'across') {
          currentDirection = 'down';
        } else {
          currentDirection = 'across';
        }
      } else if (isPartOfHorizontal && currentDirection === 'down') {
        // If only horizontal available but we're in down mode, switch to across
        currentDirection = 'across';
      } else if (isPartOfVertical && currentDirection === 'across') {
        // If only vertical available but we're in across mode, switch to down
        currentDirection = 'down';
      }
      
      highlightWord(row, col, currentDirection);
      highlightClue(row, col, currentDirection);
    }
    
    function selectCell(row, col, preserveDirection = false) {
      currentCell = { row, col };
      const cell = grid[row][col];
      if (!cell || cell.isBlack) return;
      
      if (!preserveDirection) {
        // Check if current direction is available at this cell
        const hasRight = col < numCols - 1 && !grid[row][col + 1].isBlack;
        const hasLeft = col > 0 && !grid[row][col - 1].isBlack;
        const hasDown = row < numRows - 1 && !grid[row + 1][col].isBlack;
        const hasUp = row > 0 && !grid[row - 1][col].isBlack;
        
        const isPartOfHorizontal = hasRight || hasLeft;
        const isPartOfVertical = hasDown || hasUp;
        
        // Only change direction if current direction is NOT available at this cell
        if (currentDirection === 'across') {
          // Currently typing horizontal - only switch if horizontal is not available
          if (!isPartOfHorizontal && isPartOfVertical) {
            currentDirection = 'down';
          }
          // Otherwise, keep 'across' direction
        } else if (currentDirection === 'down') {
          // Currently typing vertical - only switch if vertical is not available
          if (!isPartOfVertical && isPartOfHorizontal) {
            currentDirection = 'across';
          }
          // Otherwise, keep 'down' direction
        } else {
          // No current direction set - determine based on what's available
          if (isPartOfHorizontal && isPartOfVertical) {
            // Both available - default to across
            currentDirection = 'across';
          } else if (isPartOfHorizontal) {
            currentDirection = 'across';
          } else if (isPartOfVertical) {
            currentDirection = 'down';
          }
        }
      }
      
      highlightWord(row, col, currentDirection);
      highlightClue(row, col, currentDirection);
    }
    
    function moveToNextCell(row, col, rowDelta, colDelta) {
      let newRow = row + rowDelta;
      let newCol = col + colDelta;
      
      while (newRow >= 0 && newRow < numRows && newCol >= 0 && newCol < numCols) {
        if (!grid[newRow][newCol].isBlack) {
          const input = document.querySelector(\`input[data-row="\${newRow}"][data-col="\${newCol}"]\`);
          if (input) {
            input.focus();
            input.select();
            // Preserve direction when moving within a word
            selectCell(newRow, newCol, true);
          }
          return;
        }
        newRow += rowDelta;
        newCol += colDelta;
      }
      
      // If we've reached the end of the word, check if it's complete and move to next clue
      if (isWordComplete(row, col, currentDirection)) {
        setTimeout(() => {
          moveToNextClue(row, col, currentDirection);
        }, 100);
      }
    }
    
    function highlightClue(row, col, direction) {
      // Find the start of the current word to get the clue number
      const wordCells = getWordCells(row, col, direction);
      if (wordCells.length === 0) return;
      
      // Get the first cell of the word (where the clue number is)
      const startCell = wordCells[0];
      const cell = grid[startCell.row][startCell.col];
      if (!cell || !cell.number) return;
      
      // Remove previous highlights
      document.querySelectorAll('.clue-item').forEach(item => {
        item.classList.remove('highlighted');
      });
      
      const clueNumber = cell.number;
      const selector = \`.clue-item[data-direction="\${direction}"][data-number="\${clueNumber}"]\`;
      const clueItem = document.querySelector(selector);
      if (clueItem) {
        clueItem.classList.add('highlighted');
        // Keep the active clue visible in its scrollable panel
        clueItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    
    function renderClues() {
      const acrossEl = document.getElementById('across-clues');
      const downEl = document.getElementById('down-clues');
      
      acrossEl.innerHTML = acrossClues.map(clue => 
        \`<div class="clue-item" data-direction="across" data-number="\${clue.number}">
          <span class="clue-number">\${clue.number}.</span>
          <span class="clue-text">\${clue.text || '(No clue)'}</span>
        </div>\`
      ).join('');
      
      downEl.innerHTML = downClues.map(clue => 
        \`<div class="clue-item" data-direction="down" data-number="\${clue.number}">
          <span class="clue-number">\${clue.number}.</span>
          <span class="clue-text">\${clue.text || '(No clue)'}</span>
        </div>\`
      ).join('');
    }
    
    function checkAnswers() {
      let correct = 0;
      let total = 0;
      
      acrossClues.forEach(clue => {
        const answer = clue.answer.toUpperCase();
        const cells = getClueCells(clue.number, 'across');
        let isCorrect = true;
        
        cells.forEach(({row, col}, idx) => {
          const userLetter = userAnswers[\`\${row}-\${col}\`] || '';
          const correctLetter = answer[idx] || '';
          const input = document.querySelector(\`input[data-row="\${row}"][data-col="\${col}"]\`);
          
          if (userLetter && correctLetter) {
            total++;
            if (userLetter === correctLetter) {
              correct++;
              if (input) input.style.color = '#22c55e';
            } else {
              isCorrect = false;
              if (input) input.style.color = '#ef4444';
            }
          }
        });
      });
      
      downClues.forEach(clue => {
        const answer = clue.answer.toUpperCase();
        const cells = getClueCells(clue.number, 'down');
        
        cells.forEach(({row, col}, idx) => {
          const userLetter = userAnswers[\`\${row}-\${col}\`] || '';
          const correctLetter = answer[idx] || '';
          const input = document.querySelector(\`input[data-row="\${row}"][data-col="\${col}"]\`);
          
          if (userLetter && correctLetter) {
            total++;
            if (userLetter === correctLetter) {
              correct++;
              if (input) input.style.color = '#22c55e';
            } else {
              if (input) input.style.color = '#ef4444';
            }
          }
        });
      });
      
      alert(\`You got \${correct} out of \${total} letters correct!\`);
    }
    
    function clearGrid() {
      if (confirm('Clear all your answers?')) {
        userAnswers = {};
        document.querySelectorAll('input').forEach(input => {
          input.value = '';
          input.style.color = '#333';
        });
      }
    }
    
    function revealAnswers() {
      if (confirm('Reveal all answers? This will show the solution.')) {
        acrossClues.forEach(clue => {
          const answer = clue.answer.toUpperCase();
          const cells = getClueCells(clue.number, 'across');
          cells.forEach(({row, col}, idx) => {
            const input = document.querySelector(\`input[data-row="\${row}"][data-col="\${col}"]\`);
            if (input && answer[idx]) {
              input.value = answer[idx];
              input.style.color = '#667eea';
              input.style.fontWeight = 'bold';
              userAnswers[\`\${row}-\${col}\`] = answer[idx];
            }
          });
        });
        
        downClues.forEach(clue => {
          const answer = clue.answer.toUpperCase();
          const cells = getClueCells(clue.number, 'down');
          cells.forEach(({row, col}, idx) => {
            const input = document.querySelector(\`input[data-row="\${row}"][data-col="\${col}"]\`);
            if (input && answer[idx]) {
              input.value = answer[idx];
              input.style.color = '#667eea';
              input.style.fontWeight = 'bold';
              userAnswers[\`\${row}-\${col}\`] = answer[idx];
            }
          });
        });
      }
    }
    
    function getClueCells(clueNumber, direction) {
      const cells = [];
      let startRow = -1, startCol = -1;
      
      // Find start cell
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          if (grid[row][col].number === clueNumber) {
            startRow = row;
            startCol = col;
            break;
          }
        }
        if (startRow !== -1) break;
      }
      
      if (startRow === -1) return cells;
      
      const rowDelta = direction === 'down' ? 1 : 0;
      const colDelta = direction === 'across' ? 1 : 0;
      
      let row = startRow;
      let col = startCol;
      
      while (row >= 0 && row < numRows && col >= 0 && col < numCols && !grid[row][col].isBlack) {
        cells.push({row, col});
        row += rowDelta;
        col += colDelta;
      }
      
      return cells;
    }
    
    renderGrid();
    renderClues();
  </script>
</body>
</html>`;

  return html;
}

