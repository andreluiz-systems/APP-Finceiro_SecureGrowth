import { Redirect } from 'expo-router';

/**
 * Endereço de retorno do login com Google. A sessão é criada por signInWithGoogle();
 * esta rota só existe para o app não mostrar "página não encontrada" quando o sistema abre o link.
 */
export default function EntrarGoogle() {
  return <Redirect href="/" />;
}
