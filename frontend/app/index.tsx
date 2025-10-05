import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from '../components/AuthScreen';
import OnboardingScreen from '../components/OnboardingScreen';
import MainApp from '../components/MainApp';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

type AppState = 'loading' | 'auth' | 'onboarding' | 'main';

function AppContent() {
  const { user, token, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    determineAppState();
  }, [user, token, loading]);

  const determineAppState = async () => {
    if (loading) {
      setAppState('loading');
      return;
    }

    if (!user || !token) {
      setAppState('auth');
      return;
    }

    // Check if user has completed onboarding (has preferences set)
    if (!user.preferences || user.preferences.length === 0) {
      setAppState('onboarding');
      return;
    }

    setAppState('main');
  };

  const handleOnboardingComplete = () => {
    setAppState('main');
  };

  if (appState === 'loading') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (appState === 'auth') {
    return <AuthScreen />;
  }

  if (appState === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});