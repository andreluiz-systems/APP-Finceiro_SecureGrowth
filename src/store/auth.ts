import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** true depois que a sessão salva no aparelho foi lida */
  initialized: boolean;
  /** true durante a recuperação de senha, para não entrar no app antes de trocar a senha */
  recovering: boolean;
  setRecovering: (value: boolean) => void;
  /** true quando o link de recuperação expirou ou é inválido */
  linkError: boolean;
  setLinkError: (value: boolean) => void;
  /** Inicia a leitura da sessão e a escuta de mudanças. Retorna a função de limpeza. */
  init: () => () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  recovering: false,
  setRecovering: (recovering) => set({ recovering }),
  linkError: false,
  setLinkError: (linkError) => set({ linkError }),
  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initialized: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
    return () => data.subscription.unsubscribe();
  },
}));
