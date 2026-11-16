import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useChangeAvatar, useProfile, useSaveProfile } from '@/hooks/useProfile';
import { dataErrorMessage } from '@/lib/errors';
import { formatPhone, isValidPhone } from '@/lib/format';
import { avatarErrorMessage } from '@/lib/avatar';
import { pickSquarePhoto } from '@/lib/pickPhoto';
import { useAuthStore } from '@/store/auth';

export default function PerfilEditar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.session?.user);
  const profile = useProfile();
  const save = useSaveProfile();
  const changeAvatar = useChangeAvatar();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filled, setFilled] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});

  // Preenche os campos uma vez, quando o perfil chega do banco.
  useEffect(() => {
    if (filled || profile.isLoading) return;
    setName(profile.data?.full_name || (user?.user_metadata?.full_name as string | undefined) || '');
    setPhone(formatPhone(profile.data?.phone ?? ''));
    setFilled(true);
  }, [filled, profile.isLoading, profile.data, user]);

  async function handleChangePhoto() {
    const uri = await pickSquarePhoto();
    if (!uri) return;
    try {
      await changeAvatar.mutateAsync({ uri, previousUrl: profile.data?.avatar_url });
    } catch (error) {
      Alert.alert('Não foi possível trocar a foto', avatarErrorMessage(error));
    }
  }

  async function handleSave() {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Informe seu nome completo.';
    if (!isValidPhone(phone)) next.phone = 'Informe o telefone com DDD, ex.: (61) 99999-8888.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await save.mutateAsync({ full_name: name.trim(), phone: phone.trim() || null });
      router.back();
    } catch (error) {
      setErrors({ form: dataErrorMessage(error) });
    }
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Editar perfil" />

      <View className="items-center">
        <Pressable
          onPress={handleChangePhoto}
          disabled={changeAvatar.isPending}
          accessibilityRole="button"
          accessibilityLabel="Trocar foto de perfil"
          className="active:opacity-80">
          <Avatar uri={profile.data?.avatar_url} size={104} />
          <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-bg bg-primary">
            <Feather name={changeAvatar.isPending ? 'loader' : 'camera'} size={16} color="#FFFFFF" />
          </View>
        </Pressable>
        <AppText tone="primary" weight="semibold" className="mt-3 text-sm">
          Trocar foto
        </AppText>
      </View>

      <View className="mt-6 gap-4">
        <Input
          label="Nome completo"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={80}
          returnKeyType="next"
          error={errors.name}
        />
        <Input
          label="Telefone (opcional)"
          value={phone}
          onChangeText={(t) => setPhone(formatPhone(t))}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          returnKeyType="done"
          error={errors.phone}
        />
        <View>
          <Input label="E-mail" value={user?.email ?? ''} editable={false} className="opacity-60" />
          <AppText tone="muted" className="ml-1 mt-1 text-xs">
            O e-mail não pode ser alterado por aqui.
          </AppText>
        </View>
      </View>

      {errors.form ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {errors.form}
        </AppText>
      ) : null}

      <Button title="Salvar" className="mt-8" loading={save.isPending} onPress={handleSave} />
    </Screen>
  );
}
