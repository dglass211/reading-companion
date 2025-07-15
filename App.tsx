import { SafeAreaView, Platform, StyleSheet } from 'react-native';
import ConvAiDOMComponent from './components/ConvAI';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ConvAiDOMComponent platform={Platform.OS} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
