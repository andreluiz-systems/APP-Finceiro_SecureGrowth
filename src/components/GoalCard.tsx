import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

import { gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrencyShort } from '@/lib/format';
import { goalProgress, isGoalReached } from '@/lib/goals';
import { useUiStore } from '@/store/ui';
import type { Goal } from '@/types/database';

import { AppText } from './AppText';
import { safeIcon } from './CategoryIcon';

const HIDDEN = 'R$ ••••';

type Props = { goal: Goal; onPress?: () => void };

/** Cartão roxo de meta (o mesmo da tela inicial): ícone, nome, valores e barra de progresso. */
export function GoalCard({ goal, onPress }: Props) {
  const { isDark } = useTheme();
  const hide = useUiStore((s) => s.hideBalance);
  const pct = goalProgress(goal);
  const reached = isGoalReached(goal);

  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={`Meta ${goal.name}`} className="active:opacity-80">
      <LinearGradient
        colors={isDark ? gradients.heroDark : gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <MaterialCommunityIcons name={safeIcon(goal.icon, 'flag-outline')} size={26} color="#FFFFFF" />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <AppText weight="bold" tone="white" className="flex-1 text-base" numberOfLines={1}>
              {goal.name}
            </AppText>
            <AppText weight="semibold" tone="white" className="ml-2 text-[11px] opacity-80">
              {hide ? HIDDEN : `${formatCurrencyShort(goal.saved_amount)} / ${formatCurrencyShort(goal.target_amount)}`}
            </AppText>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
            <View className="h-2 rounded-full bg-white" style={{ width: `${Math.round(pct * 100)}%` }} />
          </View>
          <AppText weight="medium" tone="white" className="mt-1.5 text-[11px] opacity-80">
            {reached ? 'Meta alcançada! 🎉' : `${Math.round(pct * 100)}% concluído`}
          </AppText>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
