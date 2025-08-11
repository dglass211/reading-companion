import React, { useState } from 'react';
import { Modal, View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { theme } from '../../theme';

interface Props {
  visible: boolean;
  initial: { id: string; title: string; body: string; bookTitle?: string | null; author?: string | null; chapterNumber?: number | null; tags?: string } | null;
  onClose: () => void;
  onSave: (data: { id: string; title: string; body: string; bookTitle?: string | null; author?: string | null; chapterNumber?: number | null; tags?: string }) => void;
}

export const NoteEditor: React.FC<Props> = ({ visible, initial, onClose, onSave }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');

  React.useEffect(()=>{ setTitle(initial?.title ?? ''); setBody(initial?.body ?? ''); },[initial?.id, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <TextInput placeholder="title (italic line)" placeholderTextColor={theme.colors.tabInactive} value={title} onChangeText={setTitle} style={styles.title} />
          <TextInput placeholder="body" placeholderTextColor={theme.colors.tabInactive} value={body} onChangeText={setBody} style={styles.body} multiline />
          <View style={styles.row}>
            <Pressable onPress={onClose} style={[styles.btn,{backgroundColor:'transparent', borderColor: theme.colors.border, borderWidth: 1}]}><Text style={styles.btnText}>Cancel</Text></Pressable>
            <Pressable onPress={()=> initial && onSave({ ...initial, title, body })} style={styles.btn}><Text style={styles.btnText}>Save</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  sheet: { width: '90%', backgroundColor: 'rgba(6,27,61,0.96)', borderRadius: 16, padding: 16 },
  title: { color:'#fff', fontStyle:'italic', borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:theme.colors.border, marginBottom:8 },
  body: { color:'#fff', minHeight:120, textAlignVertical:'top' },
  row: { flexDirection:'row', justifyContent:'flex-end', marginTop:12, gap:12 },
  btn: { backgroundColor: theme.colors.primary, paddingHorizontal:14, paddingVertical:8, borderRadius:12 },
  btnText: { color:'#fff', fontWeight:'600' },
});
