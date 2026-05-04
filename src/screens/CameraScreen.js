import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS, TYPOGRAPHY } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CameraScreen = ({ navigation }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!cameraPermission || !micPermission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.permContainer}>
        <MaterialIcons name="videocam" size={56} color={COLORS.primary} style={{ marginBottom: SPACING.xl }} />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>
          CrickVision needs camera and microphone permission to record deliveries.
        </Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permBtnText}>Grant Permissions</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const startRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration((d) => d + 1), 1000);

      const video = await cameraRef.current.recordAsync({
        maxDuration: 30, // max 30 seconds
        quality: '720p',
      });

      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordDuration(0);

      if (video?.uri) {
        sendVideoToBackend(video.uri);
      }
    } catch (err) {
      clearInterval(timerRef.current);
      setIsRecording(false);
      Alert.alert('Recording Error', err.message || 'Failed to record video.');
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const sendVideoToBackend = (videoUri) => {
    navigation.navigate('Result', { videoUri, source: 'camera' });
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" backgroundColor="#000000" />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="video"
      />

      {/* Back button */}
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={isRecording}
        >
          <MaterialIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recBadge}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>REC  {formatDuration(recordDuration)}</Text>
          </View>
        )}

        {/* Pitch alignment guide */}
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
          <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}>
            <Polygon
              points={`${SCREEN_WIDTH * 0.3},${SCREEN_HEIGHT * 0.35} ${SCREEN_WIDTH * 0.7},${SCREEN_HEIGHT * 0.35} ${SCREEN_WIDTH},${SCREEN_HEIGHT} 0,${SCREEN_HEIGHT}`}
              fill="transparent"
              stroke={COLORS.secondary}
              strokeWidth="2.5"
              strokeDasharray="8, 6"
            />
          </Svg>
          <Text style={[styles.frameHint, { position: 'absolute', top: SCREEN_HEIGHT * 0.35 - 50 }]}>
            Align pitch within guide
          </Text>
        </View>

        <View style={{ marginBottom: 0 }}>
          <Text style={styles.hintText}>
            {isRecording ? 'Tap to stop · Max 30 seconds' : 'Tap to start recording'}
          </Text>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.navigate('Upload')}>
              <MaterialIcons name="photo-library" size={22} color="#fff" />
              <Text style={styles.sideBtnLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={uploading}
            >
              <View style={[styles.recordInner, isRecording && styles.recordInnerActive]} />
            </TouchableOpacity>

            <View style={styles.sideBtn}>
              {isRecording && (
                <>
                  <MaterialIcons name="timer" size={22} color="#fff" />
                  <Text style={[styles.sideBtnLabel, { color: COLORS.accent }]}>
                    {formatDuration(recordDuration)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const CORNER_SIZE = 20;
const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center' },
  permContainer: {
    flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center',
    justifyContent: 'center', padding: SPACING.xl,
  },
  permEmoji: { fontSize: 56, marginBottom: SPACING.xl },
  permTitle: { color: COLORS.primary, fontSize: TYPOGRAPHY.title, ...FONTS.semibold, marginBottom: SPACING.md, textAlign: 'center' },
  permSub: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.body, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  permBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  permBtnText: { color: '#fff', fontSize: TYPOGRAPHY.body, ...FONTS.semibold },
  overlay: { flex: 1, justifyContent: 'space-between' },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: RADIUS.full,
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    margin: SPACING.lg,
  },
  backText: { color: '#fff', fontSize: 22 },
  recBadge: {
    position: 'absolute', top: 56, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  recText: { color: '#fff', fontSize: TYPOGRAPHY.body, ...FONTS.semibold },
  pitchGuideContainer: {
    alignSelf: 'center', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameHint: { color: 'rgba(255,255,255,0.82)', fontSize: 12, textAlign: 'center', ...FONTS.semibold },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl, paddingBottom: 0,
  },
  sideBtn: { alignItems: 'center', gap: 4, width: 60 },
  sideBtnEmoji: { fontSize: 22 },
  sideBtnLabel: { color: '#fff', fontSize: TYPOGRAPHY.small },
  recordBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  recordBtnActive: { borderColor: COLORS.accent },
  recordInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.accent },
  recordInnerActive: { width: 30, height: 30, borderRadius: 6 },
  hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textAlign: 'center', paddingBottom: SPACING.sm },
});

export default CameraScreen;
