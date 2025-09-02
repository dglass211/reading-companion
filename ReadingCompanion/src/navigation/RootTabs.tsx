import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BooksScreen } from '../screens/BooksScreen';
import { VoiceScreen } from '../screens/VoiceScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { AddBookScreen } from '../screens/AddBookScreen';
import { theme } from '../theme';
import { IconBooks, IconMic, IconNotes, IconProfile } from '../components/icons/TabIcons';
import { useAuth } from '../auth/AuthContext';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import LinenBackground from '../components/LinenBackground';

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
          title: '',
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
          title: '',
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
          title: '',
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
          title: '',
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
    <LinenBackground>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0C223B' }} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <View style={{ backgroundColor: '#0C223B' }}>
          <View style={{
            paddingHorizontal: 16,
            paddingTop: 32,
            paddingBottom: 12,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}>
            <Text style={{
              color: theme.colors.textPrimary,
              fontSize: 22,
              fontWeight: '800',
            }}>Account</Text>
          </View>
        </View>
        
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
          <View style={{
            backgroundColor: '#0F2845',
            borderRadius: 16,
            padding: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}>
            <Text style={{ 
              color: theme.colors.textSecondary, 
              fontSize: 14,
              marginBottom: 8 
            }}>
              Signed in as
            </Text>
            <Text style={{ 
              color: theme.colors.textPrimary, 
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 20 
            }}>
              {user?.email ?? user?.name ?? 'User'}
            </Text>
            
            <Pressable
              onPress={signOut}
              style={({ pressed }) => [{
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: '#66A0C8',
                borderRadius: 24,
                alignSelf: 'flex-start',
              }, pressed && { opacity: 0.85 }]}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinenBackground>
  );
}
