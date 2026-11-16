import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { authErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { passwordError } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import type { TextInputHandle } from '@/types/ui';

export default function AlterarSenha() {
  const router = useRouter();
  const email = useAuthStore((s) => s.session?.user.email);
  const newRef = useRef<TextInputHandle>(null);
  const confirmRef = useRef<TextInputHandle>(null);

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; password?: string; confirm?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const next: typeof errors = {};
    if (!current) next.current = 'Informe a senha atual.';
    const pwd = passwordError(password);
    if (pwd) next.password = pwd;
    else if (password === current) next.password = 'A nova senha precisa ser diferente da atual.';
    if (confirm !== password) next.confirm = 'As senhas não são iguais.';
    setErrors(next);
    if (Object.keys(next).length || !email) return;

    setLoading(true);
    // Confere a senha atual entrando de novo (o Supabase não valida a senha atual no updateUser).
    const check = await supabase.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setLoading(false);
      const invalid = check.error.message.toLowerCase().includes('invalid login credentials');
      setErrors(invalid ? { current: 'Senha atual incorreta.' } : { form: authErrorMessage(check.error) });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setErrors({ form: authErrorMessage(error) });
      return;
    }

    // Registra um aviso de segurança nas notificações (se falhar, não atrapalha a troca).
    await supabase.from('notifications').insert({
      kind: 'security',
      title: 'Senha alterada',
      body: 'A senha da sua conta foi alterada. Se não foi você, redefina a senha pelo login.',
    });
    setLoading(false);
    Alert.alert('Senha alterada', 'Sua nova senha já está valendo.', [{ text: 'OK', onPress: () => router.back() }]);
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Alterar senha" />
      <AppText tone="muted" className="mb-6 text-sm">
        Para sua segurança, informe a senha atual e escolha uma nova com pelo menos 8 caracteres.
      </AppText>

      <View className="gap-4">
        <Input
          label="Senha atual"
          secure
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          value={current}
          onChangeText={setCurrent}
          onSubmitEditing={() => newRef.current?.focus()}
          error={errors.current}
        />
        <Input
          ref={newRef}
          label="Nova senha"
          secure
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => confirmRef.current?.focus()}
          error={errors.password}
        />
        <Input
          ref={confirmRef}
          label="Confirmar nova senha"
          secure
          returnKeyType="go"
          value={confirm}
          onChangeText={setConfirm}
          onSubmitEditing={handleSave}
          error={errors.confirm}
        />
      </View>

      {errors.form ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {errors.form}
        </AppText>
      ) : null}

      <Button title="Salvar nova senha" className="mt-8" loading={loading} onPress={handleSave} />
    </Screen>
  );
}
