import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { normalize } from '@/lib/summary';
import { useCategoryPickerStore } from '@/store/categoryPicker';
import type { Category } from '@/types/database';

type Filter = 'all' | 'income' | 'expense';

/**
 * Catálogo de categorias. Não é uma tela do menu: abre a partir de qualquer tela que precise
 * de categoria (transação, lembrete, meta) e devolve a escolha para ela (veja useCategoryPicker).
 */
export default function Categorias() {
  const { target, kind, selected } = useLocalSearchParams<{ target?: string; kind?: string; selected?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const pick = useCategoryPickerStore((s) => s.pick);
  const { data: categories = [], isLoading, isError, error, refetch } = useCategories();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(kind === 'income' || kind === 'expense' ? kind : 'all');

  const list = useMemo(() => {
    const q = normalize(query);
    return categories.filter((c) => {
      if (filter === 'income' && c.kind === 'expense') return false;
      if (filter === 'expense' && c.kind === 'income') return false;
      return !q || normalize(c.name).includes(q);
    });
  }, [categories, filter, query]);

  function choose(category: Category) {
    pick(target ?? 'default', category);
    router.back();
  }

  const kindLabel = (k: Category['kind']) => (k === 'income' ? 'Receita' : k === 'expense' ? 'Despesa' : 'Receita e despesa');

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-bg">
      <View className="px-5">
        <ScreenHeader title="Categorias" />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Pesquisar" />
        <View className="mb-2 mt-4 flex-row gap-2">
          <Chip label="Todas" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Receitas" selected={filter === 'income'} onPress={() => setFilter('income')} />
          <Chip label="Despesas" selected={filter === 'expense'} onPress={() => setFilter('expense')} />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState
          icon="alert-circle"
          title="Não foi possível carregar"
          message={dataErrorMessage(error)}
          actionLabel="Tentar de novo"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="Nenhuma categoria encontrada"
              message={categories.length === 0 ? 'Rode o arquivo SQL no Supabase para criar as categorias padrão.' : 'Tente outra busca.'}
            />
          }
          renderItem={({ item }) => {
            const active = item.id === selected;
            return (
              <Pressable
                onPress={() => choose(item)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                accessibilityState={{ selected: active }}
                className={`mt-2.5 h-14 flex-row items-center rounded-2xl border px-3 active:opacity-70 ${
                  active ? 'border-primary bg-soft' : 'border-line bg-card'
                }`}>
                <CategoryIcon name={item.icon} size={38} />
                <View className="ml-3 flex-1">
                  <AppText weight="semibold" className="text-base">
                    {item.name}
                  </AppText>
                  {filter === 'all' ? (
                    <AppText tone="muted" className="text-xs">
                      {kindLabel(item.kind)}
                    </AppText>
                  ) : null}
                </View>
                {active ? (
                  <Feather name="check" size={20} color={colors.primary} />
                ) : (
                  <Feather name="chevron-right" size={20} color={colors.muted} />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
