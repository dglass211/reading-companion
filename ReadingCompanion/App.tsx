import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Tabs } from './src/navigation/RootTabs';
import LinenBackground from './src/components/LinenBackground';
import { initDb } from './src/data/sqlite';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import SignInScreen from './src/screens/SignInScreen';

export default function App() {
  useEffect(() => {
    initDb();
  }, []);
  return (
    <View style={styles.container}>
      <LinenBackground>
        <AuthProvider>
          <NavigationContainer>
            <InnerRoot />
          </NavigationContainer>
        </AuthProvider>
      </LinenBackground>
      <StatusBar style="light" />
    </View>
  );
}

const Stack = createNativeStackNavigator();

function InnerRoot() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="SignIn">
          {() => (
            <LinenBackground>
              <SignInScreen />
            </LinenBackground>
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Main" component={Tabs} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
