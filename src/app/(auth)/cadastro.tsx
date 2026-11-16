import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { uploadAvatar } from '@/lib/avatar';
import { authErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { TextInputHandle } from '@/types/ui';
import { isValidEmail, passwordError } from '@/lib/validation';

type Errors = { name?: string; email?: string; confirmEmail?: string; password?: string; form?: string };

export default function Cadastro() {
  const router = useRouter();
  const emailRef = useRef<TextInputHandle>(null);
  const confirmRef = useRef<TextInputHandle>(null);
  const passwordRef = useRef<TextInputHandle>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  async function handleSignUp() {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Informe seu nome completo.';
    if (!isValidEmail(email)) next.email = 'Informe um e-mail válido.';
    if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase())
      next.confirmEmail = 'Os e-mails não são iguais.';
    const pwd = passwordError(password);
    if (pwd) next.password = pwd;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });

    if (error) {
      setLoading(false);
      setErrors({ form: authErrorMessage(error) });
      return;
    }

    if (data.session && data.user) {
      if (photo) await uploadAvatar(data.user.id, photo).catch(() => null); // a foto é opcional: se falhar, o cadastro segue
      setLoading(false);
      // o guarda de rotas leva para o app
    } else {
      setLoading(false);
      Alert.alert('Conta criada!', 'Enviamos um e-mail para confirmar seu cadastro. Depois é só entrar.');
      router.replace('/login');
    }
  }

  return (
    <AuthLayout back>
      <View className="items-center">
        <Pressable
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel="Adicionar foto de perfil"
          className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary/50">
          {photo ? (
            <Image source={{ uri: photo }} className="h-full w-full" />
          ) : (
            <Feather name="plus" size={32} color="#FFFFFF" />
          )}
        </Pressable>
        <AppText tone="primary" weight="semibold" className="mt-2 text-xs">
          Adicionar foto de perfil
        </AppText>
      </View>

      <AppText weight="bold" className="mt-10 text-3xl">
        Cadastre-se
      </AppText>
      <AppText tone="muted" className="mt-1 text-sm">
        Leva menos de um minuto pra começar
      </AppText>

      <View className="mt-7 gap-4">
        <Input
          label="Nome completo"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          value={name}
          onChangeText={setName}
          onSubmitEditing={() => emailRef.current?.focus()}
          error={errors.name}
        />
        <Input
          ref={emailRef}
          label="E-mail"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => confirmRef.current?.focus()}
          error={errors.email}
        />
        <Input
          ref={confirmRef}
          label="Confirmar e-mail"
          keyboardType="email-address"
          returnKeyType="next"
          value={confirmEmail}
          onChangeText={setConfirmEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.confirmEmail}
        />
        <Input
          ref={passwordRef}
          label="Senha"
          secure
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleSignUp}
          error={errors.password}
        />
      </View>

      {errors.form ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {errors.form}
        </AppText>
      ) : null}

      <Button title="Criar Conta" className="mt-7" loading={loading} onPress={handleSignUp} />

      <View className="mt-auto flex-row justify-center pt-8">
        <AppText tone="muted" weight="semibold">
          Já tem conta?{' '}
        </AppText>
        <Link href="/login" asChild>
          <Pressable hitSlop={8}>
            <AppText tone="primary" weight="bold">
              Entrar
            </AppText>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}
