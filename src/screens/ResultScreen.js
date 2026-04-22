import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import Svg, { Polyline, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { analyzeVideo, analyzeFluffyVideo, BASE_URL } from '../services/api';
import { COLORS, RADIUS, SPACING, FONTS, TYPOGRAPHY } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SVG_WIDTH = SCREEN_WIDTH - 72;
const SVG_HEIGHT = 150;

const ResultScreen = ({ route, navigation }) => {
  const { videoUri, source } = route.params || {};
  const videoRef = useRef(null);

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

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setLoadingStage('Uploading video...');
      
      // Run the standard analysis for stats
      const data = await analyzeVideo(videoUri, (pct) => {
        setUploadProgress(pct);
        if (pct >= 100) setLoadingStage('AI model analyzing...');
        if (pct >= 100) setTimeout(() => setLoadingStage('Generating trajectory...'), 1000);
      });
      setResult(data);

      // In the background or sequentially, run the fluffy video generation
      setLoadingStage('Generating fluffy video...');
      const fluffyData = await analyzeFluffyVideo(videoUri);
      if (fluffyData?.video_url) {
        setFluffyVideoUrl(BASE_URL + fluffyData.video_url);
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

  // Normalize trajectory coordinates to fit SVG viewport
  const normalizeTrajectory = (trajectory) => {
    if (!trajectory || trajectory.length === 0) return [];
    const xs = trajectory.map((p) => p[0]);
    const ys = trajectory.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 20;
    return trajectory.map((p) => [
      pad + ((p[0] - minX) / rangeX) * (SVG_WIDTH - pad * 2),
      pad + ((p[1] - minY) / rangeY) * (SVG_HEIGHT - pad * 2),
    ]);
  };

  // ── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <Image source={require('../assets/logo.png')} style={{ width: 48, height: 48, marginBottom: SPACING.xl, borderRadius: RADIUS.md }} />
            <ActivityIndicator color={COLORS.primary} size="large" style={{ marginBottom: SPACING.lg }} />
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
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <MaterialIcons name="error-outline" size={48} color={COLORS.error} style={{ marginBottom: SPACING.lg }} />
            <Text style={styles.loadingTitle}>Analysis Failed</Text>
            <Text style={[styles.loadingSub, { textAlign: 'center', marginBottom: SPACING.xl }]}>{error}</Text>
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

  const normalizedPoints = normalizeTrajectory(result?.trajectory || []);
  const polylinePoints = normalizedPoints.map((p) => `${p[0]},${p[1]}`).join(' ');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Result</Text>
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

        {/* Speed & Frames */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.primary }]}>
            <Text style={[styles.statVal, { color: COLORS.primary }]}>{result?.speed || '—'}</Text>
            <Text style={styles.statLabel}>Ball Speed</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.success }]}>
            <Text style={[styles.statVal, { color: COLORS.success }]}>
              {result?.detections?.length ?? 0} frames
            </Text>
            <Text style={styles.statLabel}>Tracked</Text>
          </View>
        </View>

        {/* Trajectory SVG */}
        <View style={styles.trajectoryCard}>
          <Text style={styles.sectionTitle}>BALL TRAJECTORY</Text>
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={COLORS.success} stopOpacity="1" />
                <Stop offset="1" stopColor={COLORS.primary} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            {/* Grid lines */}
            <Line x1="0" y1={SVG_HEIGHT - 10} x2={SVG_WIDTH} y2={SVG_HEIGHT - 10}
              stroke={COLORS.bgBorder} strokeWidth="0.5" />
            <Line x1="10" y1="0" x2="10" y2={SVG_HEIGHT}
              stroke={COLORS.bgBorder} strokeWidth="0.5" />

            {/* Trajectory path */}
            {normalizedPoints.length > 1 && (
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke="url(#grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Start and end dots */}
            {normalizedPoints.length > 0 && (
              <>
                <Circle cx={normalizedPoints[0][0]} cy={normalizedPoints[0][1]}
                  r="6" fill={COLORS.success} opacity="0.9" />
                <Circle
                  cx={normalizedPoints[normalizedPoints.length - 1][0]}
                  cy={normalizedPoints[normalizedPoints.length - 1][1]}
                  r="6" fill={COLORS.primary} opacity="0.9" />
              </>
            )}

            {/* Intermediate dots */}
            {normalizedPoints.slice(1, -1).map((p, i) => (
              <Circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" opacity="0.3" />
            ))}

            {/* Labels */}
            <SvgText x="16" y={SVG_HEIGHT - 14} fill={COLORS.textMuted} fontSize="9">Release</SvgText>
            <SvgText x={SVG_WIDTH - 54} y={SVG_HEIGHT - 14} fill={COLORS.textMuted} fontSize="9">Impact</SvgText>
          </Svg>
        </View>

        {/* Frame Detections */}
        <View style={styles.detectionsCard}>
          <Text style={styles.sectionTitle}>FRAME DETECTIONS</Text>
          {(result?.detections || []).slice(0, 10).map((det, idx) => (
            <View key={idx} style={[styles.detRow, idx === (result?.detections?.length > 10 ? 9 : result?.detections?.length - 1) && { borderBottomWidth: 0 }]}>
              <View style={styles.frameBadge}>
                <Text style={styles.frameText}>Frame {det.frame}</Text>
              </View>
              <Text style={styles.coordText}>x: {det.x}  ·  y: {det.y}</Text>
              <View style={styles.confBar}>
                <View style={[styles.confFill, { width: `${Math.round((det.confidence || 0.9) * 100)}%` }]} />
              </View>
            </View>
          ))}
          {(result?.detections?.length || 0) > 10 && (
            <Text style={styles.moreText}>+{result.detections.length - 10} more frames</Text>
          )}
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
    backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.bgBorder,
  },
  backBtn: {
    backgroundColor: COLORS.bgInput, borderWidth: 0.5, borderColor: COLORS.bgBorder,
    borderRadius: RADIUS.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: COLORS.textPrimary, fontSize: 20 },
  headerTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.section, ...FONTS.semibold },
  statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: COLORS.success, fontSize: TYPOGRAPHY.small, ...FONTS.semibold },
  scroll: { padding: SPACING.sm },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.lg,
    alignItems: 'center', width: '100%',
  },
  loadingEmoji: { fontSize: 48, marginBottom: SPACING.xl },
  loadingTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.section, ...FONTS.semibold, marginBottom: 6 },
  loadingSub: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.body },
  progressContainer: { marginTop: SPACING.lg, width: '100%', alignItems: 'center' },
  progressTrack: { width: '100%', height: 4, backgroundColor: COLORS.bgBorder, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  progressText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, marginTop: 6 },
  retryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 32 },
  retryText: { color: '#fff', fontSize: TYPOGRAPHY.body, ...FONTS.semibold, textAlign: 'center' },
  videoCard: {
    borderRadius: RADIUS.md, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.bgBorder, marginBottom: SPACING.md,
  },
  video: { width: '100%', height: 200 },
  videoPlaceholder: { backgroundColor: COLORS.bgSecondary, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md, alignItems: 'center',
  },
  statVal: { fontSize: TYPOGRAPHY.title, ...FONTS.semibold },
  statLabel: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, marginTop: 4 },
  trajectoryCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md, marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, ...FONTS.semibold,
    letterSpacing: 0.8, marginBottom: SPACING.md, textTransform: 'uppercase',
  },
  detectionsCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.bgBorder, padding: SPACING.md, marginBottom: SPACING.lg,
  },
  detRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.bgBorder, gap: SPACING.sm,
  },
  frameBadge: {
    backgroundColor: COLORS.bgHighlight, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4, minWidth: 64, alignItems: 'center',
  },
  frameText: { color: COLORS.primary, fontSize: TYPOGRAPHY.small, ...FONTS.semibold },
  coordText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.small, flex: 1 },
  confBar: { width: 52, height: 4, backgroundColor: COLORS.bgBorder, borderRadius: 2, overflow: 'hidden' },
  confFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 2 },
  moreText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.small, textAlign: 'center', marginTop: SPACING.sm },
  newAnalysisBtn: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center', marginBottom: SPACING.xl,
  },
  newAnalysisText: { color: COLORS.primary, fontSize: TYPOGRAPHY.body, ...FONTS.semibold },
});

export default ResultScreen;
