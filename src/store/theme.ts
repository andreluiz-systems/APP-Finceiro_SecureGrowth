import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { ThemePreference } from '@/constants/theme';

const KEY = 'sg:theme-preference';

type ThemeState = {
  preference: ThemePreference;
  loaded: boolean;
  load: () => Promise<void>;
  setPreference: (p: ThemePreference) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  loaded: false,
  load: async () => {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ preference: saved, loaded: true });
        return;
      }
    } catch {
      // sem armazenamento: segue com o padrão
    }
    set({ loaded: true });
  },
  setPreference: (preference) => {
    set({ preference });
    AsyncStorage.setItem(KEY, preference).catch(() => {});
  },
}));
