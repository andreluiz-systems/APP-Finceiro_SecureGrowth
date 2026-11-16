import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TransactionType, TransactionWithCategory } from '@/types/database';

import { useUserId } from './useUserId';

const SELECT = '*, category:categories(id, name, icon, kind)';

/** Todas as transações do usuário, da mais nova para a mais antiga (o RLS filtra pelo dono). */
export function useTransactions() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['transactions', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<TransactionWithCategory[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select(SELECT)
        .order('occurred_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data as unknown as TransactionWithCategory[]).map((t) => ({ ...t, amount: Number(t.amount) }));
    },
  });
}

export type TransactionInput = {
  /** com id = editar; sem id = criar */
  id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  occurred_at: string;
  notes: string | null;
};

export function useSaveTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TransactionInput) => {
      const query = id
        ? supabase.from('transactions').update(input).eq('id', id)
        : supabase.from('transactions').insert(input);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
