import { useEmbeddedEthereumWallet, useEmbeddedSolanaWallet, useLoginWithEmail, usePrivy } from '@privy-io/expo';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { isReady, user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { wallets: ethereumWallets } = useEmbeddedEthereumWallet();
  const { wallets: solanaWallets } = useEmbeddedSolanaWallet();
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

  // Get wallet address (try Ethereum first, then Solana)
  const getWalletAddress = async () => {
    if (ethereumWallets && ethereumWallets.length > 0) {
      try {
        const provider = await ethereumWallets[0].getProvider();
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        });
        setWalletAddress(accounts[0]);
        Alert.alert('Success', `Ethereum Address: ${accounts[0]}`);
        return;
      } catch (error) {
        console.error('Get Ethereum address error:', error);
      }
    }

    if (solanaWallets && solanaWallets.length > 0) {
      try {
        const address = solanaWallets[0].address;
        setWalletAddress(address);
        Alert.alert('Success', `Solana Address: ${address}`);
        return;
      } catch (error) {
        console.error('Get Solana address error:', error);
      }
    }

    Alert.alert('Error', 'No embedded wallet found');
  };

  // Sign a message (try with available wallet)
  const signMessage = async () => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please get wallet address first');
      return;
    }

    const message = 'Hello from Privy React Native!';

    // Try Ethereum signing first
    if (ethereumWallets && ethereumWallets.length > 0) {
      try {
        const provider = await ethereumWallets[0].getProvider();
        const signature = await provider.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
        setSignature(signature);
        Alert.alert('Success', `Ethereum message signed! Signature: ${signature.substring(0, 20)}...`);
        return;
      } catch (error) {
        console.error('Ethereum sign message error:', error);
      }
    }

    // Solana signing (basic implementation)
    if (solanaWallets && solanaWallets.length > 0) {
      try {
        // For now, just show that Solana wallet is available
        Alert.alert('Info', 'Solana wallet found but signing not implemented in this demo');
        return;
      } catch (error) {
        console.error('Solana wallet error:', error);
      }
    }

    Alert.alert('Error', 'Failed to sign message with any wallet');
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
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Privy App</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Authentication Status</ThemedText>
          <ThemedText style={styles.statusText}>
            {user ? 'Authenticated' : 'Not Authenticated'}
          </ThemedText>
          
          {user && (
            <>
              <ThemedText style={styles.userInfo}>
                User ID: {user.id}
              </ThemedText>
              {((ethereumWallets && ethereumWallets.length > 0) || (solanaWallets && solanaWallets.length > 0)) && (
                <ThemedText style={styles.userInfo}>
                  Embedded Wallets: {(ethereumWallets?.length || 0) + (solanaWallets?.length || 0)} found
                  {ethereumWallets && ethereumWallets.length > 0 && ` (${ethereumWallets.length} Ethereum)`}
                  {solanaWallets && solanaWallets.length > 0 && ` (${solanaWallets.length} Solana)`}
                </ThemedText>
              )}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <ThemedText style={styles.buttonText}>Logout</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>

        {!user && (
          <ThemedView style={styles.section}>
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
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Embedded Wallet</ThemedText>
            
            {walletAddress && (
              <ThemedText style={styles.walletInfo}>
                Address: {walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 8)}
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
                Signature: {signature.substring(0, 20)}...
              </ThemedText>
            )}
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
  userInfo: {
    fontSize: 14,
    marginVertical: 4,
    color: '#666',
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
    marginTop: 12,
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
