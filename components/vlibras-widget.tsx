'use client';

import { useEffect, useRef } from 'react';

const VLIBRAS_SCRIPT_SRC = 'https://vlibras.gov.br/app/vlibras-plugin.js';
const VLIBRAS_APP_BASE = 'https://vlibras.gov.br/app';

export function VlibrasWidget() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (document.querySelector('script[data-vlibras-plugin]')) {
      initializedRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = VLIBRAS_SCRIPT_SRC;
    script.async = true;
    script.dataset.vlibrasPlugin = 'true';
    script.onload = () => {
      if (window.VLibras?.Widget) {
        try {
          new window.VLibras.Widget(VLIBRAS_APP_BASE);
        } catch {
          void 0;
        }
      }
    };
    document.body.appendChild(script);
    initializedRef.current = true;
  }, []);

  return (
    <div vw="" className="enabled">
      <div vw-access-button="" className="active" />
      <div vw-plugin-wrapper="">
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  );
}
