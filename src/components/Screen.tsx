import type { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  /** rola o conteúdo (padrão) */
  scroll?: boolean;
  edges?: Edge[];
  className?: string;
  contentClassName?: string;
  /** espaço extra no fim para a barra de abas flutuante */
  tabBarSpace?: boolean;
  /** puxar para atualizar */
  refreshControl?: ReactElement<RefreshControlProps>;
};

/** Container padrão de tela: área segura, teclado e rolagem. */
export function Screen({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  className = '',
  contentClassName = '',
  tabBarSpace = false,
  refreshControl,
}: Props) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-bg ${className}`}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={`px-5 ${tabBarSpace ? 'pb-44' : 'pb-8'} ${contentClassName}`}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 px-5 ${contentClassName}`}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
