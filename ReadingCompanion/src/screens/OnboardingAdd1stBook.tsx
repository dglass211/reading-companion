import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import LinenBackground from '../components/LinenBackground';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { searchBooks, BookSearchResult, getPopularBooks } from '../services/openLibrary';
import { upsertBook } from '../data/db';
import { useAuth } from '../auth/AuthContext';
import { BookListItem } from '../components/BookListItem';
import { IconPlus } from '../components/icons/TabIcons';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import * as SecureStore from 'expo-secure-store';

const FLAG = 'rc_onboarding_done_v1';

export default function OnboardingAdd1stBook({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [popularBooks, setPopularBooks] = useState<BookSearchResult[]>([]);

  useEffect(() => {
    // Load popular books initially
    (async () => {
      try {
        const popular = await getPopularBooks();
        setPopularBooks(popular);
        setResults(popular);
      } catch {
        setPopularBooks([]);
        setResults([]);
      }
    })();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!debounced) {
        // Show popular books when search is empty
        setResults(popularBooks);
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
  }, [debounced, popularBooks]);

  async function handleAdd(item: BookSearchResult) {
    try {
      await upsertBook({
        title: item.title,
        author: item.author,
        openlibrary_id: item.id,
        cover_url: item.coverUrl ?? null,
      }, { userId: user?.id });
      
      // Mark onboarding as complete and navigate to main app
      await SecureStore.setItemAsync(FLAG, '1');
      navigation.replace('Main');
    } catch (e: any) {
      console.warn('[OnboardingAdd1stBook] upsert failed:', e?.message ?? e);
      alert(`Failed to add book: ${e?.message ?? 'unknown error'}`);
    }
  }

  return (
    <LinenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Add the book you're currently reading</Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#949695" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="search for any book"
              placeholderTextColor="#949695"
              style={styles.searchInput}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#3D3E3D"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} style={styles.clearButton} hitSlop={8}>
                <Ionicons name="close" size={18} color="#949695" />
              </Pressable>
            )}
          </View>
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
          ListEmptyComponent={
            <Text style={styles.emptyText}>No books found. Try another search.</Text>
          }
        />
      </SafeAreaView>
    </LinenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'left',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#0D1B2A',
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 8,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
});