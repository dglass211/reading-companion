import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../theme';

export interface NoteCardProps {
  id: string;
  title: string;
  body: string;
  bookTitle?: string | null;
  author?: string | null;
  chapterNumber?: number | null;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ id, title, body, bookTitle, author, chapterNumber, selected, onPress, onLongPress }) => {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }, selected && styles.selected] }>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.body} numberOfLines={6}>{body}</Text>
      <View style={styles.chipsRow}>
        {!!bookTitle && <Text style={styles.chip}>{bookTitle}</Text>}
        {!!author && <Text style={styles.chip}>{author}</Text>}
        {chapterNumber != null && <Text style={styles.chip}>{`Ch ${chapterNumber}`}</Text>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  selected: { borderColor: theme.colors.primary },
  title: {
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  body: { color: theme.colors.textSecondary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: theme.colors.textPrimary,
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 12,
  },
});
