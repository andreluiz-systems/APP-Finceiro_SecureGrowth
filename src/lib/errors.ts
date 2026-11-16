/** Traduz erros do Supabase Auth para mensagens em português. */
export function authErrorMessage(error: unknown): string {
  const raw = (error as { message?: string } | null)?.message ?? '';
  const msg = raw.toLowerCase();

  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Este e-mail já está cadastrado.';
  if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('after'))
    return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid')))
    return 'Código inválido ou expirado.';
  if (msg.includes('current password')) return 'Informe a senha atual para trocar a senha.';
  if (msg.includes('different from the old password') || msg.includes('same password'))
    return 'A nova senha precisa ser diferente da atual.';
  if (msg.includes('password') && msg.includes('characters'))
    return 'A senha precisa ter pelo menos 8 caracteres.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Sem conexão. Verifique sua internet e tente de novo.';
  if (msg.includes('signup') && msg.includes('disabled')) return 'Cadastros estão desativados.';

  return 'Algo deu errado. Tente novamente.';
}

/** Mensagens para erros ao salvar/ler dados (tabelas, permissões, rede). */
export function dataErrorMessage(error: unknown): string {
  const e = (error ?? {}) as { message?: string; code?: string };
  const msg = (e.message ?? '').toLowerCase();

  if (e.code === 'PGRST205' || msg.includes('could not find the table') || msg.includes('does not exist'))
    return 'As tabelas ainda não existem no Supabase. Rode o arquivo SQL em SQL Editor.';
  if (e.code === '42501' || msg.includes('permission denied') || msg.includes('row-level security'))
    return 'Sem permissão no banco. Confira se o SQL (GRANTs e RLS) foi executado.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão. Verifique sua internet e tente de novo.';
  return 'Não foi possível concluir. Tente novamente.';
}
