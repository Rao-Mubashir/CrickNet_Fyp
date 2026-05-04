import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, Image, Animated, Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import Svg, { Polyline, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { analyzeVideo, BASE_URL } from '../services/api';
import { COLORS, RADIUS, SPACING, FONTS, TYPOGRAPHY } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SVG_WIDTH = SCREEN_WIDTH - 72;
const SVG_HEIGHT = 150;

const ResultScreen = ({ route, navigation }) => {
  const { videoUri, source } = route.params || {};
  const videoRef = useRef(null);
  const logoScale = useRef(new Animated.Value(1)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Uploading video...');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [fluffyVideoUrl, setFluffyVideoUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoUri) {
      runAnalysis();
    } else {
      setError('No video provided.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) return undefined;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isLoading, logoScale]);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setLoadingStage('Uploading video...');

      // Run the standard analysis for stats and video
      const data = await analyzeVideo(videoUri, (pct) => {
        setUploadProgress(pct);
        if (pct >= 100) {
          setLoadingStage('Tracking ball trajectory...');
          setTimeout(() => setLoadingStage('Calculating physics and spin...'), 8000);
          setTimeout(() => setLoadingStage('Generating video overlay...'), 16000);
        }
      });
      setResult(data);

      if (data?.video_url) {
        setFluffyVideoUrl(BASE_URL + data.video_url);
      }

    } catch (err) {
      console.error('Analysis error:', err);
      const msg =
        err.response?.data?.detail ||
        (err.code === 'ECONNABORTED' ? 'Request timed out. Check your network.' : null) ||
        err.message ||
        'Failed to analyze video. Check your network connection.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Normalize dual trajectories to fit SVG viewport
  const normalizeTrajectories = (actual, predicted) => {
    if (!actual || actual.length === 0) return { actualNorm: [], predictedNorm: [] };
    
    // Find absolute bounds across BOTH trajectories
    const allX = [...actual.map(p => p[0]), ...(predicted || []).map(p => p[0])];
    const allY = [...actual.map(p => p[1]), ...(predicted || []).map(p => p[1])];
    
    if (allX.length === 0) return { actualNorm: [], predictedNorm: [] };
    
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 20;

    const transform = (p) => [
      pad + ((p[0] - minX) / rangeX) * (SVG_WIDTH - pad * 2),
      pad + ((p[1] - minY) / rangeY) * (SVG_HEIGHT - pad * 2)
    ];

    return {
      actualNorm: actual.map(transform),
      predictedNorm: (predicted || []).map(transform)
    };
  };

  const { actualNorm, predictedNorm } = normalizeTrajectories(
    result?.trajectory || [],
    result?.predicted_trajectory || []
  );

  const actualPolyline = actualNorm.map(p => `${p[0]},${p[1]}`).join(' ');
  const predictedPolyline = predictedNorm.map(p => `${p[0]},${p[1]}`).join(' ');

  // ── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={COLORS.bgPrimary} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <Animated.Image
              source={require('../assets/logo.png')}
              style={{ width: 48, height: 48, marginBottom: SPACING.xl, borderRadius: RADIUS.md, transform: [{ scale: logoScale }] }}
            />
            <ActivityIndicator color={COLORS.secondary} size="large" style={{ marginBottom: SPACING.lg }} />
            <Text style={styles.loadingTitle}>{loadingStage}</Text>
            <Text style={styles.loadingSub}>AI is analyzing your delivery...</Text>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={COLORS.bgPrimary} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <MaterialIcons name="error-outline" size={48} color={COLORS.error} style={{ marginBottom: SPACING.lg }} />
            <Text style={styles.loadingTitle}>Analysis Failed</Text> 
            <TouchableOpacity style={styles.retryBtn} onPress={runAnalysis}>
              <Text style={styles.retryText}>Retry Analysis</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md }}>
              <MaterialIcons name="arrow-back" size={16} color={COLORS.textMuted} />
              <Text style={[styles.retryText, { color: COLORS.textMuted, marginLeft: 4 }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.bgPrimary} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CrickVision Analysis</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>COMPLETE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoCard}>
          {fluffyVideoUrl || videoUri ? (
            <Video
              ref={videoRef}
              source={{ uri: fluffyVideoUrl || videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          ) : (
            <View style={[styles.video, styles.videoPlaceholder]}>
              <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>Video not available</Text>
            </View>
          )}
        </View>

        {/* Speed & Spin Metrics Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.secondary }]}> 
            <Text style={[styles.statVal, { color: COLORS.secondary }]}>{result?.speed || '—'}</Text>
            <Text style={styles.statLabel}>Avg Speed</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.accent }]}> 
            <Text style={[styles.statVal, { color: COLORS.accent }]}> 
              {result?.spin_angle ? `${result.spin_angle}°` : '—'}
            </Text>
            <Text style={styles.statLabel}>Spin Angle</Text>
          </View>
        </View>

        {/* Spin Direction Badge */}
        {result?.spin_direction && (
          <View style={styles.spinDirectionCard}>
            <Text style={styles.sectionTitle}>SPIN ANALYSIS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons 
                name={result.spin_direction === 'Turns Right' ? 'turn-right' : result.spin_direction === 'Turns Left' ? 'turn-left' : 'straight'} 
                size={28} 
                color={COLORS.primary} 
              />
              <Text style={{ color: COLORS.primary, fontSize: 20, marginLeft: 12, ...FONTS.semibold }}>
                {result.spin_direction}
              </Text>
            </View>
          </View>
        )}

        {/* Trajectory SVG */}
        <View style={styles.trajectoryCard}>
          <Text style={styles.sectionTitle}>BALL TRAJECTORY (TOP-DOWN VIEW)</Text>
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
            <Defs>
              <LinearGradient id="actualGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={COLORS.secondary} stopOpacity="1" />
                <Stop offset="1" stopColor={COLORS.primary} stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="predGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.85" />
                <Stop offset="1" stopColor={COLORS.primaryDark} stopOpacity="0.35" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            <Line x1="0" y1={SVG_HEIGHT - 10} x2={SVG_WIDTH} y2={SVG_HEIGHT - 10} stroke={COLORS.bgBorder} strokeWidth="0.5" />
            <Line x1="10" y1="0" x2="10" y2={SVG_HEIGHT} stroke={COLORS.bgBorder} strokeWidth="0.5" />

            {/* Predicted Trajectory (No Spin) */}
            {predictedNorm.length > 1 && (
              <Polyline
                points={predictedPolyline}
                fill="none"
                stroke="url(#predGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
              />
            )}

            {/* Actual Trajectory */}
            {actualNorm.length > 1 && (
              <Polyline
                points={actualPolyline}
                fill="none"
                stroke="url(#actualGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Bounce Point Highlight */}
            {result?.bounce_frame && actualNorm.length > 0 && (
              <Circle 
                cx={actualNorm[result.bounce_frame] ? actualNorm[result.bounce_frame][0] : actualNorm[Math.floor(actualNorm.length/2)][0]} 
                cy={actualNorm[result.bounce_frame] ? actualNorm[result.bounce_frame][1] : actualNorm[Math.floor(actualNorm.length/2)][1]} 
                r="5" fill={COLORS.primary} 
              />
            )}

            {/* Labels */}
            <SvgText x="16" y={SVG_HEIGHT - 14} fill={COLORS.textMuted} fontSize="9">Release</SvgText>
            <SvgText x={SVG_WIDTH - 54} y={SVG_HEIGHT - 14} fill={COLORS.textMuted} fontSize="9">Impact</SvgText>
            
          </Svg>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
              <View style={{ width: 10, height: 4, backgroundColor: COLORS.secondary, marginRight: 6 }} />
              <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Actual</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
              <View style={{ width: 10, height: 4, backgroundColor: COLORS.accent, marginRight: 6 }} />
              <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Predicted</Text>
            </View>
          </View>
        </View>

        {/* Frame Detections Summary */}
        <View style={styles.detectionsCard}>
          <Text style={styles.sectionTitle}>ANALYSIS DETAILS</Text>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
             <Text style={{ color: COLORS.textSecondary }}>Frames Tracked:</Text>
             <Text style={{ color: COLORS.textPrimary }}>{result?.frames_detected} / {result?.total_frames}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
             <Text style={{ color: COLORS.textSecondary }}>Video FPS:</Text>
             <Text style={{ color: COLORS.textPrimary }}>{result?.fps || 30}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
             <Text style={{ color: COLORS.textSecondary }}>Processing Time:</Text>
             <Text style={{ color: COLORS.textPrimary }}>{result?.processing_time}s</Text>
          </View>
        </View>

        {/* Analyze Another */}
        <TouchableOpacity style={styles.newAnalysisBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.newAnalysisText}>+ New Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADIUS.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 20 },
  headerTitle: { color: '#fff', fontSize: TYPOGRAPHY.section, ...FONTS.semibold },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontSize: TYPOGRAPHY.small, ...FONTS.semibold },
  scroll: { padding: SPACING.sm },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.lg,
    alignItems: 'center', width: '100%',
    shadowColor: '#0B1F33', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 3,
  },
  loadingEmoji: { fontSize: 48, marginBottom: SPACING.xl },
  loadingTitle: { color: COLORS.primary, fontSize: TYPOGRAPHY.section, ...FONTS.semibold, marginBottom: 6 },
  loadingSub: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.body },
  progressContainer: { marginTop: SPACING.lg, width: '100%', alignItems: 'center' },
  progressTrack: { width: '100%', height: 4, backgroundColor: COLORS.bgBorder, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 2 },
  progressText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, marginTop: 6 },
  retryBtn: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 32 },
  retryText: { color: '#fff', fontSize: TYPOGRAPHY.body, ...FONTS.semibold, textAlign: 'center' },
  videoCard: {
    borderRadius: RADIUS.md, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.bgBorder, marginBottom: SPACING.md,
    shadowColor: '#0B1F33', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  video: { width: '100%', height: 200 },
  videoPlaceholder: { backgroundColor: COLORS.bgSecondary, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md, alignItems: 'center',
    shadowColor: '#0B1F33', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  statVal: { fontSize: TYPOGRAPHY.title, ...FONTS.semibold },
  statLabel: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, marginTop: 4 },
  trajectoryCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md, marginBottom: SPACING.md,
    shadowColor: '#0B1F33', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  sectionTitle: {
    color: COLORS.primary, fontSize: TYPOGRAPHY.small, ...FONTS.semibold,
    letterSpacing: 0.8, marginBottom: SPACING.md, textTransform: 'uppercase',
  },
  detectionsCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md, marginBottom: SPACING.lg,
    shadowColor: '#0B1F33', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  detRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.bgBorder, gap: SPACING.sm,
  },
  frameBadge: {
    backgroundColor: COLORS.bgHighlight, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4, minWidth: 64, alignItems: 'center',
  },
  frameText: { color: COLORS.secondary, fontSize: TYPOGRAPHY.small, ...FONTS.semibold },
  coordText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.small, flex: 1 },
  confBar: { width: 52, height: 4, backgroundColor: COLORS.bgBorder, borderRadius: 2, overflow: 'hidden' },
  confFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 2 },
  moreText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, textAlign: 'center', marginTop: SPACING.sm },
  newAnalysisBtn: {
    borderWidth: 1, borderColor: COLORS.secondary, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center', marginBottom: SPACING.xl,
  },
  newAnalysisText: { color: COLORS.secondary, fontSize: TYPOGRAPHY.body, ...FONTS.semibold },
});

export default ResultScreen;
