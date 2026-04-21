import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SPACING, FONTS } from '../utils/theme';

const UploadScreen = ({ navigation }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  const pickVideo = async () => {
    if (!mediaPermission?.granted) {
      const { granted } = await requestMediaPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedVideo(asset);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (secs) => {
    if (!secs) return '';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s} duration`;
  };

  const getFileName = (uri) => {
    const parts = uri.split('/');
    return parts[parts.length - 1] || 'video.mp4';
  };

  const handleAnalyze = () => {
    if (!selectedVideo) {
      Alert.alert('No Video', 'Please select a video first.');
      return;
    }
    navigation.navigate('Result', {
      videoUri: selectedVideo.uri,
      source: 'upload',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Upload zone */}
        {!selectedVideo ? (
          <TouchableOpacity style={styles.uploadZone} onPress={pickVideo} activeOpacity={0.8}>
            <Text style={styles.uploadEmoji}>🎬</Text>
            <Text style={styles.uploadTitle}>Tap to Select Video</Text>
            <Text style={styles.uploadSub}>MP4, MOV supported · Max 500 MB</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.selectedCard}>
            <Text style={styles.fileEmoji}>🎥</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {getFileName(selectedVideo.uri)}
              </Text>
              <Text style={styles.fileMeta}>
                {formatSize(selectedVideo.fileSize)}
                {selectedVideo.duration ? `  ·  ${formatDuration(selectedVideo.duration / 1000)}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedVideo(null)} style={styles.removeBtn}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Change button if already selected */}
        {selectedVideo && (
          <TouchableOpacity style={styles.changeBtn} onPress={pickVideo}>
            <Text style={styles.changeBtnText}>Change Video</Text>
          </TouchableOpacity>
        )}

        {/* Analyze button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, !selectedVideo && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={!selectedVideo}
        >
          <Text style={styles.analyzeBtnText}>
            {selectedVideo ? 'Analyze Video →' : 'Select a video to continue'}
          </Text>
        </TouchableOpacity>

        {/* Info box */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ANALYSIS INCLUDES</Text>
          {[
            '✓  Ball detection per frame',
            '✓  Full trajectory mapping',
            '✓  Speed estimation (km/h)',
            '✓  Swing & seam analysis',
            '✓  Frame-by-frame bounding boxes',
          ].map((item) => (
            <Text key={item} style={styles.infoItem}>{item}</Text>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.infoTitle}>💡 TIPS FOR BEST RESULTS</Text>
          <Text style={styles.tipText}>• Use 60fps or higher if possible</Text>
          <Text style={styles.tipText}>• Ensure good lighting conditions</Text>
          <Text style={styles.tipText}>• Keep camera stable during recording</Text>
          <Text style={styles.tipText}>• Full delivery view works best</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSecondary, borderBottomWidth: 0.5, borderBottomColor: COLORS.bgBorder,
  },
  backBtn: {
    backgroundColor: COLORS.bgInput, borderWidth: 0.5, borderColor: COLORS.bgBorder,
    borderRadius: RADIUS.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: COLORS.textPrimary, fontSize: 20 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semibold },
  scroll: { padding: SPACING.xl },
  uploadZone: {
    borderWidth: 1.5, borderColor: COLORS.blue, borderStyle: 'dashed',
    borderRadius: RADIUS.lg, paddingVertical: 50, alignItems: 'center',
    backgroundColor: COLORS.bgInput, marginBottom: SPACING.lg,
  },
  uploadEmoji: { fontSize: 44, marginBottom: SPACING.md },
  uploadTitle: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.medium, marginBottom: 6 },
  uploadSub: { color: COLORS.textMuted, fontSize: 12 },
  selectedCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.green,
    padding: SPACING.lg, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.md,
  },
  fileEmoji: { fontSize: 28 },
  fileInfo: { flex: 1 },
  fileName: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.medium },
  fileMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  removeBtn: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.full,
    width: 26, height: 26, alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: COLORS.textMuted, fontSize: 12 },
  changeBtn: {
    borderWidth: 0.5, borderColor: COLORS.bgBorder, borderRadius: RADIUS.md,
    paddingVertical: 10, alignItems: 'center', marginBottom: SPACING.md,
  },
  changeBtnText: { color: COLORS.textSecondary, fontSize: 13 },
  analyzeBtn: {
    backgroundColor: COLORS.blue, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', marginBottom: SPACING.xl,
  },
  analyzeBtnDisabled: { backgroundColor: COLORS.bgHighlight },
  analyzeBtnText: { color: '#fff', fontSize: 15, ...FONTS.semibold },
  infoCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.bgBorder, padding: SPACING.lg, marginBottom: SPACING.md,
  },
  tipsCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.bgBorder, padding: SPACING.lg,
  },
  infoTitle: {
    color: COLORS.textMuted, fontSize: 11, ...FONTS.semibold,
    letterSpacing: 0.8, marginBottom: SPACING.md,
  },
  infoItem: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 26 },
  tipText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 24 },
});

export default UploadScreen;
