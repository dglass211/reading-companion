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
import OnboardingPurpose1 from './src/screens/OnboardingPurpose1';
import OnboardingPurpose2 from './src/screens/OnboardingPurpose2';
import OnboardingAdd1stBook from './src/screens/OnboardingAdd1stBook';
import * as SecureStore from 'expo-secure-store';

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
  const [onboardChecked, setOnboardChecked] = React.useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const v = await SecureStore.getItemAsync('rc_onboarding_done_v1');
        if (!mounted) return;
        setShouldShowOnboarding(!v);
      } catch {
        setShouldShowOnboarding(true);
      } finally {
        setOnboardChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

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
      ) : !onboardChecked ? (
        <Stack.Screen name="Loading" component={() => null as any} />
      ) : shouldShowOnboarding ? (
        <>
          <Stack.Screen name="OnboardingPurpose1" component={OnboardingPurpose1} />
          <Stack.Screen name="OnboardingPurpose2" component={OnboardingPurpose2} />
          <Stack.Screen name="OnboardingAdd1stBook" component={OnboardingAdd1stBook} />
          {/* Register Main here too so replace('Main') works from OnboardingAdd1stBook */}
          <Stack.Screen name="Main" component={Tabs} />
        </>
      ) : (
        <>
          <Stack.Screen name="OnboardingPurpose1" component={OnboardingPurpose1} />
          <Stack.Screen name="OnboardingPurpose2" component={OnboardingPurpose2} />
          <Stack.Screen name="OnboardingAdd1stBook" component={OnboardingAdd1stBook} />
          <Stack.Screen name="Main" component={Tabs} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
