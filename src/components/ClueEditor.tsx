import type{ Clue } from '../types';

interface ClueEditorProps {
  title: string;
  clues: Clue[];
  onCluesChange: (clues: Clue[]) => void;
  computedAnswers: Map<string, string>; // Map of "direction-number" to computed answer (e.g., "across-1", "down-1")
}

export function ClueEditor({ title, clues, onCluesChange, computedAnswers }: ClueEditorProps) {
  const updateClue = (index: number, field: 'text', value: string) => {
    const newClues = [...clues];
    newClues[index] = { ...newClues[index], [field]: value };
    onCluesChange(newClues);
  };

  return (
    <div className="clue-editor">
      <h3>{title}</h3>
      <div className="clues-list">
        {clues.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>No clues yet. Add some black squares to create clues!</p>
        ) : (
          clues.map((clue, index) => (
            <div key={clue.number} className="clue-item">
              <div className="clue-header">
                <span className="clue-number">{clue.number}.</span>
              </div>
              <div className="clue-inputs">
                <input
                  type="text"
                  placeholder="Clue text..."
                  value={clue.text}
                  onChange={(e) => updateClue(index, 'text', e.target.value)}
                  className="clue-text-input"
                />
                <input
                  type="text"
                  placeholder="Answer..."
                  value={computedAnswers.get(`${title.toLowerCase()}-${clue.number}`) || ''}
                  readOnly
                  disabled
                  className="clue-answer-input"
                  style={{
                    opacity: 0.7,
                    cursor: 'not-allowed',
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

