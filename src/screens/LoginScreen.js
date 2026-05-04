import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../utils/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS, TYPOGRAPHY } from '../utils/theme';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.bgPrimary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoArea}>
            <Image source={require('../assets/logo.png')} style={styles.logoIcon} />
            <Text style={styles.logoTitle}>CrickVision</Text>
            <Text style={styles.logoSub}>AI Umpire Assistant</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Don't have an account? Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl },
  logoArea: { alignItems: 'center', marginBottom: SPACING.xl, marginTop: SPACING.xl },
  logoIcon: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#0B1F33', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  logoEmoji: { fontSize: 34 },
  logoTitle: { color: COLORS.primary, fontSize: TYPOGRAPHY.title, ...FONTS.semibold, letterSpacing: 0.3 },
  logoSub: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.body, marginTop: 4 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.lg,
    shadowColor: '#0B1F33', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 3,
  },
  cardTitle: { color: COLORS.primary, fontSize: TYPOGRAPHY.section, ...FONTS.semibold, marginBottom: SPACING.lg },
  formGroup: { marginBottom: SPACING.md },
  label: { color: COLORS.primary, fontSize: TYPOGRAPHY.small, ...FONTS.semibold, letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.bgBorder,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.textPrimary, fontSize: TYPOGRAPHY.body,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: TYPOGRAPHY.small, marginTop: 4 },
  btnPrimary: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center', marginTop: SPACING.sm,
  },
  btnText: { color: '#fff', fontSize: TYPOGRAPHY.body, ...FONTS.semibold },
  linkText: { color: COLORS.secondary, fontSize: TYPOGRAPHY.body, textAlign: 'center', marginTop: SPACING.lg },
});

export default LoginScreen;
