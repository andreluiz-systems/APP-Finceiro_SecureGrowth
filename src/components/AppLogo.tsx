import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { gradients } from '@/constants/theme';

/** Ícone do app (carteira) desenhado com views, igual ao do Figma. */
export function AppLogo({ size = 96 }: { size?: number }) {
  const pillW = size * 0.47;
  const pillH = size * 0.31;
  return (
    <LinearGradient
      colors={gradients.appIcon}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.26, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: pillW, height: pillH, borderRadius: pillH * 0.3, backgroundColor: '#F4F1FB', overflow: 'hidden' }}>
        <View style={{ height: pillH * 0.12, backgroundColor: '#A78BFA' }} />
        <View
          style={{
            position: 'absolute',
            right: pillW * 0.1,
            top: pillH * 0.38,
            width: pillH * 0.24,
            height: pillH * 0.24,
            borderRadius: pillH,
            backgroundColor: '#2A0A5E',
          }}
        />
      </View>
    </LinearGradient>
  );
}
