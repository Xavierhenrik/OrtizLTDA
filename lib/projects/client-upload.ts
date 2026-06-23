export const IMAGE_UPLOAD_BATCH_SIZE = 8;

export type BatchUploadProgress = {
  completed: number;
  total: number;
  batchIndex: number;
  batchTotal: number;
};

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return items.length ? [items] : [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

type BatchUploadResponse = {
  imageUrls: string[];
  uploadedUrls: string[];
};

export class BatchUploadError extends Error {
  uploadedCount: number;
  imageUrls: string[];

  constructor(message: string, uploadedCount: number, imageUrls: string[]) {
    super(message);
    this.name = 'BatchUploadError';
    this.uploadedCount = uploadedCount;
    this.imageUrls = imageUrls;
  }
}

export async function uploadImagesInBatches(
  projectId: string,
  files: File[],
  onProgress?: (progress: BatchUploadProgress) => void
): Promise<BatchUploadResponse> {
  if (!files.length) {
    return { imageUrls: [], uploadedUrls: [] };
  }

  const chunks = chunkArray(files, IMAGE_UPLOAD_BATCH_SIZE);
  const uploadedUrls: string[] = [];
  let imageUrls: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const formData = new FormData();
    for (const file of chunks[i]) {
      formData.append('images', file);
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new BatchUploadError('Falha ao enviar lote de imagens', uploadedUrls.length, imageUrls);
      }

      const data = (await response.json()) as BatchUploadResponse;
      imageUrls = data.imageUrls;
      uploadedUrls.push(...data.uploadedUrls);

      onProgress?.({
        completed: uploadedUrls.length,
        total: files.length,
        batchIndex: i + 1,
        batchTotal: chunks.length,
      });
    } catch (err) {
      if (err instanceof BatchUploadError) throw err;
      throw new BatchUploadError('Falha ao enviar lote de imagens', uploadedUrls.length, imageUrls);
    }
  }

  return { imageUrls, uploadedUrls };
}
