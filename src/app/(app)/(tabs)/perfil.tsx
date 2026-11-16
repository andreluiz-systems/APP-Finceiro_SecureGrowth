import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import type { ThemePreference } from '@/constants/theme';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useChangeAvatar, useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { avatarErrorMessage } from '@/lib/avatar';
import { pickSquarePhoto } from '@/lib/pickPhoto';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

const THEMES: { value: ThemePreference; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Escuro', icon: 'moon' },
  { value: 'system', label: 'Sistema', icon: 'smartphone' },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-7">
      <AppText weight="semibold" tone="muted" className="mb-2 ml-1 text-xs uppercase">
        {title}
      </AppText>
      <View className="overflow-hidden rounded-3xl bg-field">{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
  right,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hint?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={`flex-row items-center px-4 py-3.5 ${last ? '' : 'border-b border-line'} ${onPress ? 'active:opacity-70' : ''}`}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-soft">
        <Feather name={icon} size={17} color={colors.primary} />
      </View>
      <View className="ml-3 flex-1">
        <AppText weight="semibold" className="text-sm">
          {label}
        </AppText>
        {hint ? (
          <AppText tone="muted" className="text-xs">
            {hint}
          </AppText>
        ) : null}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

export default function Perfil() {
  const router = useRouter();
  const { colors, preference, setPreference } = useTheme();
  const user = useAuthStore((s) => s.session?.user);
  const profile = useProfile();
  const changeAvatar = useChangeAvatar();
  const unread = useUnreadCount();
  const hide = useUiStore((s) => s.hideBalance);
  const toggleHide = useUiStore((s) => s.toggleHideBalance);

  const name = profile.data?.full_name || (user?.user_metadata?.full_name as string | undefined) || 'Usuário';

  async function handleChangePhoto() {
    const uri = await pickSquarePhoto();
    if (!uri) return;
    try {
      await changeAvatar.mutateAsync({ uri, previousUrl: profile.data?.avatar_url });
    } catch (error) {
      Alert.alert('Não foi possível trocar a foto', avatarErrorMessage(error));
    }
  }

  function confirmSignOut() {
    Alert.alert('Sair da conta', 'Você precisará entrar de novo para acessar seus dados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void supabase.auth.signOut() },
    ]);
  }

  return (
    <Screen tabBarSpace>
      <AppText weight="bold" className="mt-6 text-2xl">
        Perfil
      </AppText>

      <View className="mt-5 items-center rounded-3xl bg-field px-5 py-6">
        <Pressable
          onPress={handleChangePhoto}
          accessibilityRole="button"
          accessibilityLabel="Trocar foto de perfil"
          disabled={changeAvatar.isPending}
          className="active:opacity-80">
          <Avatar uri={profile.data?.avatar_url} size={96} />
          <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-field bg-primary">
            <Feather name={changeAvatar.isPending ? 'loader' : 'camera'} size={14} color="#FFFFFF" />
          </View>
        </Pressable>
        <AppText weight="bold" className="mt-4 text-lg" numberOfLines={1}>
          {name}
        </AppText>
        <AppText tone="muted" className="text-sm" numberOfLines={1}>
          {user?.email}
        </AppText>
      </View>

      <Group title="Conta">
        <Row icon="user" label="Editar perfil" hint="Nome, telefone e foto" onPress={() => router.push('/perfil-editar')} />
        <Row icon="lock" label="Alterar senha" onPress={() => router.push('/alterar-senha')} />
        <Row
          icon="bell"
          label="Notificações"
          hint={unread > 0 ? `${unread} não ${unread === 1 ? 'lida' : 'lidas'}` : undefined}
          onPress={() => router.push('/notificacoes')}
        />
        <Row icon="calendar" label="Alertas e lembretes" onPress={() => router.push('/lembretes')} last />
      </Group>

      <Group title="Preferências">
        <View className="border-b border-line px-4 py-3.5">
          <AppText weight="semibold" className="text-sm">
            Aparência
          </AppText>
          <View className="mt-3 flex-row gap-2">
            {THEMES.map((o) => {
              const selected = preference === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => setPreference(o.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl py-3 ${selected ? 'bg-primary' : 'bg-soft'}`}>
                  <Feather name={o.icon} size={15} color={selected ? '#FFFFFF' : colors.primary} />
                  <AppText weight="semibold" tone={selected ? 'white' : 'primary'} className="text-xs">
                    {o.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Row
          icon="eye-off"
          label="Ocultar valores"
          hint="Esconde o saldo e os valores na tela inicial"
          last
          right={
            <Switch
              value={hide}
              onValueChange={toggleHide}
              accessibilityLabel="Ocultar valores"
              trackColor={{ false: colors.line, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </Group>

      <Group title="Sobre">
        <Row icon="info" label="Secure Growth" hint={`Versão ${Constants.expoConfig?.version ?? '1.0.0'} · Projeto da UNICEPLAC`} last />
      </Group>

      <Pressable
        onPress={confirmSignOut}
        accessibilityRole="button"
        className="mt-8 h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-danger bg-danger-soft active:opacity-80">
        <Feather name="log-out" size={18} color={colors.danger} />
        <AppText weight="bold" tone="danger" className="text-base">
          Sair da conta
        </AppText>
      </Pressable>
    </Screen>
  );
}
