/** Bucket público de imagens de projetos (deve coincidir com o usado nas rotas de API). */
export const PROJECT_IMAGES_BUCKET = 'project-images';

/** Extrai o path dentro do bucket a partir da URL pública do Supabase Storage. */
export function projectImagePathFromPublicUrl(publicUrl: string): string | null {
  const needle = `/storage/v1/object/public/${PROJECT_IMAGES_BUCKET}/`;
  const i = publicUrl.indexOf(needle);
  if (i === -1) return null;
  return publicUrl.slice(i + needle.length);
}
