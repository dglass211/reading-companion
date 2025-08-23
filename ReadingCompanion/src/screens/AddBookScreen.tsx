import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import LinenBackground from '../components/LinenBackground';
import { SearchBar } from '../components/SearchBar';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { searchBooks, BookSearchResult } from '../services/openLibrary';
import { upsertBook } from '../data/db';
import { useAuth } from '../auth/AuthContext';
import { BookListItem } from '../components/BookListItem';
import { IconBack, IconPlus } from '../components/icons/TabIcons';
import { useNavigation } from '@react-navigation/native';

export const AddBookScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const [results, setResults] = useState<BookSearchResult[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!debounced) {
        setResults([]);
        return;
      }
      try {
        const res = await searchBooks(debounced);
        if (active) setResults(res);
      } catch {
        if (active) setResults([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [debounced]);

  async function handleAdd(item: BookSearchResult) {

    try {
      await upsertBook({
        title: item.title,
        author: item.author,
        openlibrary_id: item.id,
        cover_url: item.coverUrl ?? null,
      }, { userId: user?.id });
      navigation.goBack();
    } catch (e: any) {
      console.warn('[AddBook] upsert failed:', e?.message ?? e);
      // Fallback UX: notify and keep user on screen
      // eslint-disable-next-line no-alert
      alert(`Failed to add book: ${e?.message ?? 'unknown error'}`);
    }
  }

  return (
    <LinenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <IconBack size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Add book</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
          <SearchBar value={query} onChange={setQuery} placeholder="book title or author" />
        </View>

        <FlatList
          data={results}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <BookListItem
              title={item.title}
              author={item.author}
              coverUrl={item.coverUrl}
              onPress={() => handleAdd(item)}
              right={<IconPlus size={20} color="#66A0C8" />}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        />
      </SafeAreaView>
    </LinenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingTop: 32,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});


