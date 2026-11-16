import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'sg:hide-balance';

type UiState = {
  /** esconde os valores do dashboard (olhinho do saldo) */
  hideBalance: boolean;
  load: () => Promise<void>;
  toggleHideBalance: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  hideBalance: false,
  load: async () => {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved === '1') set({ hideBalance: true });
    } catch {
      // sem armazenamento: segue com o padrão
    }
  },
  toggleHideBalance: () => {
    const next = !get().hideBalance;
    set({ hideBalance: next });
    AsyncStorage.setItem(KEY, next ? '1' : '0').catch(() => {});
  },
}));
