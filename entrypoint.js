// Import required polyfills first - ORDER MATTERS!
import { Buffer } from 'buffer';
import 'fast-text-encoding';
import 'react-native-get-random-values';
global.Buffer = Buffer;

// UUID polyfill for crypto operations
import 'react-native-uuid';

import '@ethersproject/shims';

// Then import the expo router
import 'expo-router/entry';
