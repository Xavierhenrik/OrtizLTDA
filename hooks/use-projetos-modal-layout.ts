'use client';

import {
  computeProjetosModalLayout,
  projetosModalLayoutToCssVars,
  type ProjetosModalLayout,
} from '@/lib/projetos-modal-layout';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_LAYOUT: ProjetosModalLayout = {
  modalMaxWidth: 1180,
  galleryFrameWidth: 708,
  galleryFrameHeight: 560,
  infoMaxWidth: 380,
  bodyHeight: 560,
};

type UseProjetosModalLayoutOptions = {
  open: boolean;
  title: string;
  description: string;
  category: string;
  hasGallery: boolean;
};

export function useProjetosModalLayout(options: UseProjetosModalLayoutOptions) {
  const { open, title, description, category, hasGallery } = options;
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });

  useEffect(() => {
    if (!open) return;

    function syncViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, [open]);

  const layout = useMemo(() => {
    if (!open) return DEFAULT_LAYOUT;

    const isStacked = viewport.width <= 768;
    return computeProjetosModalLayout({
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      titleLength: title.length,
      descriptionLength: description.length,
      categoryLength: category.length,
      hasGallery,
      isStacked,
    });
  }, [open, viewport.width, viewport.height, title.length, description.length, category.length, hasGallery]);

  const cssVars = useMemo(() => projetosModalLayoutToCssVars(layout), [layout]);

  return { layout, cssVars };
}
