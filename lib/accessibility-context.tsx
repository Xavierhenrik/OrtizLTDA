'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_FONT = 'ortiz-a11y-font-step';
const STORAGE_CONTRAST = 'ortiz-a11y-high-contrast';

const FONT_STEP_MIN = -2;
const FONT_STEP_MAX = 4;
const FONT_STEP_DELTA = 0.0625;

export type AccessibilityContextValue = {
  fontStep: number;
  highContrast: boolean;
  increaseFont: () => void;
  decreaseFont: () => void;
  toggleHighContrast: () => void;
  reset: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function stepToScale(step: number): number {
  return 1 + step * FONT_STEP_DELTA;
}

function applyToDocument(fontStep: number, highContrast: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--a11y-font-scale', String(stepToScale(fontStep)));
  root.classList.toggle('high-contrast', highContrast);
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontStep, setFontStep] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const rawStep = localStorage.getItem(STORAGE_FONT);
      const rawContrast = localStorage.getItem(STORAGE_CONTRAST);
      if (rawStep !== null) {
        const n = Number.parseInt(rawStep, 10);
        if (!Number.isNaN(n)) {
          setFontStep(Math.min(FONT_STEP_MAX, Math.max(FONT_STEP_MIN, n)));
        }
      }
      if (rawContrast === '1' || rawContrast === 'true') {
        setHighContrast(true);
      }
    } catch {
      void 0;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyToDocument(fontStep, highContrast);
    try {
      localStorage.setItem(STORAGE_FONT, String(fontStep));
      localStorage.setItem(STORAGE_CONTRAST, highContrast ? '1' : '0');
    } catch {
      void 0;
    }
  }, [fontStep, highContrast, ready]);

  const increaseFont = useCallback(() => {
    setFontStep((s) => Math.min(FONT_STEP_MAX, s + 1));
  }, []);

  const decreaseFont = useCallback(() => {
    setFontStep((s) => Math.max(FONT_STEP_MIN, s - 1));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((c) => !c);
  }, []);

  const reset = useCallback(() => {
    setFontStep(0);
    setHighContrast(false);
  }, []);

  const value = useMemo(
    () => ({
      fontStep,
      highContrast,
      increaseFont,
      decreaseFont,
      toggleHighContrast,
      reset,
    }),
    [fontStep, highContrast, increaseFont, decreaseFont, toggleHighContrast, reset]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility deve ser usado dentro de AccessibilityProvider');
  }
  return ctx;
}
