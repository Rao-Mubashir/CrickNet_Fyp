import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS, TYPOGRAPHY } from '../utils/theme';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const firstName = user?.name?.split(' ')[0] || 'Cricketer';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Image source={require('../assets/logo.png')} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4 }} />
          <Text style={styles.appName}>CrickVision</Text>
        </View>
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
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <MaterialIcons name="videocam" size={24} color={COLORS.blue} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Record Video</Text>
            <Text style={styles.cardSub}>Use camera to capture live delivery</Text>
          </View>
          <MaterialIcons name="chevron-right" size={28} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Upload')}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <MaterialIcons name="folder" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Upload from Gallery</Text>
            <Text style={styles.cardSub}>Select existing video for analysis</Text>
          </View>
          <MaterialIcons name="chevron-right" size={28} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Stats Row */}
        <Text style={styles.sectionTitle}>RECENT STATS</Text>
        <View style={styles.statsRow}>
          {[
            { val: '12', label: 'Analyses', color: COLORS.blue },
            { val: '138', label: 'Avg km/h', color: COLORS.primary },
            { val: '94%', label: 'Accuracy', color: COLORS.orange },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
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
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.bgBorder,
  },
  appName: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.section, ...FONTS.semibold },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: TYPOGRAPHY.small, ...FONTS.semibold },
  scroll: { padding: SPACING.md, paddingTop: SPACING.md },
  banner: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, marginBottom: SPACING.lg,
  },
  bannerTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.section, ...FONTS.semibold, marginBottom: 4 },
  bannerSub: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.body, lineHeight: 20 },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, ...FONTS.semibold,
    letterSpacing: 0.8, marginBottom: SPACING.sm, marginTop: SPACING.sm, textTransform: 'uppercase'
  },
  actionCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder,
    padding: SPACING.md, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.sm,
  },
  cardIcon: { width: 48, height: 48, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.body, ...FONTS.semibold },
  cardSub: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, marginTop: 2 },
  arrow: { color: COLORS.textMuted, fontSize: 22 },
  statsRow: { flexDirection: 'column', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  statVal: { fontSize: TYPOGRAPHY.section, ...FONTS.semibold },
  statLabel: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.body, ...FONTS.semibold },
  howCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.bgHighlight,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: COLORS.primary, fontSize: TYPOGRAPHY.small, ...FONTS.semibold },
  stepText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.body, flex: 1 },
});

export default HomeScreen;
