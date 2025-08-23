import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import LinenBackground from '../components/LinenBackground';
import { theme } from '../theme';
import { listNotesByBook, Note } from '../data/db';
import { NoteCard } from '../components/notes/NoteCard';
import { IconRefresh } from '../components/icons/TabIcons';
import { NoteEditor } from '../components/notes/NoteEditor';
// export/share removed per requirements

//

export const NotesScreen: React.FC = () => {
  const [q, setQ] = useState('');
  // removed dedicated filters; one search field handles all
  const [items, setItems] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editor, setEditor] = useState<{ visible: boolean; note: Note | null }>({ visible: false, note: null });
  const [seeded, setSeeded] = useState(false);

  async function refresh() {
    // Supabase notes listing; basic search can be added with ilike filters later
    const rows = await listNotesByBook();
    setItems(rows);
  }

  useEffect(() => { refresh(); }, [q]);
  useFocusEffect(useCallback(() => { refresh(); }, []));


  async function handleSave() {}

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function exportSelected() {}

  const header = (
    <View>
      <View style={styles.topHeaderWrap}>
        <View style={styles.topHeader}>
          <Text style={styles.topHeaderTitle}>Notes</Text>
          <Pressable onPress={refresh} hitSlop={8} style={styles.refreshBtn}>
            <IconRefresh size={22} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <TextInput
            placeholder="search your notes"
            placeholderTextColor="#949695"
            value={q}
            onChangeText={setQ}
            style={styles.search}
          />
        </View>
      </View>
    </View>
  );

  return (
    <LinenBackground>
      {/* Paint the status bar safe area to match header */}
      <SafeAreaView edges={['top']} style={styles.topSafe} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={header}
          ListHeaderComponentStyle={{ paddingHorizontal: 0, marginBottom: 16 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const title = item.topic ?? item.question_type ?? 'Note';
            const body = item.content;
            const createdAt = item.created_at ? Math.floor(new Date(item.created_at).getTime() / 1000) : Math.floor(Date.now() / 1000);
            const chapterNumber = (() => {
              const m = (item.chapter ?? '').match(/\d+/);
              return m ? Number(m[0]) : undefined;
            })();
            return (
              <View style={{ paddingHorizontal: 16 }}>
                <NoteCard
                  id={item.id}
                  title={title}
                  body={body}
                  createdAt={createdAt}
                  chapterNumber={chapterNumber}
                  selected={!!selected[item.id]}
                  onLongPress={() => toggleSelect(item.id)}
                  onPress={() => {}}
                />
              </View>
            );
          }}
        />
        {/* Editor disabled for auto-saved Q&A notes; keep component available if needed later */}
      </SafeAreaView>
    </LinenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSafe: { backgroundColor: '#0C223B' },
  topHeaderWrap: { backgroundColor: '#0C223B' },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  refreshBtn: { justifyContent: 'center', alignItems: 'center' },
  topHeaderTitle: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800' },
  search: { backgroundColor: '#fff', borderRadius: 24, height: 44, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8, color: '#0D1B2A' },
  bookHeader: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 16, paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  // filters & export styles removed
});
