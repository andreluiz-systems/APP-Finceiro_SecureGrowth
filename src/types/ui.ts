import type { ComponentRef } from 'react';
import type { TextInput } from 'react-native';

/** Tipo da referência de um TextInput (usado para pular de um campo para outro). */
export type TextInputHandle = ComponentRef<typeof TextInput>;
