export const PROJECT_IMAGES_BUCKET = 'project-images';

export function projectImagePathFromPublicUrl(publicUrl: string): string | null {
  const needle = `/storage/v1/object/public/${PROJECT_IMAGES_BUCKET}/`;
  const i = publicUrl.indexOf(needle);
  if (i === -1) return null;
  return publicUrl.slice(i + needle.length);
}
