export const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'heic',
  'heif',
  'avif',
  'bmp',
  'tiff',
  'tif',
] as const;

export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

const IGNORED_SYSTEM_FILES = new Set(['.ds_store', 'thumbs.db', 'desktop.ini']);

function getFileName(name: string): string {
  const slash = name.lastIndexOf('/');
  return slash === -1 ? name : name.slice(slash + 1);
}

function getExtension(name: string): string {
  const base = getFileName(name);
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return '';
  return base.slice(dot + 1).toLowerCase();
}

export function isIgnoredSystemFile(name: string): boolean {
  const base = getFileName(name);
  const lower = base.toLowerCase();
  if (IGNORED_SYSTEM_FILES.has(lower)) return true;
  if (base.startsWith('._') || base.startsWith('~')) return true;
  return false;
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  const ext = getExtension(file.name);
  return (IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function getFileRelativePath(file: File): string {
  const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return relativePath?.length ? relativePath : file.name;
}

export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortImageFilesByPath(files: File[]): File[] {
  return [...files].sort((a, b) =>
    naturalCompare(getFileRelativePath(a), getFileRelativePath(b))
  );
}

export function dedupeImageFiles(files: File[]): File[] {
  const seen = new Set<string>();
  const result: File[] = [];

  for (const file of files) {
    const key = `${getFileRelativePath(file)}\0${file.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(file);
  }

  return result;
}

function getTopLevelFolder(file: File): string | null {
  const path = getFileRelativePath(file);
  const slash = path.indexOf('/');
  if (slash === -1) return null;
  return path.slice(0, slash);
}

function countUniqueFolders(files: File[]): number {
  const folders = new Set<string>();
  let hasNestedPath = false;

  for (const file of files) {
    const top = getTopLevelFolder(file);
    if (top === null) continue;
    hasNestedPath = true;
    folders.add(top);
  }

  if (!hasNestedPath) return 0;
  return folders.size;
}

export function processIncomingImageFiles(fileList: FileList | File[]): {
  files: File[];
  stats: {
    total: number;
    accepted: number;
    ignored: number;
    duplicates: number;
    folderCount: number;
  };
} {
  const all = Array.from(fileList);
  const total = all.length;

  const afterIgnored = all.filter((file) => !isIgnoredSystemFile(file.name));
  const ignoredSystem = total - afterIgnored.length;

  const afterImages = afterIgnored.filter(isImageFile);
  const ignoredNonImage = afterIgnored.length - afterImages.length;
  const ignored = ignoredSystem + ignoredNonImage;

  const beforeDedupe = afterImages.length;
  const deduped = dedupeImageFiles(afterImages);
  const duplicates = beforeDedupe - deduped.length;

  const files = sortImageFilesByPath(deduped);
  const accepted = files.length;
  const folderCount = countUniqueFolders(files);

  return {
    files,
    stats: { total, accepted, ignored, duplicates, folderCount },
  };
}

export function groupFilesByFolder(files: File[]): Map<string, File[]> {
  const groups = new Map<string, File[]>();

  for (const file of files) {
    const path = getFileRelativePath(file);
    const slash = path.indexOf('/');
    const folder = slash === -1 ? '' : path.slice(0, slash);

    const bucket = groups.get(folder);
    if (bucket) {
      bucket.push(file);
    } else {
      groups.set(folder, [file]);
    }
  }

  return groups;
}
