import { useAuthStore } from '@/store/auth';

/** Id do usuário logado. Entra na chave das consultas para o cache nunca misturar contas. */
export function useUserId(): string | null {
  return useAuthStore((s) => s.session?.user.id ?? null);
}
