'use client';

import { useAccessibility } from '@/lib/accessibility-context';
import { useId, useState } from 'react';

export function AccessibilityToolbar() {
  const { increaseFont, decreaseFont, toggleHighContrast, highContrast } = useAccessibility();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="a11y-toolbar">
      <button
        type="button"
        className="a11y-toolbar__fab"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Abrir opções de acessibilidade"
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fas fa-universal-access" aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Ferramentas de acessibilidade"
          className="a11y-toolbar__panel"
        >
          <button type="button" className="a11y-toolbar__action" onClick={increaseFont}>
            <i className="fas fa-plus" aria-hidden /> Aumentar fonte
          </button>
          <button type="button" className="a11y-toolbar__action" onClick={decreaseFont}>
            <i className="fas fa-minus" aria-hidden /> Diminuir fonte
          </button>
          <button
            type="button"
            className="a11y-toolbar__action"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
          >
            <i className="fas fa-adjust" aria-hidden /> Alto contraste
            {highContrast ? ' (ativo)' : ''}
          </button>
        </div>
      ) : null}
    </div>
  );
}
