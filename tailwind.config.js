/** @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Cores semânticas: os valores reais (claro/escuro) ficam em src/constants/theme.ts
      colors: {
        bg: c('bg'),
        card: c('card'),
        field: c('field'),
        soft: c('soft'),
        primary: c('primary'),
        'primary-dark': c('primary-dark'),
        'on-primary': c('on-primary'),
        ink: c('ink'),
        muted: c('muted'),
        line: c('line'),
        income: c('income'),
        expense: c('expense'),
        danger: c('danger'),
        'danger-soft': c('danger-soft'),
        success: c('success'),
        'success-soft': c('success-soft'),
        warning: c('warning'),
        'warning-soft': c('warning-soft'),
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
