import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** AsyncStorage for persisted Zustand stores (non-secret data only; tokens live in SecureStore). */
export const zustandStorage = createJSONStorage(() => AsyncStorage);
