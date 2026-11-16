import { Stack } from 'expo-router';

import { useReminderNotificationSync } from '@/hooks/useReminderNotificationSync';

export default function AppLayout() {
  useReminderNotificationSync();
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
