import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BooksScreen } from '../screens/BooksScreen';
import { VoiceScreen } from '../screens/VoiceScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { AddBookScreen } from '../screens/AddBookScreen';
import { theme } from '../theme';
import { IconBooks, IconMic, IconNotes, IconProfile } from '../components/icons/TabIcons';
import { useAuth } from '../auth/AuthContext';
import { View, Text, Pressable } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: theme.colors.backgroundDeepBlue,
    primary: theme.colors.primary,
    text: theme.colors.textPrimary,
    border: theme.colors.border,
    notification: theme.colors.primary,
  },
};

function BooksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BooksHome" component={BooksScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { color: theme.colors.textPrimary },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginHorizontal: 16,
          paddingTop: 4,
          // Absolute + transparent so no second background shows through
          position: 'absolute',
          left: 0,
          right: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
        ),
        tabBarActiveTintColor: '#2D2E2D',
        tabBarInactiveTintColor: '#6A6B6A',
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tab.Screen
        name="Books"
        component={BooksStack}
        options={{
          title: 'Books',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconBooks size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceScreen}
        options={{
          title: 'Voice',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconMic size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          title: 'Notes',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconNotes size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconProfile size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigation() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator>
          <Stack.Screen
            name="Root"
            component={Tabs}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function AccountScreen() {
  const { user, signOut } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: theme.colors.textPrimary, marginBottom: 12 }}>
        {user ? `Signed in as ${user.email ?? user.name ?? user.id}` : 'Not signed in'}
      </Text>
      <Pressable
        onPress={signOut}
        style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 8 }}
      >
        <Text style={{ color: '#333' }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
