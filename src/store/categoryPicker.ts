import { create } from 'zustand';

import type { Category } from '@/types/database';

type PickerState = {
  /** categoria escolhida e para qual tela ela deve voltar */
  result: { target: string; category: Category } | null;
  pick: (target: string, category: Category) => void;
  consume: () => void;
};

export const useCategoryPickerStore = create<PickerState>((set) => ({
  result: null,
  pick: (target, category) => set({ result: { target, category } }),
  consume: () => set({ result: null }),
}));
