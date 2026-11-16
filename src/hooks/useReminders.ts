import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ReminderWithCategory } from '@/types/database';

import { useUserId } from './useUserId';

const SELECT = '*, category:categories(id, name, icon, kind)';

/** Todos os lembretes do usuário (pendentes e pagos), do vencimento mais próximo ao mais distante. */
export function useReminders() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['reminders', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<ReminderWithCategory[]> => {
      const { data, error } = await supabase
        .from('reminders')
        .select(SELECT)
        .order('due_date', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data as unknown as ReminderWithCategory[]).map((r) => ({ ...r, amount: Number(r.amount) }));
    },
  });
}

export type ReminderInput = {
  /** com id = editar; sem id = criar */
  id?: string;
  name: string;
  amount: number;
  category_id: string | null;
  due_date: string;
  repeat_monthly: boolean;
  notify_before: boolean;
};

export function useSaveReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ReminderInput) => {
      const query = id ? supabase.from('reminders').update(input).eq('id', id) : supabase.from('reminders').insert(input);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });
}

/**
 * Marca como pago (ou desfaz). É só uma anotação do usuário: o app não faz pagamentos.
 * No banco, um gatilho registra a data do pagamento, cria a notificação e, nos lembretes
 * mensais, já cria o do mês seguinte.
 */
export function useSetReminderPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const { error } = await supabase
        .from('reminders')
        .update({ status: paid ? 'paid' : 'pending' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });
}
