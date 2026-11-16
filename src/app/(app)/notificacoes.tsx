import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useDeleteNotification, useMarkNotificationsRead, useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { relativeDateTime } from '@/lib/format';
import type { NotificationKind } from '@/types/database';

const ICONS: Record<NotificationKind, keyof typeof Feather.glyphMap> = {
  info: 'info',
  transaction: 'repeat',
  reminder: 'calendar',
  goal: 'flag',
  security: 'shield',
};

export default function Notificacoes() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const remove = useDeleteNotification();

  const list = data ?? [];
  const unread = list.filter((n) => !n.read);

  function confirmClear() {
    Alert.alert('Limpar notificações', 'Apagar todas as notificações?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => remove.mutate('all') },
    ]);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-bg">
      <View className="px-5">
        <ScreenHeader
          title="Notificações"
          right={
            unread.length > 0 ? (
              <Pressable
                onPress={() => markRead.mutate(undefined)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Marcar todas como lidas"
                className="h-11 w-11 items-center justify-center rounded-full bg-soft active:opacity-70">
                <Feather name="check-circle" size={20} color={colors.primary} />
              </Pressable>
            ) : null
          }
        />
        {list.length > 0 ? (
          <View className="mb-2 flex-row items-center justify-between">
            <AppText tone="muted" className="text-xs">
              {unread.length === 0 ? 'Tudo lido' : unread.length === 1 ? '1 não lida' : `${unread.length} não lidas`}
            </AppText>
            <Pressable onPress={confirmClear} hitSlop={8} accessibilityRole="button">
              <AppText tone="danger" weight="semibold" className="text-xs">
                Limpar tudo
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState
          icon="alert-circle"
          title="Não foi possível carregar"
          message={dataErrorMessage(error)}
          actionLabel="Tentar de novo"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (!item.read) markRead.mutate([item.id]);
                if (item.kind === 'reminder') router.push('/lembretes');
                else if (item.kind === 'goal') router.navigate('/metas');
                else if (item.kind === 'transaction') router.navigate('/transacoes');
              }}
              onLongPress={() => remove.mutate(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.body}`}
              className={`mb-2 flex-row items-start rounded-2xl px-3 py-3 active:opacity-70 ${item.read ? '' : 'bg-field'}`}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-soft">
                <Feather name={ICONS[item.kind] ?? 'bell'} size={18} color={colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <AppText weight={item.read ? 'medium' : 'bold'} className="flex-1 text-sm" numberOfLines={1}>
                    {item.title}
                  </AppText>
                  {!item.read ? <View className="ml-2 h-2 w-2 rounded-full bg-primary" /> : null}
                </View>
                {item.body ? (
                  <AppText tone="muted" className="mt-0.5 text-xs">
                    {item.body}
                  </AppText>
                ) : null}
                <AppText tone="muted" className="mt-1 text-[11px] opacity-80">
                  {relativeDateTime(new Date(item.created_at))}
                </AppText>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="Nenhuma notificação"
              message="Avisos sobre transações, contas a vencer e metas aparecem aqui."
            />
          }
          ListFooterComponent={
            list.length > 0 ? (
              <AppText tone="muted" className="mt-2 text-center text-[11px]">
                Segure uma notificação para apagá-la.
              </AppText>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}
