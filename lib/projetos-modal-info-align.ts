export type ProjetosModalInfoAlignMode = 'center' | 'start';

export type ProjetosModalInfoAlignInput = {
  contentHeight: number;
  columnHeight: number;
  isStacked: boolean;
};

const FILL_RATIO_THRESHOLD = 0.82;
const MIN_CENTER_GAP_PX = 20;

export function computeProjetosModalInfoAlign(input: ProjetosModalInfoAlignInput): ProjetosModalInfoAlignMode {
  const { contentHeight, columnHeight, isStacked } = input;

  if (isStacked || columnHeight <= 0 || contentHeight <= 0) {
    return 'start';
  }

  const freeSpace = columnHeight - contentHeight;
  const fillRatio = contentHeight / columnHeight;

  if (contentHeight >= columnHeight - MIN_CENTER_GAP_PX) {
    return 'start';
  }

  if (fillRatio >= FILL_RATIO_THRESHOLD) {
    return 'start';
  }

  if (freeSpace < MIN_CENTER_GAP_PX * 2) {
    return 'start';
  }

  return 'center';
}

export function logProjetosModalInfoAlign(
  input: ProjetosModalInfoAlignInput,
  mode: ProjetosModalInfoAlignMode,
) {
  if (process.env.NODE_ENV !== 'development') return;

  const fillRatio =
    input.columnHeight > 0 ? Math.round((input.contentHeight / input.columnHeight) * 100) : 0;

  console.debug('[projetos-modal-info-align]', {
    mode,
    contentHeight: input.contentHeight,
    columnHeight: input.columnHeight,
    fillRatio: `${fillRatio}%`,
    isStacked: input.isStacked,
  });
}
