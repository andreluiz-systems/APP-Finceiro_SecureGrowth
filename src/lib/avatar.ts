import { supabase } from '@/lib/supabase';

const BUCKET = 'avatars';

/** Caminho do arquivo dentro do bucket, a partir do endereço público salvo no perfil. */
function pathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split('?')[0]) || null;
}

/** Mensagem em português para os erros mais comuns do Storage. */
export function avatarErrorMessage(error: unknown): string {
  const msg = ((error as { message?: string } | null)?.message ?? '').toLowerCase();
  if (msg.includes('row-level security') || msg.includes('unauthorized') || msg.includes('not authorized'))
    return 'Sem permissão para enviar a foto. Rode o SQL de correção do Storage no Supabase.';
  if (msg.includes('bucket not found') || msg.includes('not found'))
    return 'O bucket "avatars" não existe no Supabase. Rode o SQL de correção do Storage.';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to'))
    return 'Sem conexão. Verifique sua internet e tente de novo.';
  return 'Não foi possível enviar a foto. Tente novamente.';
}

/**
 * Envia a foto de perfil para o Storage e salva o endereço no perfil. Devolve o endereço novo.
 * Cada foto vai num arquivo novo (sem "upsert"), então só precisa da permissão de inserir.
 * A foto anterior é apagada em seguida, se der. Em caso de erro, lança uma exceção com o motivo.
 */
export async function uploadAvatar(userId: string, uri: string, previousUrl?: string | null): Promise<string> {
  const response = await fetch(uri);
  const bytes = await response.arrayBuffer();
  const path = `${userId}/avatar-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) {
    console.warn('[avatar] erro no upload:', error.message);
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (updateError) {
    console.warn('[avatar] erro ao salvar no perfil:', updateError.message);
    throw updateError;
  }

  // Limpeza da foto antiga: tentativa simples, sem atrapalhar se falhar.
  const old = pathFromUrl(previousUrl);
  if (old && old !== path) void supabase.storage.from(BUCKET).remove([old]).catch(() => {});

  return url;
}
