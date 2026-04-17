'use client';

import { useEffect } from 'react';

export function HeroBoot() {
  useEffect(() => {
    document.querySelector('.hero-content')?.classList.add('show');
  }, []);
  return null;
}
