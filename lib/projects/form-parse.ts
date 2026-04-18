export function extractProjectFormFields(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    category: String(formData.get('category') ?? ''),
  };
}

export function extractProjectImageFiles(formData: FormData): File[] {
  return formData
    .getAll('images')
    .filter((f): f is File => typeof f === 'object' && f !== null && 'arrayBuffer' in f && (f as File).size > 0);
}

export function parseKeepImageUrls(
  formData: FormData
): { ok: true; urls: string[] } | { ok: false } {
  try {
    const raw = formData.get('keepImageUrls');
    const parsed = JSON.parse(String(raw ?? '[]'));
    if (Array.isArray(parsed)) {
      return { ok: true, urls: parsed.filter((u): u is string => typeof u === 'string') };
    }
    return { ok: true, urls: [] };
  } catch {
    return { ok: false };
  }
}
