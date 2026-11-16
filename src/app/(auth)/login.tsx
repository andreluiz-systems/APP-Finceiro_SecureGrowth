import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AppText } from '@/components/AppText';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useTheme } from '@/hooks/useTheme';
import { authErrorMessage } from '@/lib/errors';
import { signInWithGoogle } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabase';
import type { TextInputHandle } from '@/types/ui';
import { isValidEmail } from '@/lib/validation';

export default function Login() {
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const { colors } = useTheme();
  const passwordRef = useRef<TextInputHandle>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Informe um e-mail válido.';
    if (!password) next.password = 'Informe sua senha.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setErrors({ form: authErrorMessage(error) });
    // sucesso: o guarda de rotas leva para o app quando a sessão chega
  }

  function handleApple() {
    Alert.alert('Entrar com Apple', 'Esta opção ainda não está disponível. Entre com e-mail e senha ou com o Google.');
  }

  async function handleGoogle() {
    setErrors({});
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    // sucesso: o guarda de rotas leva para o app quando a sessão chega
    if (result.status === 'error') setErrors({ form: result.message });
  }

  return (
    <AuthLayout>
      <View className="mt-4">
        <AppLogo size={80} />
      </View>
      <AppText weight="bold" className="mt-16 text-3xl">
        Bem-vindo de volta
      </AppText>
      <AppText tone="muted" className="mt-1 text-sm">
        Entre para continuar controlando suas finanças
      </AppText>

      {reset ? (
        <View className="mt-5 rounded-2xl bg-success-soft px-4 py-3">
          <AppText tone="success" weight="semibold" className="text-sm">
            Senha alterada! Entre com a nova senha.
          </AppText>
        </View>
      ) : null}

      <View className="mt-8 gap-4">
        <Input
          label="E-mail"
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.email}
        />
        <Input
          ref={passwordRef}
          label="Senha"
          secure
          placeholder="Sua senha"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          error={errors.password}
        />
      </View>

      <Link href="/esqueci-senha" asChild>
        <Pressable className="mt-3 self-end" hitSlop={8}>
          <AppText tone="primary" weight="semibold" className="text-sm">
            Esqueci minha senha
          </AppText>
        </Pressable>
      </Link>

      {errors.form ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {errors.form}
        </AppText>
      ) : null}

      <Button title="Entrar" className="mt-6" loading={loading} onPress={handleLogin} />

      <View className="my-7 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-line" />
        <AppText tone="muted" weight="semibold" className="text-sm">
          ou continue com
        </AppText>
        <View className="h-px flex-1 bg-line" />
      </View>

      <View className="flex-row justify-center gap-10">
        <Pressable
          onPress={handleApple}
          accessibilityRole="button"
          accessibilityLabel="Entrar com Apple"
          className="h-14 w-14 items-center justify-center rounded-full bg-field active:opacity-70">
          <Ionicons name="logo-apple" size={26} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={handleGoogle}
          disabled={googleLoading || loading}
          accessibilityRole="button"
          accessibilityLabel="Entrar com Google"
          accessibilityState={{ busy: googleLoading }}
          className="h-14 w-14 items-center justify-center rounded-full bg-field active:opacity-70">
          {googleLoading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="logo-google" size={24} color={colors.ink} />}
        </Pressable>
      </View>

      <View className="mt-auto flex-row justify-center pt-10">
        <AppText tone="muted" weight="semibold">
          Não tem conta?{' '}
        </AppText>
        <Link href="/cadastro" asChild>
          <Pressable hitSlop={8}>
            <AppText tone="primary" weight="bold">
              Cadastre-se
            </AppText>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}
