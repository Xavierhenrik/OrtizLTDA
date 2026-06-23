export type ProjetosModalLayoutInput = {
  viewportWidth: number;
  viewportHeight: number;
  titleLength: number;
  descriptionLength: number;
  categoryLength: number;
  hasGallery: boolean;
  isStacked: boolean;
};

export type ProjetosModalLayout = {
  modalMaxWidth: number;
  galleryFrameWidth: number;
  galleryFrameHeight: number;
  infoMaxWidth: number;
  bodyHeight: number;
};

const MODAL_WIDTH_RATIO = 0.88;
const MODAL_WIDTH_CAP = 1180;
const MODAL_HEIGHT_RATIO = 0.9;
const MODAL_CHROME_PX = 118;
const GRID_GAP_PX = 28;
const HORIZONTAL_PADDING_PX = 64;
const INFO_MIN_PX = 260;
const INFO_MAX_PX = 380;
const CHARS_PER_LINE = 42;
const LINE_HEIGHT_PX = 25;
const TITLE_BLOCK_PX = 38;
const CATEGORY_BLOCK_PX = 26;
const INFO_BLOCK_GAP_PX = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function computeProjetosModalLayout(input: ProjetosModalLayoutInput): ProjetosModalLayout {
  const {
    viewportWidth,
    viewportHeight,
    titleLength,
    descriptionLength,
    categoryLength,
    hasGallery,
    isStacked,
  } = input;

  const modalMaxWidth = Math.min(Math.round(viewportWidth * MODAL_WIDTH_RATIO), MODAL_WIDTH_CAP);
  const viewportBodyBudget = Math.round(viewportHeight * MODAL_HEIGHT_RATIO) - MODAL_CHROME_PX;

  const titleLines = Math.max(1, Math.ceil(titleLength / 28));
  const descriptionLines = Math.max(1, Math.ceil(descriptionLength / CHARS_PER_LINE));
  const categoryLines = categoryLength > 0 ? 1 : 0;
  const infoBlocks = 1 + categoryLines + 1;
  const infoContentHeight =
    titleLines * TITLE_BLOCK_PX +
    categoryLines * CATEGORY_BLOCK_PX +
    descriptionLines * LINE_HEIGHT_PX +
    Math.max(0, infoBlocks - 1) * INFO_BLOCK_GAP_PX;

  const infoMaxWidth = isStacked
    ? modalMaxWidth
    : clamp(Math.round(modalMaxWidth * 0.36), INFO_MIN_PX, INFO_MAX_PX);

  const galleryFrameWidth = isStacked
    ? modalMaxWidth - HORIZONTAL_PADDING_PX
    : modalMaxWidth - infoMaxWidth - GRID_GAP_PX - HORIZONTAL_PADDING_PX;

  const galleryFrameHeight = isStacked
    ? clamp(Math.round(viewportHeight * 0.52), 300, 520)
    : clamp(Math.round(viewportHeight * 0.62), 420, 680);

  const bodyHeight = hasGallery
    ? Math.max(galleryFrameHeight, Math.min(infoContentHeight, viewportBodyBudget))
    : Math.min(infoContentHeight, viewportBodyBudget);

  return {
    modalMaxWidth,
    galleryFrameWidth: hasGallery ? Math.max(280, galleryFrameWidth) : 0,
    galleryFrameHeight: hasGallery ? galleryFrameHeight : 0,
    infoMaxWidth,
    bodyHeight: Math.min(bodyHeight, viewportBodyBudget),
  };
}

export function projetosModalLayoutToCssVars(layout: ProjetosModalLayout): Record<string, string> {
  return {
    '--projetos-modal-max-w': `${layout.modalMaxWidth}px`,
    '--projetos-modal-info-max-w': `${layout.infoMaxWidth}px`,
    '--projetos-modal-body-h': `${layout.bodyHeight}px`,
    '--projetos-modal-gallery-w': layout.galleryFrameWidth > 0 ? `${layout.galleryFrameWidth}px` : '100%',
    '--projetos-modal-gallery-h': layout.galleryFrameHeight > 0 ? `${layout.galleryFrameHeight}px` : 'min(52vh, 520px)',
  };
}
