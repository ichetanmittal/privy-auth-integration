import { usePrivy } from '@privy-io/expo';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { isReady, user } = usePrivy();
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  console.log('Privy Status:', { isReady, user });

  // Add timeout to detect if Privy is stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.log('Privy initialization timeout - this might be expected in development');
        setShowTimeoutMessage(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isReady]);

  // Wait for Privy to be ready before rendering main content
  if (!isReady) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>
          {showTimeoutMessage ? 'Privy taking longer than expected...' : 'Initializing Privy...'}
        </ThemedText>
        <ThemedText style={styles.debugText}>isReady: {String(isReady)}</ThemedText>
        <ThemedText style={styles.debugText}>User: {user ? 'Present' : 'None'}</ThemedText>
        {showTimeoutMessage && (
          <>
            <ThemedText style={styles.debugText}>⚠️ Development Mode Detected</ThemedText>
            <ThemedText style={styles.debugText}>Privy may not initialize in dev</ThemedText>
          </>
        )}
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Privy App!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Privy Status</ThemedText>
        <ThemedText>
          Authentication Status: <ThemedText type="defaultSemiBold">{user ? 'Authenticated' : 'Not Authenticated'}</ThemedText>
        </ThemedText>
        {user && (
          <ThemedText>
            User ID: <ThemedText type="defaultSemiBold">{user.id}</ThemedText>
          </ThemedText>
        )}
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  debugText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
