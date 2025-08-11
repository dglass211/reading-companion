import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { RootNavigation } from './src/navigation/RootTabs';
import { LinenBackground } from './src/components/LinenBackground';
import { initDb } from './src/data/sqlite';

export default function App() {
  useEffect(() => {
    initDb();
  }, []);
  return (
    <View style={styles.container}>
      <LinenBackground>
        <RootNavigation />
      </LinenBackground>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
