import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import UploadScreen from '../screens/UploadScreen';
import ResultScreen from '../screens/ResultScreen';
import { COLORS } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ iconName, label, focused }) => (
  <View style={{ alignItems: 'center', paddingTop: 4 }}>
    <MaterialIcons name={iconName} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
    <Text style={{ fontSize: 10, color: focused ? COLORS.primary : COLORS.textMuted, marginTop: 2 }}>
      {label}
    </Text>
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: COLORS.bgSecondary,
        borderTopColor: COLORS.bgBorder,
        borderTopWidth: 0.5,
        height: 62,
        paddingBottom: 8,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="home" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="Camera"
      component={CameraScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="videocam" label="Record" focused={focused} /> }}
    />
    <Tab.Screen
      name="Upload"
      component={UploadScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="folder" label="Upload" focused={focused} /> }}
    />
  </Tab.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={TabNavigator} />
    <Stack.Screen
      name="Result"
      component={ResultScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
  </Stack.Navigator>
);

export default MainNavigator;
