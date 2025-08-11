import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<Props> = ({ value, onChange, placeholder }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={theme.colors.border} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.tabInactive}
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} style={styles.clear} hitSlop={8}>
          <Ionicons name="close" size={18} color={theme.colors.border} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    color: '#0D1B2A',
    fontSize: 16,
  },
  clear: {
    marginLeft: 8,
  },
});
