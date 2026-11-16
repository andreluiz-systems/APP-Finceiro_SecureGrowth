import { Feather } from '@expo/vector-icons';
import { Image, View } from 'react-native';

type Props = { uri?: string | null; size?: number };

/** Foto de perfil redonda; sem foto, mostra o ícone de pessoa sobre o roxo. */
export function Avatar({ uri, size = 88 }: Props) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden border-2 border-soft bg-primary">
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} accessibilityLabel="Foto de perfil" />
      ) : (
        <Feather name="user" size={Math.round(size * 0.45)} color="#FFFFFF" />
      )}
    </View>
  );
}
