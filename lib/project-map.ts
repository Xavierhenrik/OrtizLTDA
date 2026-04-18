export type ProjectRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_urls: string[] | null;
  created_at: string;
  updated_at: string;
};

function parseImageUrls(raw: ProjectRow['image_urls']): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as string[];
  return [];
}

export function projectToApi(row: ProjectRow) {
  const imageUrls = parseImageUrls(row.image_urls);
  return {
    _id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrls,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}
