import type { SupabaseClient } from '@supabase/supabase-js';

export async function getAdminUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { user: null, isAdmin: false as const };
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr || !profile?.is_admin) {
    return { user, isAdmin: false as const };
  }

  return { user, isAdmin: true as const };
}
