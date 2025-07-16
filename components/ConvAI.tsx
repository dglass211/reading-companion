'use dom';

import { useConversation } from '@elevenlabs/react';
import { Mic } from 'lucide-react-native';
import { useCallback, useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, Text, Animated, Easing } from 'react-native';

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.log(error);
    console.error('Microphone permission denied');
    return false;
  }
}


export default function ConvAiDOMComponent({
  dom,
  platform,
}: {
  dom?: import('expo/dom').DOMProps;
  platform: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const conversation = useConversation({
    onConnect: () => console.log('✅ Connected'),
    onDisconnect: () => console.log('🛑 Disconnected'),
    onMessage: (message) => {
      console.log('🧠 AI Message:', message);
    },
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert('No permission');
      return;
    }

    await conversation.startSession({
      agentId: 'agent_01k07seqs5exhrbnnsbeeq10fn',
      dynamicVariables: {
        platform,
      },
    });
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Start/stop pulse animation based on connection status
  useEffect(() => {
    if (conversation.status === 'connected') {
      pulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.current.start();
    } else {
      pulseAnimation.current?.stop();
      scaleAnim.setValue(1);
    }
  }, [conversation.status]);

  return (
    <View {...dom} style={styles.container}>
      <View style={styles.centerGroup}>
        {/* Pulsing circle above button */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        />

        <Pressable
          style={[styles.button, conversation.status === 'connected' && styles.buttonActive]}
          onPress={conversation.status === 'disconnected' ? startConversation : stopConversation}
        >
           <Mic size={24} color="#122F2C" strokeWidth={1.5} />
           <Text style={styles.buttonText}>finished reading ch 3</Text>
        </Pressable>
      </View>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centerGroup: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 200,
  },
  buttonActive: {
    backgroundColor: '#EF4444',
  },
  pulseCircle: {
    width: 180,
    height: 180,
    borderRadius: 300,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignSelf: 'center',
    marginTop: 112,
    marginBottom: 200,
  },
  buttonText: {
    color: '#122F2C',
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'EBGaramond_500Medium',
    marginLeft: 8,
  },
});
