import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useTheme } from '@/hooks/useTheme';
import { authErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/lib/validation';

const RESEND_SECONDS = 60;

export default function EsqueciSenha() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  async function sendLink() {
    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    setError(undefined);
    setLoading(true);
    // O link do e-mail abre o app direto na tela "nova-senha".
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/nova-senha'),
    });
    setLoading(false);
    if (err) {
      setError(authErrorMessage(err));
      return;
    }
    setSent(true);
    setSeconds(RESEND_SECONDS);
  }

  if (sent) {
    return (
      <AuthLayout back>
        <View className="mt-20 h-20 w-20 items-center justify-center rounded-3xl bg-soft">
          <Feather name="mail" size={34} color={colors.primary} />
        </View>
        <AppText weight="bold" className="mt-8 text-3xl">
          Verifique seu e-mail
        </AppText>
        <AppText tone="muted" className="mt-2 text-sm">
          Enviamos um link de recuperação para{' '}
          <AppText weight="semibold" className="text-sm">
            {email.trim()}
          </AppText>
          . Abra o e-mail <AppText weight="semibold" className="text-sm">neste celular</AppText> e toque no link para criar
          uma nova senha.
        </AppText>
        <AppText tone="muted" className="mt-3 text-xs">
          Não achou? Olhe também a caixa de spam.
        </AppText>

        <Button title="Voltar ao login" className="mt-8" onPress={() => router.replace('/login')} />

        <Pressable onPress={sendLink} disabled={seconds > 0 || loading} className="mt-5 items-center" hitSlop={8}>
          <AppText tone={seconds > 0 ? 'muted' : 'primary'} weight="semibold" className="text-sm">
            {seconds > 0 ? `Reenviar link em ${seconds}s` : 'Reenviar link'}
          </AppText>
        </Pressable>
        {error ? (
          <AppText tone="danger" className="mt-3 text-center text-xs">
            {error}
          </AppText>
        ) : null}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout back>
      <AppText weight="bold" className="mt-24 text-3xl">
        Esqueceu a senha?
      </AppText>
      <AppText tone="muted" className="mt-2 text-sm">
        Informe seu e-mail e enviaremos um link para você criar uma nova senha.
      </AppText>

      <View className="mt-8">
        <Input
          label="E-mail"
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={sendLink}
          error={error}
        />
      </View>

      <Button title="Enviar link" className="mt-7" loading={loading} onPress={sendLink} />
    </AuthLayout>
  );
}
