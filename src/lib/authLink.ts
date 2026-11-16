/** Resultado da leitura de um link que o Supabase manda por e-mail. */
export type AuthLink =
  | { kind: 'recoveryCode'; code: string }
  | { kind: 'recovery'; accessToken: string; refreshToken: string }
  | { kind: 'error'; message: string }
  | { kind: 'none' };

/**
 * Lê um link de recuperação de senha aberto no app. Formatos aceitos:
 *   app://nova-senha?code=...                                   (PKCE, o usado pelo app)
 *   app://nova-senha#access_token=...&refresh_token=...&type=recovery   (formato antigo)
 *   app://nova-senha#error=access_denied&error_code=otp_expired&error_description=...
 */
export function parseAuthLink(url: string): AuthLink {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const beforeHash = url.split('#')[0];
  const query = beforeHash.includes('?') ? beforeHash.slice(beforeHash.indexOf('?') + 1) : '';

  const fromHash = new URLSearchParams(hash);
  const fromQuery = new URLSearchParams(query);
  const get = (key: string) => fromHash.get(key) ?? fromQuery.get(key);

  // Só o link de recuperação de senha (nova-senha) é tratado aqui; o retorno do login com Google
  // é lido por parseOAuthReturn e não pode ser confundido com um link de e-mail.
  const isRecoveryLink = beforeHash.includes('nova-senha');

  if (isRecoveryLink && (get('error') || get('error_code'))) {
    return { kind: 'error', message: get('error_description') ?? 'Link inválido ou expirado.' };
  }

  const accessToken = get('access_token');
  const refreshToken = get('refresh_token');
  if (get('type') === 'recovery' && accessToken && refreshToken) {
    return { kind: 'recovery', accessToken, refreshToken };
  }

  // O app só pede link para a tela nova-senha; outros links com "code" são ignorados.
  const code = get('code');
  if (code && beforeHash.includes('nova-senha')) {
    return { kind: 'recoveryCode', code };
  }

  return { kind: 'none' };
}

/** Versão do endereço segura para log: esconde códigos e tokens. */
export function redactUrl(url: string): string {
  return url.replace(/(access_token|refresh_token|code)=[^&#]+/g, '$1=***');
}

/** Resultado da volta do navegador no login com Google (login social por PKCE). */
export type OAuthReturn = { kind: 'code'; code: string } | { kind: 'error'; message: string } | { kind: 'none' };

/**
 * Lê o endereço para onde o navegador volta depois do login social:
 *   app://entrar-google?code=...                                   (sucesso)
 *   app://entrar-google?error=access_denied&error_description=...  (cancelou ou deu erro)
 */
export function parseOAuthReturn(url: string): OAuthReturn {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const beforeHash = url.split('#')[0];
  const query = beforeHash.includes('?') ? beforeHash.slice(beforeHash.indexOf('?') + 1) : '';
  const fromHash = new URLSearchParams(hash);
  const fromQuery = new URLSearchParams(query);
  const get = (key: string) => fromQuery.get(key) ?? fromHash.get(key);

  const error = get('error') ?? get('error_code');
  if (error) return { kind: 'error', message: get('error_description') ?? error };
  const code = get('code');
  if (code) return { kind: 'code', code };
  return { kind: 'none' };
}
