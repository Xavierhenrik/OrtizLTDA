import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth-admin';
import {
  extractProjectFormFields,
  extractProjectImageFiles,
} from '@/lib/projects/form-parse';
import { projectToApi, sanitizeFilename, type ProjectRow } from '@/lib/project-map';
import { PROJECT_IMAGES_BUCKET } from '@/lib/supabase-storage';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, category, image_urls, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ message: 'Erro ao buscar projetos' }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map((row) => projectToApi(row as ProjectRow)));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Erro ao buscar projetos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase();
    const auth = await getAdminUser(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const formData = await request.formData();
    const { title, description, category } = extractProjectFormFields(formData);
    const files = extractProjectImageFiles(formData);

    const { data: inserted, error: insErr } = await supabase
      .from('projects')
      .insert({ title, description, category, image_urls: [] })
      .select('id')
      .single();

    if (insErr || !inserted) {
      console.error(insErr);
      return NextResponse.json({ message: 'Erro ao criar projeto' }, { status: 500 });
    }

    const projectId = inserted.id as string;
    const urls: string[] = [];

    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const name = `${Date.now()}-${sanitizeFilename(file.name)}`;
      const storagePath = `projects/${projectId}/${name}`;
      const { error: upErr } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).upload(storagePath, buf, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

      if (upErr) {
        console.error(upErr);
        return NextResponse.json({ message: 'Erro ao enviar imagens' }, { status: 500 });
      }

      const { data: pub } = supabase.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(storagePath);
      urls.push(pub.publicUrl);
    }

    const { data: final, error: upProjErr } = await supabase
      .from('projects')
      .update({
        image_urls: urls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select('id, title, description, category, image_urls, created_at, updated_at')
      .single();

    if (upProjErr || !final) {
      console.error(upProjErr);
      return NextResponse.json({ message: 'Erro ao criar projeto' }, { status: 500 });
    }

    return NextResponse.json(projectToApi(final as ProjectRow));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Erro ao criar projeto' }, { status: 500 });
  }
}
