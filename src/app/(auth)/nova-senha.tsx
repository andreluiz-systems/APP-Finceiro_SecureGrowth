import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { passwordError } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import type { TextInputHandle } from '@/types/ui';

export default function NovaSenha() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const recovering = useAuthStore((s) => s.recovering);
  const linkError = useAuthStore((s) => s.linkError);
  const setRecovering = useAuthStore((s) => s.setRecovering);
  const setLinkError = useAuthStore((s) => s.setLinkError);
  const confirmRef = useRef<TextInputHandle>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const next: typeof errors = {};
    const pwd = passwordError(password);
    if (pwd) next.password = pwd;
    if (confirm !== password) next.confirm = 'As senhas não são iguais.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setErrors({ form: authErrorMessage(error) });
      return;
    }
    // Termina a sessão de recuperação: o usuário entra de novo com a senha nova.
    await supabase.auth.signOut();
    setRecovering(false);
    setLoading(false);
    router.replace({ pathname: '/login', params: { reset: '1' } });
  }

  function backToLogin() {
    setRecovering(false);
    setLinkError(false);
    router.replace('/login');
  }

  // Sem sessão de recuperação: o link expirou, é inválido ou a tela foi aberta sem ele.
  if (!session || !recovering) {
    return (
      <AuthLayout>
        <AppText weight="bold" className="mt-24 text-3xl">
          {linkError ? 'Link expirado' : 'Abra o link do e-mail'}
        </AppText>
        <AppText tone="muted" className="mt-2 text-sm">
          {linkError
            ? 'Este link de recuperação expirou ou já foi usado. Peça um novo link.'
            : 'Para criar uma nova senha, toque no link que enviamos para o seu e-mail, neste celular.'}
        </AppText>
        <Button title="Pedir novo link" className="mt-8" onPress={() => router.replace('/esqueci-senha')} />
        <Button title="Voltar ao login" variant="soft" className="mt-3" onPress={backToLogin} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AppText weight="bold" className="mt-24 text-3xl">
        Criar nova senha
      </AppText>
      <AppText tone="muted" className="mt-2 text-sm">
        Escolha uma senha com pelo menos 8 caracteres.
      </AppText>

      <View className="mt-8 gap-4">
        <Input
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

      <Button title="Salvar nova senha" className="mt-7" loading={loading} onPress={handleSave} />
    </AuthLayout>
  );
}
