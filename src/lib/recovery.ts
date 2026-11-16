import { parseAuthLink } from '@/lib/authLink';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

let lastHandledUrl: string | null = null;

/**
 * Trata um link aberto no app. Se for de recuperação de senha, cria a sessão temporária
 * (a tela "nova-senha" usa ela para trocar a senha). Ignora qualquer outro link.
 */
export async function handleIncomingUrl(url: string | null): Promise<void> {
  if (!url || url === lastHandledUrl) return;
  const link = parseAuthLink(url);
  if (link.kind === 'none') return;
  lastHandledUrl = url;

  const { setRecovering, setLinkError } = useAuthStore.getState();

  if (link.kind === 'error') {
    setLinkError(true);
    return;
  }

  setLinkError(false);
  // Marca antes: a troca cria uma sessão e o app não pode entrar sozinho.
  setRecovering(true);

  const { error } =
    link.kind === 'recoveryCode'
      ? await supabase.auth.exchangeCodeForSession(link.code)
      : await supabase.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken });

  if (error) {
    setRecovering(false);
    setLinkError(true);
  }
}
