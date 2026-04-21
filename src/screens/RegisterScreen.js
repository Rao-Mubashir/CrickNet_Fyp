import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../utils/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../utils/theme';


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
    console.log('FORM DATA:', form);

    if (!validate()) return;

    setLoading(true);

    try {
      const result = await register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password
      );

      console.log('REGISTER RESULT:', result);

      if (result.success) {
        Alert.alert('Account Created!', 'You can now sign in.', [
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]);
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
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>

            <View style={styles.logoIcon}>
              <Text style={{ fontSize: 28 }}>🏏</Text>
            </View>

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

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>← Back to Login</Text>
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
    borderWidth: 0.5,
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
    borderRadius: 20,
    backgroundColor: COLORS.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    ...FONTS.semibold,
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: COLORS.bgBorder,
    padding: SPACING.xxl,
  },
  formGroup: { marginBottom: SPACING.lg },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    ...FONTS.medium,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 0.5,
    borderColor: COLORS.bgBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  inputError: { borderColor: COLORS.error },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: COLORS.blue,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    ...FONTS.semibold,
  },
  linkText: {
    color: COLORS.blue,
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});

export default RegisterScreen;