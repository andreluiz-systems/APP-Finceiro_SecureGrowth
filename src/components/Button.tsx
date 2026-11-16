import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { AppText } from './AppText';

type Variant = 'primary' | 'soft' | 'outline' | 'danger';

const box: Record<Variant, string> = {
  primary: 'bg-primary',
  soft: 'bg-soft',
  outline: 'border border-primary',
  danger: 'border border-danger bg-danger-soft',
};

const tone: Record<Variant, 'white' | 'primary' | 'danger'> = {
  primary: 'white',
  soft: 'primary',
  outline: 'primary',
  danger: 'danger',
};

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
};

export function Button({ title, variant = 'primary', loading, disabled, className = '', ...rest }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      className={`h-14 items-center justify-center rounded-2xl px-6 active:opacity-80 ${box[variant]} ${
        inactive ? 'opacity-60' : ''
      } ${className}`}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#6C2BD9'} />
      ) : (
        <AppText weight="bold" tone={tone[variant]} className="text-base">
          {title}
        </AppText>
      )}
    </Pressable>
  );
}
