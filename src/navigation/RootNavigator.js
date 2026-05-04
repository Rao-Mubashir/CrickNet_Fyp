import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../utils/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { COLORS } from '../utils/theme';

const NavigationContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary }}>
        <Image
          source={require('../assets/splash.png')}
          resizeMode="contain"
          style={{ width: '100%', height: '100%' }}
        />
        <View style={{ position: 'absolute', bottom: 64 }}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      </View>
    );
  }

  return user ? <MainNavigator /> : <AuthNavigator />;
};

const RootNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <NavigationContent />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default RootNavigator;
