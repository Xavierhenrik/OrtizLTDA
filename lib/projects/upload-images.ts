import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeFilename } from '@/lib/project-map';
import { PROJECT_IMAGES_BUCKET } from '@/lib/supabase-storage';

export async function uploadProjectImageFiles(
  supabase: SupabaseClient,
  projectId: string,
  files: File[]
): Promise<{ urls: string[]; error?: string }> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buf = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}-${i}-${sanitizeFilename(file.name)}`;
    const storagePath = `projects/${projectId}/${name}`;
    const { error: upErr } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).upload(storagePath, buf, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

    if (upErr) {
      console.error(upErr);
      return { urls, error: 'Erro ao enviar imagens' };
    }

    const { data: pub } = supabase.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(storagePath);
    urls.push(pub.publicUrl);
  }

  return { urls };
}
