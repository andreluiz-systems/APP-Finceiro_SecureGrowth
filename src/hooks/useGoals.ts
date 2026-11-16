import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Goal } from '@/types/database';

import { useUserId } from './useUserId';

export function useGoals() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['goals', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Goal[]).map((g) => ({
        ...g,
        target_amount: Number(g.target_amount),
        saved_amount: Number(g.saved_amount),
      }));
    },
  });
}

export type GoalInput = {
  /** com id = editar; sem id = criar */
  id?: string;
  name: string;
  target_amount: number;
  /** valor já guardado: só é enviado ao criar a meta */
  saved_amount?: number;
  deadline: string | null;
  icon: string;
};

export function useSaveGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: GoalInput) => {
      const query = id ? supabase.from('goals').update(input).eq('id', id) : supabase.from('goals').insert(input);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/** Define o novo valor guardado (o gatilho do banco avisa quando a meta é alcançada). */
export function useSetGoalSaved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, saved_amount }: { id: string; saved_amount: number }) => {
      const { error } = await supabase.from('goals').update({ saved_amount }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}
