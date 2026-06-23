import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth-admin';
import { extractProjectImageFiles } from '@/lib/projects/form-parse';
import { uploadProjectImageFiles } from '@/lib/projects/upload-images';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

export async function POST(request: Request, { params }: Ctx) {
  const id = params.id;

  try {
    const supabase = createServerSupabase();
    const auth = await getAdminUser(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = extractProjectImageFiles(formData);

    if (!files.length) {
      return NextResponse.json({ message: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    const { data: row, error: rowErr } = await supabase
      .from('projects')
      .select('image_urls')
      .eq('id', id)
      .single();

    if (rowErr || !row) {
      console.error(rowErr);
      return NextResponse.json({ message: 'Projeto não encontrado' }, { status: 404 });
    }

    const existing = Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [];

    const { urls: uploadedUrls, error: uploadError } = await uploadProjectImageFiles(supabase, id, files);
    if (uploadError) {
      return NextResponse.json({ message: uploadError }, { status: 500 });
    }

    const imageUrls = [...existing, ...uploadedUrls];

    const { error: updateErr } = await supabase
      .from('projects')
      .update({
        image_urls: imageUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      console.error(updateErr);
      return NextResponse.json({ message: 'Erro ao atualizar projeto' }, { status: 500 });
    }

    return NextResponse.json({ imageUrls, uploadedUrls });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Erro ao enviar imagens' }, { status: 500 });
  }
}
