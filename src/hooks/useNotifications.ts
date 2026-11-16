import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/types/database';

import { useUserId } from './useUserId';

/** Notificações do usuário, da mais nova para a mais antiga. */
export function useNotifications() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    staleTime: 15 * 1000,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AppNotification[];
    },
  });
}

/** Quantas notificações ainda não foram lidas (para o ponto no sino). */
export function useUnreadCount(): number {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    /** `ids` vazio/omitido = marca todas as não lidas. */
    mutationFn: async (ids?: string[]) => {
      let query = supabase.from('notifications').update({ read: true }).eq('read', false);
      if (ids && ids.length > 0) query = query.in('id', ids);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | 'all') => {
      const query = supabase.from('notifications').delete();
      const { error } = id === 'all' ? await query.not('id', 'is', null) : await query.eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
