import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useCategoryPickerStore } from '@/store/categoryPicker';
import type { Category } from '@/types/database';

/**
 * Seletor de categorias reutilizável. Qualquer tela que precise de categoria faz:
 *
 *   const picker = useCategoryPicker('transacao', (cat) => setCategoria(cat));
 *   picker.open({ kind: 'expense', selectedId: categoria?.id });
 *
 * `target` identifica a tela, para a escolha voltar só para ela.
 */
export function useCategoryPicker(target: string, onPick: (category: Category) => void) {
  const router = useRouter();
  const result = useCategoryPickerStore((s) => s.result);
  const consume = useCategoryPickerStore((s) => s.consume);
  const callback = useRef(onPick);
  callback.current = onPick;

  useEffect(() => {
    if (result && result.target === target) {
      callback.current(result.category);
      consume();
    }
  }, [result, target, consume]);

  return {
    open: (options: { kind?: 'income' | 'expense'; selectedId?: string | null } = {}) =>
      router.push({
        pathname: '/categorias',
        params: { target, kind: options.kind ?? 'all', selected: options.selectedId ?? '' },
      }),
  };
}
