'use client';

import {
  computeProjetosModalInfoAlign,
  logProjetosModalInfoAlign,
  type ProjetosModalInfoAlignMode,
} from '@/lib/projetos-modal-info-align';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useProjetosModalInfoAlign(open: boolean, contentKey: string) {
  const columnRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [alignMode, setAlignMode] = useState<ProjetosModalInfoAlignMode>('center');

  const measure = useCallback(() => {
    const column = columnRef.current;
    const content = contentRef.current;
    if (!column || !content) return;

    const isStacked = window.innerWidth <= 768;
    const input = {
      contentHeight: content.scrollHeight,
      columnHeight: column.clientHeight,
      isStacked,
    };

    const mode = computeProjetosModalInfoAlign(input);
    setAlignMode((prev) => (prev === mode ? prev : mode));
    logProjetosModalInfoAlign(input, mode);
  }, []);

  useEffect(() => {
    if (!open) {
      setAlignMode('center');
      return;
    }

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measure);
    });

    const column = columnRef.current;
    const content = contentRef.current;
    if (!column || !content) {
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(column);
    observer.observe(content);

    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [open, contentKey, measure]);

  return { columnRef, contentRef, alignMode };
}
