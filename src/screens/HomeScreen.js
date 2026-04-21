import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../utils/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../utils/theme';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const firstName = user?.name?.split(' ')[0] || 'Cricketer';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>🏏 Cricket Vision</Text>
        <TouchableOpacity style={styles.avatar} onPress={logout}>
          <Text style={styles.avatarText}>
            {user?.name?.slice(0, 2).toUpperCase() || 'CV'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Welcome back, {firstName} 👋</Text>
          <Text style={styles.bannerSub}>
            AI-powered ball tracking & trajectory analysis at your fingertips
          </Text>
        </View>

        {/* Main Actions */}
        <Text style={styles.sectionTitle}>ANALYZE DELIVERY</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#0d2a4a' }]}>
            <Text style={{ fontSize: 24 }}>📹</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Record Video</Text>
            <Text style={styles.cardSub}>Use camera to capture live delivery</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Upload')}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#0d2a1a' }]}>
            <Text style={{ fontSize: 24 }}>📂</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Upload from Gallery</Text>
            <Text style={styles.cardSub}>Select existing video for analysis</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Stats Row */}
        <Text style={styles.sectionTitle}>RECENT STATS</Text>
        <View style={styles.statsRow}>
          {[
            { val: '12', label: 'Analyses', color: COLORS.blue },
            { val: '138', label: 'Avg km/h', color: COLORS.green },
            { val: '94%', label: 'Accuracy', color: COLORS.orange },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
        <View style={styles.howCard}>
          {[
            { n: '1', t: 'Record or upload a delivery video' },
            { n: '2', t: 'AI model detects and tracks the ball' },
            { n: '3', t: 'View speed, trajectory & frame data' },
          ].map((step) => (
            <View key={step.n} style={styles.howRow}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>{step.n}</Text></View>
              <Text style={styles.stepText}>{step.t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSecondary, borderBottomWidth: 0.5, borderBottomColor: COLORS.bgBorder,
  },
  appName: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semibold },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 12, ...FONTS.semibold },
  scroll: { padding: SPACING.xl, paddingTop: SPACING.lg },
  banner: {
    backgroundColor: COLORS.bgHighlight, borderRadius: RADIUS.lg, padding: SPACING.xl,
    borderWidth: 0.5, borderColor: COLORS.blue, marginBottom: SPACING.xl,
  },
  bannerTitle: { color: COLORS.textPrimary, fontSize: 17, ...FONTS.semibold, marginBottom: 6 },
  bannerSub: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: 11, ...FONTS.semibold,
    letterSpacing: 0.8, marginBottom: SPACING.md,
  },
  actionCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.bgBorder,
    padding: SPACING.lg, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.md,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 14, ...FONTS.medium },
  cardSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  arrow: { color: COLORS.blue, fontSize: 22 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.bgBorder, padding: SPACING.md, alignItems: 'center',
  },
  statVal: { fontSize: 20, ...FONTS.bold },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },
  howCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.bgBorder, padding: SPACING.lg, gap: SPACING.md,
  },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#fff', fontSize: 12, ...FONTS.bold },
  stepText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
});

export default HomeScreen;
