import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';

import { useUserId } from './useUserId';

/** Categorias padrão do app + as do usuário, em ordem alfabética. */
export function useCategories() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['categories', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return (data as Category[]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    },
  });
}
