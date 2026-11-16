import * as ImagePicker from 'expo-image-picker';

/** Abre a galeria para escolher uma foto quadrada. Devolve o endereço da imagem ou null se cancelar. */
export async function pickSquarePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0].uri;
}
