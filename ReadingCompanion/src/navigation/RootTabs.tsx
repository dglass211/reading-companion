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
import { IconBooks, IconMic, IconNotes } from '../components/icons/TabIcons';
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
        tabBarStyle: { backgroundColor: 'rgba(0,0,0,0.2)', borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tab.Screen
        name="Books"
        component={BooksStack}
        options={{
          title: 'Books',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <IconBooks size={24} color={focused ? theme.colors.textPrimary : theme.colors.tabInactive} />
          ),
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceScreen}
        options={{
          title: 'Voice',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <IconMic size={24} color={focused ? theme.colors.textPrimary : theme.colors.tabInactive} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          title: 'Notes',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <IconNotes size={24} color={focused ? theme.colors.textPrimary : theme.colors.tabInactive} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ color: focused ? theme.colors.textPrimary : theme.colors.tabInactive }}>⚙︎</Text>
          ),
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
