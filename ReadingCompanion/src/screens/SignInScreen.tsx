import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, Platform, Image } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple, signInWithGoogle } from '../auth/auth';
import { useAuth } from '../auth/AuthContext';

export default function SignInScreen() {
  const { setUser } = useAuth();
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ok = await AppleAuthentication.isAvailableAsync();
        if (mounted) setAppleAvailable(ok);
      } catch {
        if (mounted) setAppleAvailable(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onApple() {
    try {
      setBusy('apple');
      const u = await signInWithApple();
      setUser(u);
    } catch (e: any) {
      Alert.alert('Apple Sign In', e?.message ?? 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle() {
    try {
      setBusy('google');
      const u = await signInWithGoogle();
      setUser(u);
    } catch (e: any) {
      Alert.alert('Google Sign In', e?.message ?? 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: 'white', fontSize: 22, marginBottom: 16 }}>Welcome</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 28 }}>
        Sign in to sync your books and notes across devices.
      </Text>

      {Platform.OS === 'ios' && appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={10}
          style={{ width: 260, height: 44, marginBottom: 12, opacity: busy === 'apple' ? 0.6 : 1 }}
          onPress={onApple}
        />
      )}

      <Pressable
        onPress={onGoogle}
        disabled={!!busy}
        style={{
          width: 260,
          height: 44,
          borderRadius: 10,
          backgroundColor: 'white',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Image
          source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
          style={{ width: 18, height: 18, marginRight: 8 }}
        />
        <Text style={{ color: '#333', fontSize: 15 }}>Sign in with Google</Text>
      </Pressable>

      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 16 }}>
        By continuing you agree to our Terms & Privacy.
      </Text>
    </View>
  );
}


