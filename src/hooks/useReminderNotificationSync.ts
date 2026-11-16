import { useEffect } from 'react';

import { syncReminderNotifications } from '@/lib/reminderNotifications';

import { useReminders } from './useReminders';

/** Mantém os avisos locais de vencimento em dia sempre que a lista de lembretes muda. */
export function useReminderNotificationSync() {
  const { data } = useReminders();
  useEffect(() => {
    if (data) void syncReminderNotifications(data);
  }, [data]);
}
