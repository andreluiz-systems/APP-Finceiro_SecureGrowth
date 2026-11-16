import { Text, type TextProps } from 'react-native';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Tone = 'ink' | 'muted' | 'primary' | 'danger' | 'success' | 'income' | 'expense' | 'white';

const family: Record<Weight, string> = {
  regular: 'font-inter',
  medium: 'font-inter-medium',
  semibold: 'font-inter-semibold',
  bold: 'font-inter-bold',
};

const color: Record<Tone, string> = {
  ink: 'text-ink',
  muted: 'text-muted',
  primary: 'text-primary',
  danger: 'text-danger',
  success: 'text-success',
  income: 'text-income',
  expense: 'text-expense',
  white: 'text-white',
};

type Props = TextProps & { weight?: Weight; tone?: Tone; className?: string };

/** Texto padrão do app: fonte Inter + cor do tema. Use `tone` para a cor e `className` para tamanho/margem. */
export function AppText({ weight = 'regular', tone = 'ink', className = '', ...rest }: Props) {
  return <Text className={`${family[weight]} ${color[tone]} ${className}`} {...rest} />;
}
