import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth-admin';
import { projectToApi, sanitizeFilename, type ProjectRow } from '@/lib/project-map';
import { PROJECT_IMAGES_BUCKET, projectImagePathFromPublicUrl } from '@/lib/supabase-storage';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

export async function PUT(request: Request, { params }: Ctx) {
  const id = params.id;
  try {
    const supabase = createServerSupabase();
    const auth = await getAdminUser(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') ?? '');
    const description = String(formData.get('description') ?? '');
    const category = String(formData.get('category') ?? '');
    const files = formData
      .getAll('images')
      .filter((f): f is File => typeof f === 'object' && f !== null && 'arrayBuffer' in f && (f as File).size > 0);

    const hasExplicitKeep = formData.has('keepImageUrls');
    let keepUrlsFromClient: string[] | undefined;
    if (hasExplicitKeep) {
      try {
        const raw = formData.get('keepImageUrls');
        const parsed = JSON.parse(String(raw ?? '[]'));
        if (Array.isArray(parsed)) {
          keepUrlsFromClient = parsed.filter((u): u is string => typeof u === 'string');
        } else {
          keepUrlsFromClient = [];
        }
      } catch {
        return NextResponse.json({ message: 'Lista de imagens inválida' }, { status: 400 });
      }
    }

    const { data: row, error: rowErr } = await supabase
      .from('projects')
      .select('image_urls')
      .eq('id', id)
      .single();

    if (rowErr) {
      console.error(rowErr);
      return NextResponse.json({ message: 'Erro ao carregar projeto' }, { status: 500 });
    }

    const existingFromDb = Array.isArray(row?.image_urls) ? (row.image_urls as string[]) : [];

    const uploaded: string[] = [];
    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const name = `${Date.now()}-${sanitizeFilename(file.name)}`;
      const storagePath = `projects/${id}/${name}`;
      const { error: upErr } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).upload(storagePath, buf, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

      if (upErr) {
        console.error(upErr);
        return NextResponse.json({ message: 'Erro ao enviar imagens' }, { status: 500 });
      }

      const { data: pub } = supabase.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(storagePath);
      uploaded.push(pub.publicUrl);
    }

    let mergedImageUrls: string[] | undefined;
    if (hasExplicitKeep && keepUrlsFromClient !== undefined) {
      const allowedOld = new Set(existingFromDb);
      const sanitizedKeep = keepUrlsFromClient.filter((u) => allowedOld.has(u));
      mergedImageUrls = [...sanitizedKeep, ...uploaded];
    } else if (files.length > 0) {
      mergedImageUrls = [...existingFromDb, ...uploaded];
    }

    const patch: Record<string, unknown> = {
      title,
      description,
      category,
      updated_at: new Date().toISOString(),
    };
    if (mergedImageUrls !== undefined) {
      patch.image_urls = mergedImageUrls;
    }

    const { data: final, error } = await supabase
      .from('projects')
      .update(patch)
      .eq('id', id)
      .select('id, title, description, category, image_urls, created_at, updated_at')
      .single();

    if (error || !final) {
      console.error(error);
      return NextResponse.json({ message: 'Erro ao atualizar projeto' }, { status: 500 });
    }

    if (mergedImageUrls !== undefined) {
      const removedPaths = existingFromDb
        .filter((url) => !mergedImageUrls.includes(url))
        .map(projectImagePathFromPublicUrl)
        .filter((p): p is string => Boolean(p));

      if (removedPaths.length > 0) {
        const { error: rmErr } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove(removedPaths);
        if (rmErr) {
          console.error('Falha ao remover arquivos do storage', rmErr);
        }
      }
    }

    return NextResponse.json(projectToApi(final as ProjectRow));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Erro ao atualizar projeto' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const id = params.id;
  try {
    const supabase = createServerSupabase();
    const auth = await getAdminUser(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      console.error(error);
      return NextResponse.json({ message: 'Erro ao deletar projeto' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Projeto deletado com sucesso' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Erro ao deletar projeto' }, { status: 500 });
  }
}
