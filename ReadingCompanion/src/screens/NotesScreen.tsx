import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, StyleSheet, Text, TextInput, View, Pressable, Platform } from 'react-native';
import { LinenBackground } from '../components/LinenBackground';
import { theme } from '../theme';
import { listNotes, upsertNote, NoteRow } from '../data/notesDal';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteEditor } from '../components/notes/NoteEditor';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

//

export const NotesScreen: React.FC = () => {
  const [q, setQ] = useState('');
  const [book, setBook] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [items, setItems] = useState<NoteRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editor, setEditor] = useState<{ visible: boolean; note: NoteRow | null }>({ visible: false, note: null });

  async function refresh() {
    const rows = await listNotes({ q, book, chapter });
    setItems(rows);
  }

  useEffect(() => { refresh(); }, [q, book, chapter]);

  const books = useMemo(() => Array.from(new Set(items.map(i => i.bookTitle).filter(Boolean))) as string[], [items]);

  async function handleSave(n: NoteRow) {
    await upsertNote(n);
    setEditor({ visible: false, note: null });
    refresh();
  }

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function exportSelected() {
    const sel = items.filter(i => selected[i.id]);
    if (sel.length === 0) return;
    const lines = sel.map(i => `_${i.title}_\n${i.body}\n[${i.bookTitle ?? ''}] [${i.author ?? ''}] [Ch ${i.chapterNumber ?? ''}]\n\n`).join('');
    const path = FileSystem.cacheDirectory + `notes-export-${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(path, lines, { encoding: FileSystem.EncodingType.UTF8 });
    if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(path, { mimeType: 'text/plain', dialogTitle: 'Export notes' });
    }
  }

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Notes</Text>
      <TextInput
        placeholder="search your notes"
        placeholderTextColor={theme.colors.tabInactive}
        value={q}
        onChangeText={setQ}
        style={styles.search}
      />
      <View style={styles.filters}>
        <View style={styles.dropdown}>
          <Text style={styles.filterLabel}>Book:</Text>
          <TextInput
            placeholder="Any"
            value={book ?? ''}
            onChangeText={(t)=> setBook(t.length? t : null)}
            placeholderTextColor={theme.colors.tabInactive}
            style={styles.filterInput}
          />
        </View>
        <View style={styles.dropdown}>
          <Text style={styles.filterLabel}>Chapter:</Text>
          <TextInput
            placeholder="Any"
            value={chapter?.toString() ?? ''}
            onChangeText={(t)=> setChapter(t? Number(t) : null)}
            keyboardType="number-pad"
            placeholderTextColor={theme.colors.tabInactive}
            style={styles.filterInput}
          />
        </View>
        <Pressable onPress={exportSelected} style={styles.exportBtn}><Text style={styles.exportText}>Export selected</Text></Pressable>
      </View>
    </View>
  );

  return (
    <LinenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <NoteCard
              {...item}
              selected={!!selected[item.id]}
              onLongPress={() => toggleSelect(item.id)}
              onPress={() => setEditor({ visible: true, note: item })}
            />
          )}
        />
        <NoteEditor
          visible={editor.visible}
          initial={editor.note && { id: editor.note.id, title: editor.note.title, body: editor.note.body, bookTitle: editor.note.bookTitle, author: editor.note.author, chapterNumber: editor.note.chapterNumber, tags: editor.note.tags }}
          onClose={() => setEditor({ visible: false, note: null })}
          onSave={(data) => handleSave({
            id: data.id,
            title: data.title,
            body: data.body,
            bookTitle: data.bookTitle ?? null,
            author: data.author ?? null,
            chapterNumber: data.chapterNumber ?? null,
            tags: data.tags ?? '',
            createdAt: Date.now()/1000,
            updatedAt: Date.now()/1000,
          })}
        />
      </SafeAreaView>
    </LinenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  search: { backgroundColor: '#fff', borderRadius: 24, height: 44, paddingHorizontal: 16, color: '#0D1B2A' },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  dropdown: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLabel: { color: theme.colors.textSecondary },
  filterInput: { width: 120, height: 36, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, color: '#0D1B2A' },
  exportBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  exportText: { color: theme.colors.textPrimary, fontWeight: '600' },
});
