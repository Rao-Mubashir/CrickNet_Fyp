import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../utils/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS, TYPOGRAPHY } from '../utils/theme';


// ✅ MOVED OUTSIDE (FIXES KEYBOARD ISSUE)
const Field = ({ field, label, placeholder, secure, keyboard, value, onChange, error }) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      secureTextEntry={secure}
      keyboardType={keyboard || 'default'}
      autoCapitalize={field === 'name' ? 'words' : 'none'}
      autoCorrect={false}
      value={value}
      onChangeText={onChange}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);


const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';

    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = 'Enter a valid email';

    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6)
      newErrors.password = 'Minimum 6 characters';

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password
      );

      if (result.success) {
        if (!result.autoLogin) {
          Alert.alert('Account Created!', 'You can now sign in.', [
            { text: 'Sign In', onPress: () => navigation.navigate('Login') },
          ]);
        }
        // If autoLogin is true, the AuthContext updates the user state 
        // and RootNavigator automatically switches to MainNavigator!
      } else {
        Alert.alert('Registration Failed', result.error || 'Unknown error');
      }
    } catch (err) {
      console.log('ERROR:', err);
      Alert.alert('Error', 'Something went wrong');
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.bgPrimary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <MaterialIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <Image source={require('../assets/logo.png')} style={styles.logoIcon} />

            <Text style={styles.logoTitle}>Create Account</Text>
          </View>

          <View style={styles.card}>
            <Field
              field="name"
              label="FULL NAME"
              placeholder="Ahmed Khan"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
            />

            <Field
              field="email"
              label="EMAIL"
              placeholder="you@example.com"
              keyboard="email-address"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />

            <Field
              field="password"
              label="PASSWORD"
              placeholder="••••••••"
              secure
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            <Field
              field="confirmPassword"
              label="CONFIRM PASSWORD"
              placeholder="••••••••"
              secure
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
            />

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg }}>
              <MaterialIcons name="arrow-back" size={14} color={COLORS.primary} />
              <Text style={[styles.linkText, { marginTop: 0, marginLeft: 6 }]}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.bgBorder,
    borderRadius: RADIUS.md,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: COLORS.textPrimary, fontSize: 22 },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#0B1F33', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  logoTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.title,
    ...FONTS.semibold,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.bgBorder,
    padding: SPACING.lg,
    shadowColor: '#0B1F33', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 3,
  },
  formGroup: { marginBottom: SPACING.md },
  label: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.small,
    ...FONTS.semibold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.bgBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.body,
  },
  inputError: { borderColor: COLORS.error },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.small,
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.body,
    ...FONTS.semibold,
  },
  linkText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.body,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});

export default RegisterScreen;