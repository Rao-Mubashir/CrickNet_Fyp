import React, { useEffect, useState, useCallback } from 'react';
import { View, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

// Ignore specific warnings if necessary
LogBox.ignoreLogs(['ViewPropTypes will be removed']);

// Keep splash screen visible while the app initializes
SplashScreen.preventAutoHideAsync().catch((err) => {
  console.warn('SplashScreen.preventAutoHideAsync error:', err);
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App: Starting preparation...');
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('App: Preparation complete');
      } catch (e) {
        console.warn('App: Preparation error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    // Emergency fallback: hide splash screen after 5 seconds no matter what
    const emergencyTimer = setTimeout(async () => {
      console.log('App: Emergency splash screen hide triggered');
      await SplashScreen.hideAsync().catch(() => {});
    }, 5000);

    return () => clearTimeout(emergencyTimer);
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      console.log('App: Hiding Splash Screen via onLayout');
      try {
        await SplashScreen.hideAsync();
      } catch (err) {
        console.warn('App: Failed to hide splash screen:', err);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#F0F4F8" />
        <RootNavigator />
      </SafeAreaProvider>
    </View>
  );
}
