# 🧩 Crossword Architect

A beautiful, modern web application for creating crossword puzzles. Build custom crosswords and export them as interactive HTML files that your friends can solve in their browser!

## Features

- **Interactive Grid Editor**: Click cells to select, Shift+Click to toggle black squares
- **Automatic Numbering**: Clue numbers are automatically assigned based on grid layout
- **Clue Management**: Add and edit clues for both Across and Down directions
- **Export to HTML**: Export your finished crossword as a standalone HTML file
- **Interactive Solver**: Exported HTML files include a fully interactive solving interface with:
  - Keyboard navigation (arrow keys to move between cells)
  - Answer checking
  - Reveal answers option
  - Beautiful, responsive design

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

### Build

```bash
npm run build
```

## How to Use

1. **Create Your Grid**: 
   - Adjust the grid size using the slider (5×5 to 25×25)
   - Click cells to select them
   - Shift+Click cells to toggle black squares

2. **Add Letters**:
   - Click on a cell and type a letter to add it to your grid
   - This helps you visualize your crossword as you build it

3. **Edit Clues**:
   - Clues are automatically created when you add black squares
   - Enter clue text and answers in the Across and Down sections
   - Answers should match the letters you've placed in the grid

4. **Customize**:
   - Set a title and author name for your crossword
   - These will appear in the exported HTML file

5. **Export**:
   - Click "Export HTML" to download your crossword as an HTML file
   - Share the file with friends - they can open it in any browser and solve it!

## Tips

- Start by placing black squares to create the structure of your crossword
- Make sure your answers match the letters you've placed in the grid
- The exported HTML file is completely standalone - no server needed!

## Technology Stack

- React 19
- TypeScript
- Vite
- Modern CSS with gradients and animations

Enjoy building crosswords! 🎉
