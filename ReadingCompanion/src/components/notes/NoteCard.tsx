import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../theme';

export interface NoteCardProps {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  chapterNumber?: number | null;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

function formatDate(ts: number): string {
  try {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export const NoteCard: React.FC<NoteCardProps> = ({ id, title, body, createdAt, chapterNumber, selected, onPress, onLongPress }) => {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }, selected && styles.selected] }>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.body} numberOfLines={6}>{body}</Text>
      <View style={styles.chipsRow}>
        <Text style={styles.chip}>{formatDate(createdAt)}</Text>
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
    marginVertical: 6,
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
