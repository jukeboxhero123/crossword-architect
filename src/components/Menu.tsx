import type { SavedCrossword } from '../App';

interface MenuProps {
  savedCrosswords: SavedCrossword[];
  onNewCrossword: () => void;
  onLoadCrossword: (crossword: SavedCrossword) => void;
  onDeleteCrossword: (id: string) => void;
}

export function Menu({ savedCrosswords, onNewCrossword, onLoadCrossword, onDeleteCrossword }: MenuProps) {
  return (
    <div className="menu-container">
      <div className="menu-content">
        <header className="menu-header">
          <h1>🧩 Crossword Architect</h1>
          <p className="subtitle">Build beautiful crossword puzzles for your friends</p>
        </header>

        <div className="menu-actions">
          <button onClick={onNewCrossword} className="btn btn-primary btn-large">
            ➕ Create New Crossword
          </button>
        </div>

        {savedCrosswords.length > 0 && (
          <div className="saved-crosswords">
            <h2>Your Crosswords</h2>
            <div className="crossword-list">
              {savedCrosswords.map((crossword) => (
                <div key={crossword.id} className="crossword-item">
                  <div className="crossword-info">
                    <h3>{crossword.title || 'Untitled Crossword'}</h3>
                    {crossword.author && <p className="author">By {crossword.author}</p>}
                    <p className="meta">
                      {crossword.gridRows}×{crossword.gridCols} • {new Date(crossword.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="crossword-actions">
                    <button
                      onClick={() => onLoadCrossword(crossword)}
                      className="btn btn-secondary"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => onDeleteCrossword(crossword.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {savedCrosswords.length === 0 && (
          <div className="empty-state">
            <p>No saved crosswords yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

