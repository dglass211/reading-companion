import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView } from 'react-native';
import { LinenBackground } from '../components/LinenBackground';
import { theme } from '../theme';
import { BookListItem } from '../components/BookListItem';
import { SectionCard } from '../components/SectionCard';
import { getCurrentBook, listBooks, removeBook, setCurrentBook } from '../data/booksDal';
import { IconPlus, IconReplace } from '../components/icons/TabIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const BooksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [library, setLibrary] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);

  async function refreshBooks() {
    const items = await listBooks();
    setLibrary(items);
    const cur = await getCurrentBook();
    setCurrent(cur);
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
          await removeBook(id);
          const items = await listBooks();
          setLibrary(items);
          const cur = await getCurrentBook();
          setCurrent(cur);
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
            <Text style={styles.sectionTitle}>current book</Text>
            <View style={styles.cardWrap}>
              <SectionCard>
                {current ? (
                  <BookListItem
                    title={current.title}
                    author={current.author}
                    coverUrl={current.coverUrl}
                    onLongPress={() => handleLongPress(current.id)}
                  />
                ) : (
                  <Text style={styles.emptyText}>No current book</Text>
                )}
              </SectionCard>
              {current && (
                <Pressable onPress={() => navigation.navigate('AddBook')} style={styles.replaceBtn} hitSlop={6}>
                  <IconReplace size={18} color="#66A0C8" />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>my library</Text>
            <SectionCard>
              {library.map((item) => (
                <BookListItem
                  key={item.id}
                  title={item.title}
                  author={item.author}
                  coverUrl={item.coverUrl}
                  onLongPress={() => handleLongPress(item.id)}
                  onPress={async () => {
                    await setCurrentBook(item.id);
                    const cur = await getCurrentBook();
                    setCurrent(cur);
                  }}
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
  replaceBtn: {
    position: 'absolute',
    right: 24,
    top: 32 + 12 + 44, // header top (32) + header bottom padding (12) + approx title height
  },
  cardWrap: { position: 'relative' },
});
