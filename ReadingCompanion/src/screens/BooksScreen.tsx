import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView } from 'react-native';
import LinenBackground from '../components/LinenBackground';
import { theme } from '../theme';
import { BookListItem } from '../components/BookListItem';
import { SectionCard } from '../components/SectionCard';
// Switch to Supabase DAL
import { listBooks as listBooksRemote, deleteBook as deleteBookRemote, Book } from '../data/db';
import { IconPlus, IconReplace } from '../components/icons/TabIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const BooksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [library, setLibrary] = useState<Book[]>([]);
  const [current, setCurrent] = useState<Book | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  async function refreshBooks() {
    const items = await listBooksRemote();
    setLibrary(items);
    setCurrent(items[0] ?? null); // simple current book placeholder
  }

  useEffect(() => {
    refreshBooks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshBooks();
    }, [])
  );

  async function handleLongPress(id: string) {
    Alert.alert('Remove book', 'Remove from library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteBookRemote(id);
          const items = await listBooksRemote();
          setLibrary(items);
          setCurrent(items[0] ?? null);
        },
      },
    ]);
  }

  return (
    <LinenBackground>
      {/* Only respect bottom safe area; we'll paint the top area ourselves */}
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Navy header covering safe area */}
        <SafeAreaView edges={['top']} style={styles.headerBg}>
          <View style={styles.topHeader}> 
            <Text style={styles.screenTitle}>My books</Text>
            <Pressable style={styles.addCircle} onPress={() => navigation.navigate('AddBook')} hitSlop={8}>
              <IconPlus size={20} color="#ffffff" />
            </Pressable>
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={{ paddingBottom: 32}}>
          <View style={styles.sectionWrap}>
            <View style={styles.cardWrap}>
              <SectionCard>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionCardTitle}>current book</Text>
                  {current && (
                    <Pressable onPress={() => setIsSelecting(!isSelecting)} hitSlop={8} style={styles.replaceInlineBtn}>
                      <IconReplace size={22} color={isSelecting ? "#94C4E0" : "#66A0C8"} />
                    </Pressable>
                  )}
                </View>
                {current ? (
                  <BookListItem
                    title={current.title}
                    author={current.author ?? null}
                    coverUrl={current.cover_url ?? null}
                    onLongPress={() => handleLongPress(current.id)}
                  />
                ) : (
                  <Text style={styles.emptyText}>No current book</Text>
                )}
              </SectionCard>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <SectionCard>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionCardTitle}>my library</Text>
              </View>
              {library.map((item) => (
                <BookListItem
                  key={item.id}
                  title={item.title}
                  author={item.author ?? null}
                  coverUrl={item.cover_url ?? null}
                  onLongPress={() => handleLongPress(item.id)}
                  onPress={() => {
                    if (isSelecting) {
                      setCurrent(item);
                      setIsSelecting(false);
                    }
                  }}
                  right={isSelecting ? (
                    <View style={[
                      styles.selectionCircle,
                      current?.id === item.id && styles.selectionCircleActive
                    ]} />
                  ) : undefined}
                />
              ))}
            </SectionCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBg: { backgroundColor: '#0C223B' },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  screenTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  addCircle: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: '#66A0C8',
  },
  sectionWrap: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { color: theme.colors.textPrimary, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: theme.colors.textSecondary },
  sectionCardTitle: { color: theme.colors.textPrimary, fontWeight: '700', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replaceInlineBtn: { padding: 4 },
  cardWrap: { position: 'relative' },
  selectionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#66A0C8',
    backgroundColor: 'transparent',
  },
  selectionCircleActive: {
    backgroundColor: '#66A0C8',
    borderColor: '#66A0C8',
  },
});
