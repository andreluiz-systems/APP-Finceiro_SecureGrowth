import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

type Props = {
  children: ReactNode;
  /** mostra a seta de voltar no topo */
  back?: boolean;
};

/** Fundo das telas de entrada: topo lilás com curva, como no Figma. */
export function AuthLayout({ children, back }: Props) {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const size = width * 1.7;

  return (
    <View className="flex-1 bg-bg">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, overflow: 'hidden' }} pointerEvents="none">
        <LinearGradient
          colors={isDark ? ['#2B1650', '#12081F'] : ['#D9CEEE', '#F7F5FB']}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            left: -(size - width) / 2,
            top: 330 - size,
          }}
        />
      </View>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-7 pb-8 pt-4 grow"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {back ? (
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-soft">
                <Feather name="arrow-left" size={20} color={colors.primary} />
              </Pressable>
            ) : null}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
