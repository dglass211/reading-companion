import ConvAiDOMComponent from './components/ConvAI';
import { SafeAreaView, Platform, StyleSheet, Text, View } from 'react-native';
import { useFonts, EBGaramond_500Medium } from '@expo-google-fonts/eb-garamond';
import { Video, ResizeMode } from 'expo-av';

export default function App() {
  const [fontsLoaded] = useFonts({
    EBGaramond_500Medium,
  });

  if (!fontsLoaded) {
    return null; // Optionally render a loading placeholder
  }

  return (
    <View style={styles.fullScreen}>
      <Video
        source={require('./assets/oceanSurface.mp4')}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
        rate={0.9}
      />

      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <ConvAiDOMComponent
          dom={{ style: styles.dom }}
          platform={Platform.OS}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    opacity: 0.2,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    color: 'white',
    marginBottom: 16,
    fontSize: 16,
  },
  dom: {
    width: 350,
    height: 300,
    justifyContent: 'center',
    alignItems:  'center',
    alignSelf: 'center',     // horizontal centring
  },
});
