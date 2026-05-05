import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../utils/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const NavigationContent = () => {
  const { user, isLoading } = useAuth();

  // Show light grey view while loading to distinguish from splash screen
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#F0F4F8' }} />;
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
