import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

const TABS: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  inicio: { icon: 'home', label: 'Início' },
  transacoes: { icon: 'shopping-cart', label: 'Transações' },
  relatorios: { icon: 'bar-chart-2', label: 'Relatórios' },
  metas: { icon: 'clipboard', label: 'Metas' },
  perfil: { icon: 'user', label: 'Perfil' },
};

// No Expo Router SDK 58 a barra recebe `emitter` e `navigateToTab` (não existe mais `navigation`).
// O tipo completo vem do React Navigation; aqui só declaramos o que usamos.
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  emitter: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
  };
  navigateToTab: (routeKey: string) => void;
};

/** Barra de abas flutuante em formato de pílula, como no Figma. */
export function FloatingTabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) }}
      className="items-center px-5">
      <View
        className="w-full flex-row items-center justify-between rounded-full border border-line bg-card p-2"
        style={{ shadowColor: '#6C2BD9', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigateToTab(route.key);
              }}
              className={`h-12 flex-1 items-center justify-center rounded-full ${focused ? 'bg-soft' : ''}`}>
              <Feather name={tab.icon} size={22} color={focused ? colors.primary : colors.ink} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
