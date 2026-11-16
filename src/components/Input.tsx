import { Feather } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { TextInputHandle } from '@/types/ui';

import { AppText } from './AppText';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  /** campo de senha, com botão de mostrar/ocultar */
  secure?: boolean;
  className?: string;
};

export const Input = forwardRef<TextInputHandle, Props>(function Input(
  { label, error, secure, className = '', onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);

  const border = error ? 'border-danger' : focused ? 'border-primary' : 'border-primary/40';

  return (
    <View className={`w-full ${className}`}>
      {label ? (
        <AppText weight="semibold" className="mb-1.5 text-sm">
          {label}
        </AppText>
      ) : null}
      <View className={`flex-row items-center rounded-2xl border bg-field/60 px-4 ${border}`}>
        <TextInput
          ref={ref}
          className="flex-1 py-3.5 font-inter text-base text-ink"
          placeholderTextColor={colors.muted}
          secureTextEntry={secure ? hidden : undefined}
          autoCapitalize="none"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText tone="danger" className="mt-1 text-xs">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});
