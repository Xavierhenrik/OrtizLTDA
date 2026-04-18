'use client';

import { useLayoutEffect, useRef } from 'react';

export function useRestoreFocusWhenClosed(open: boolean) {
  const previousRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (open) {
      previousRef.current = document.activeElement as HTMLElement | null;
      return;
    }
    const prev = previousRef.current;
    previousRef.current = null;
    if (prev && document.body.contains(prev) && typeof prev.focus === 'function') {
      prev.focus();
    }
  }, [open]);
}
