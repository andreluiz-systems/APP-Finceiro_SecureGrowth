import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { notificationTimes } from '@/lib/reminders';

// iOS guarda no máximo 64 notificações agendadas; usamos 2 por lembrete e limitamos a 30 lembretes.
const MAX_REMINDERS = 30;

type Scheduled = { id: string; name: string; amount: number; due_date: string; status: 'pending' | 'paid'; notify_before: boolean };

let handlerSet = false;

/** Mostra o aviso mesmo com o app aberto. */
function setupHandler() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Pede permissão para avisar (só pergunta ao usuário se ainda não decidiu). Devolve se está liberado. */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    setupHandler();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Reagenda todos os avisos de vencimento: cancela os antigos e cria os dos lembretes pendentes
 * que têm "avisar" ligado (3 dias antes e no dia, às 9h). Nunca derruba o app se falhar.
 */
export async function syncReminderNotifications(reminders: Scheduled[]): Promise<void> {
  try {
    setupHandler();
    const permission = await Notifications.getPermissionsAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!permission.granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('lembretes', {
        name: 'Lembretes de contas',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const now = new Date();
    const upcoming = reminders
      .filter((r) => r.status === 'pending' && r.notify_before)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, MAX_REMINDERS);

    for (const r of upcoming) {
      for (const t of notificationTimes(r.due_date, now)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: t.kind === 'before' ? 'Conta vence em 3 dias' : 'Conta vence hoje',
            body: `${r.name} · ${formatCurrency(r.amount)}`,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.date, channelId: 'lembretes' },
        });
      }
    }
  } catch {
    // Avisos locais são um extra: se algo falhar (por exemplo, no navegador), o app segue normal.
  }
}
