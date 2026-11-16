import { vars } from 'nativewind';

export type ThemeScheme = 'light' | 'dark';
export type ThemePreference = ThemeScheme | 'system';

/**
 * Paleta extraída do Figma (roxo + neutros). Cada cor existe em duas versões.
 * Os valores são "R G B" porque o Tailwind monta rgb(var(--color-x) / alpha).
 * Para usar a cor em JS (ícones, gradientes) use `useTheme().colors`.
 */
const palette = {
  light: {
    bg: '255 255 255',
    card: '255 255 255',
    field: '238 237 254', // #EEEDFE
    soft: '237 233 254', // fundo de ícones
    primary: '108 43 217', // #6C2BD9
    'primary-dark': '67 8 166', // #4308A6
    'on-primary': '255 255 255',
    ink: '26 11 46', // #1A0B2E
    muted: '138 135 152',
    line: '226 222 240',
    income: '22 163 74',
    expense: '108 43 217',
    danger: '220 38 38',
    'danger-soft': '253 235 235',
    success: '22 163 74',
    'success-soft': '228 240 231',
    warning: '194 105 61',
    'warning-soft': '250 232 220',
  },
  dark: {
    bg: '18 8 31', // #12081F
    card: '31 18 51',
    field: '40 26 66',
    soft: '52 34 88',
    primary: '139 92 246', // #8B5CF6
    'primary-dark': '109 58 224',
    'on-primary': '255 255 255',
    ink: '243 238 255',
    muted: '167 155 194',
    line: '58 42 92',
    income: '72 221 159', // #48DD9F
    expense: '255 129 134', // #FF8186
    danger: '248 113 113',
    'danger-soft': '66 24 34',
    success: '72 221 159',
    'success-soft': '20 52 40',
    warning: '251 146 60',
    'warning-soft': '66 40 22',
  },
} as const;

export type ColorToken = keyof (typeof palette)['light'];

/** Estilos com as variáveis CSS que o Tailwind usa; aplicados na raiz do app. */
export const themeVars = {
  light: vars(
    Object.fromEntries(Object.entries(palette.light).map(([k, v]) => [`--color-${k}`, v])),
  ),
  dark: vars(
    Object.fromEntries(Object.entries(palette.dark).map(([k, v]) => [`--color-${k}`, v])),
  ),
};

const toHex = (rgb: string) =>
  '#' +
  rgb
    .split(' ')
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('');

/** Mesmas cores em hexadecimal, para ícones, gradientes e gráficos. */
export const hexColors = {
  light: Object.fromEntries(
    Object.entries(palette.light).map(([k, v]) => [k, toHex(v)]),
  ) as Record<ColorToken, string>,
  dark: Object.fromEntries(
    Object.entries(palette.dark).map(([k, v]) => [k, toHex(v)]),
  ) as Record<ColorToken, string>,
};

/** Gradientes do Figma (splash, cartão de saldo). */
export const gradients = {
  splash: ['#1A0B2E', '#3C1A77'] as const,
  hero: ['#6E2DDA', '#9869FD'] as const,
  heroDark: ['#4C1D95', '#7C3AED'] as const,
  panel: ['#3B1A77', '#5B21B6'] as const,
  appIcon: ['#2A0A5E', '#A855F7'] as const,
};

/** Cores fixas de gráficos (iguais nos dois temas). */
export const chartColors = {
  income: '#48DD9F',
  expense: '#FF8186',
  donut: ['#1E0540', '#3B0F7A', '#5B21B6', '#7C3AED', '#A78BFA'],
};
