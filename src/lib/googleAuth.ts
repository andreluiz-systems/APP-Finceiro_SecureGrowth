import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { parseOAuthReturn } from '@/lib/authLink';
import { supabase } from '@/lib/supabase';

// Necessário para fechar a janela do navegador quando o app é reaberto pelo retorno do login.
WebBrowser.maybeCompleteAuthSession();

export type GoogleResult = { status: 'success' } | { status: 'cancelled' } | { status: 'error'; message: string };

/** Para onde o Supabase devolve o usuário depois do Google. No Expo Go vira exp://IP:8081/--/entrar-google. */
export function googleRedirectUrl(): string {
  return Linking.createURL('/entrar-google');
}

/**
 * Entra com a conta Google: abre o navegador do sistema, o usuário escolhe a conta e o Supabase
 * devolve um código (PKCE) que o app troca pela sessão. Se der certo, o guarda de rotas leva ao app.
 */
export async function signInWithGoogle(): Promise<GoogleResult> {
  try {
    const redirectTo = googleRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
    });
    if (error || !data?.url) return { status: 'error', message: googleErrorMessage(error?.message) };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return { status: 'cancelled' };

    const back = parseOAuthReturn(result.url);
    if (back.kind === 'error') {
      // "access_denied" = o usuário tocou em cancelar na tela do Google
      return back.message.includes('access_denied') ? { status: 'cancelled' } : { status: 'error', message: googleErrorMessage(back.message) };
    }
    if (back.kind === 'none') return { status: 'error', message: googleErrorMessage() };

    const exchange = await supabase.auth.exchangeCodeForSession(back.code);
    if (exchange.error) return { status: 'error', message: googleErrorMessage(exchange.error.message) };
    return { status: 'success' };
  } catch (e) {
    return { status: 'error', message: googleErrorMessage((e as Error | undefined)?.message) };
  }
}

function googleErrorMessage(raw?: string): string {
  const msg = (raw ?? '').toLowerCase();
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider'))
    return 'O login com Google ainda não foi ativado no Supabase.';
  if (msg.includes('redirect') || msg.includes('not allowed'))
    return 'O endereço de retorno não está liberado no Supabase (Redirect URLs).';
  if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão. Verifique sua internet e tente de novo.';
  return 'Não foi possível entrar com o Google. Tente novamente.';
}
