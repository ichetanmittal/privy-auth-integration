import { useEmbeddedEthereumWallet, useLoginWithEmail, usePrivy } from '@privy-io/expo';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { isReady, user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { wallets } = useEmbeddedEthereumWallet();
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  
  // Email login state
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Wallet state
  const [walletAddress, setWalletAddress] = useState('');
  const [signature, setSignature] = useState('');

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

  // Handle sending OTP code
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await sendCode({ email });
      setCodeSent(true);
      Alert.alert('Success', 'OTP code sent to your email!');
    } catch (error) {
      console.error('Send code error:', error);
      Alert.alert('Error', 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logging in with OTP code
  const handleLogin = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }
    
    setIsLoading(true);
    try {
      await loginWithCode({ code, email });
      Alert.alert('Success', 'Logged in successfully!');
      setCodeSent(false);
      setEmail('');
      setCode('');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setCodeSent(false);
      setEmail('');
      setCode('');
      Alert.alert('Success', 'Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get wallet address
  const getWalletAddress = async () => {
    if (!wallets || wallets.length === 0) {
      Alert.alert('Error', 'No embedded wallet found');
      return;
    }

    try {
      const provider = await wallets[0].getProvider();
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });
      setWalletAddress(accounts[0]);
      Alert.alert('Success', `Wallet Address: ${accounts[0]}`);
    } catch (error) {
      console.error('Get address error:', error);
      Alert.alert('Error', 'Failed to get wallet address');
    }
  };

  // Sign a message
  const signMessage = async () => {
    if (!wallets || wallets.length === 0) {
      Alert.alert('Error', 'No embedded wallet found');
      return;
    }

    if (!walletAddress) {
      Alert.alert('Error', 'Please get wallet address first');
      return;
    }

    try {
      const provider = await wallets[0].getProvider();
      const message = 'Hello from Privy React Native!';
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });
      setSignature(signature);
      Alert.alert('Success', `Message signed! Signature: ${signature.substring(0, 20)}...`);
    } catch (error) {
      console.error('Sign message error:', error);
      Alert.alert('Error', 'Failed to sign message');
    }
  };

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
        <ThemedText type="subtitle">Privy Authentication</ThemedText>
        <ThemedText>
          Status: <ThemedText type="defaultSemiBold">{user ? 'Authenticated' : 'Not Authenticated'}</ThemedText>
        </ThemedText>
        {user && (
          <>
            <ThemedText>
              User ID: <ThemedText type="defaultSemiBold">{user.id}</ThemedText>
            </ThemedText>
            {wallets && wallets.length > 0 && (
              <ThemedText>
                Embedded Wallets: <ThemedText type="defaultSemiBold">{wallets.length} found</ThemedText>
              </ThemedText>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <ThemedText style={styles.buttonText}>Logout</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>

      {!user && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Email Login</ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!codeSent && !isLoading}
          />
          
          {codeSent && (
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Enter OTP code"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              editable={!isLoading}
            />
          )}

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={codeSent ? handleLogin : handleSendCode}
            disabled={isLoading}
          >
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Loading...' : (codeSent ? 'Login with Code' : 'Send OTP Code')}
            </ThemedText>
          </TouchableOpacity>

          {codeSent && (
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => {
                setCodeSent(false);
                setCode('');
              }}
            >
              <ThemedText style={styles.secondaryButtonText}>Back to Email</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      )}

      {user && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Embedded Wallet</ThemedText>
          
          {walletAddress && (
            <ThemedText style={styles.walletInfo}>
              Address: <ThemedText type="defaultSemiBold">{walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 8)}</ThemedText>
            </ThemedText>
          )}

          <TouchableOpacity style={styles.button} onPress={getWalletAddress}>
            <ThemedText style={styles.buttonText}>Get Wallet Address</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, !walletAddress && styles.buttonDisabled]} 
            onPress={signMessage}
            disabled={!walletAddress}
          >
            <ThemedText style={styles.buttonText}>Sign Message</ThemedText>
          </TouchableOpacity>

          {signature && (
            <ThemedText style={styles.signatureInfo}>
              Signature: <ThemedText type="defaultSemiBold">{signature.substring(0, 20)}...</ThemedText>
            </ThemedText>
          )}
        </ThemedView>
      )}
      
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    padding: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  walletInfo: {
    fontSize: 14,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  signatureInfo: {
    fontSize: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
});
