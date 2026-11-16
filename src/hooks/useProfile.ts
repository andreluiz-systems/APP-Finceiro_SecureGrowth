import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { uploadAvatar } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

import { useUserId } from './useUserId';

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export type ProfileInput = { full_name: string; phone: string | null };

/** Salva nome e telefone no perfil e mantém o nome também nos dados da conta (usado como reserva na tela inicial). */
export function useSaveProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      if (!userId) throw new Error('Sem usuário logado');
      const { error } = await supabase.from('profiles').update(input).eq('id', userId);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: input.full_name } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

/** Troca a foto de perfil. Se o envio falhar, lança o erro (use avatarErrorMessage para o texto). */
export function useChangeAvatar() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uri, previousUrl }: { uri: string; previousUrl?: string | null }) => {
      if (!userId) throw new Error('Sem usuário logado');
      return uploadAvatar(userId, uri, previousUrl);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
