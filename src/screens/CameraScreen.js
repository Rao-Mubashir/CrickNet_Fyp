import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

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
        <ActivityIndicator color={COLORS.blue} size="large" />
      </View>
    );
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.permContainer}>
        <Text style={styles.permEmoji}>📹</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>
          Cricket Vision needs camera and microphone permission to record deliveries.
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
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recBadge}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>REC  {formatDuration(recordDuration)}</Text>
          </View>
        )}

        {/* Targeting frame */}
        <View style={styles.targetFrame}>
          {['tl', 'tr', 'bl', 'br'].map((c) => (
            <View key={c} style={[styles.corner, styles[c]]} />
          ))}
        </View>
        <Text style={styles.frameHint}>Align delivery within frame</Text>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.navigate('Upload')}>
            <Text style={styles.sideBtnEmoji}>📁</Text>
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
                <Text style={styles.sideBtnEmoji}>⏱</Text>
                <Text style={[styles.sideBtnLabel, { color: COLORS.error }]}>
                  {formatDuration(recordDuration)}
                </Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.hintText}>
          {isRecording ? 'Tap to stop · Max 30 seconds' : 'Tap to start recording'}
        </Text>
      </SafeAreaView>
    </View>
  );
};

const CORNER_SIZE = 20;
const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center' },
  permContainer: {
    flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center',
    justifyContent: 'center', padding: SPACING.xxxl,
  },
  permEmoji: { fontSize: 56, marginBottom: SPACING.xl },
  permTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '600', marginBottom: SPACING.md, textAlign: 'center' },
  permSub: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xxxl },
  permBtn: {
    backgroundColor: COLORS.blue, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.full,
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    margin: SPACING.lg,
  },
  backText: { color: '#fff', fontSize: 22 },
  recBadge: {
    position: 'absolute', top: 56, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  recText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  targetFrame: {
    alignSelf: 'center', width: 260, height: 160,
    borderWidth: 1, borderColor: 'rgba(30,136,229,0.4)',
    borderRadius: 10, position: 'relative',
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: COLORS.blue, borderStyle: 'solid' },
  tl: { top: -1, left: -1, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
  tr: { top: -1, right: -1, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  bl: { bottom: -1, left: -1, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  br: { bottom: -1, right: -1, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
  frameHint: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginTop: 8 },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: SPACING.xxxl, paddingBottom: SPACING.lg,
  },
  sideBtn: { alignItems: 'center', gap: 4, width: 60 },
  sideBtnEmoji: { fontSize: 22 },
  sideBtnLabel: { color: COLORS.textSecondary, fontSize: 10 },
  recordBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  recordBtnActive: { borderColor: COLORS.error },
  recordInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.error },
  recordInnerActive: { width: 30, height: 30, borderRadius: 6 },
  hintText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', paddingBottom: SPACING.sm },
});

export default CameraScreen;
