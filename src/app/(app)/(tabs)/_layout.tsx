import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...(props as any)} />}>
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="transacoes" />
      <Tabs.Screen name="relatorios" />
      <Tabs.Screen name="metas" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
