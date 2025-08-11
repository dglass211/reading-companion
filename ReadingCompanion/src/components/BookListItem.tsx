import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { BookCover } from './BookCover';
import { theme } from '../theme';

interface Props {
  title: string;
  author: string | null;
  coverUrl: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
  right?: React.ReactNode;
}

export const BookListItem: React.FC<Props> = ({ title, author, coverUrl, onPress, onLongPress, right }) => {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <BookCover size={40} uri={coverUrl ?? undefined} title={title} />
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!author && (
          <Text style={styles.author} numberOfLines={1}>by {author}</Text>
        )}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  meta: { marginLeft: 12, flex: 1 },
  right: { marginLeft: 8 },
  title: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  author: {
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
