import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

const PERKS = [
  {
    icon: 'cloud-offline-outline',
    title: 'Watch anywhere',
    text: 'Downloads play back without a connection, on flights and in low-signal areas.',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Saved on device',
    text: 'Your titles are stored locally so they load instantly and never buffer.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Private by default',
    text: 'Downloaded content stays on this device and is never streamed to anyone else.',
  },
];

const DownloadsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <LinearGradient
        colors={['#0a0e27', '#141A3F', '#0a0e27']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Downloads</Text>
            <Text style={styles.subtitle}>
              Watch on the go, even without internet
            </Text>
          </View>

          <View style={styles.emptyArea}>
            <View style={styles.glowRingOuter}>
              <View style={styles.glowRingInner}>
                <LinearGradient
                  colors={['#7C74FF', '#5A4DF0']}
                  style={styles.emptyIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="download" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.emptyTitle}>Nothing downloaded yet</Text>
            <Text style={styles.emptyText}>
              Download a movie to watch it later without using mobile data.
            </Text>

            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#7C74FF', '#5A4DF0']}
                style={styles.browseGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="compass-outline" size={18} color="#FFFFFF" />
                <Text style={styles.browseText}>Find something to download</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.perksSection}>
            <Text style={styles.perksTitle}>Why download?</Text>

            {PERKS.map((perk, index) => (
              <View key={perk.title} style={styles.perkRow}>
                <View style={styles.perkIcon}>
                  <Icon name={perk.icon} size={18} color="#8E86FF" />
                </View>
                <View style={styles.perkTextWrap}>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  <Text style={styles.perkText}>{perk.text}</Text>
                </View>
                {index < PERKS.length - 1 ? <View style={styles.perkDivider} /> : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  gradient: { flex: 1 },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  title: {
    fontSize: getFontSize(24),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: getFontSize(13),
    color: '#7B8099',
    marginTop: 4,
  },
  emptyArea: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 36,
    paddingBottom: 30,
  },
  glowRingOuter: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(124,116,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124,116,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: getFontSize(21),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: getFontSize(14),
    color: '#7B8099',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  browseButton: { borderRadius: 14, overflow: 'hidden' },
  browseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  browseText: {
    color: '#FFFFFF',
    fontSize: getFontSize(15),
    fontWeight: '700',
  },
  perksSection: {
    marginHorizontal: isSmallPhone ? 16 : 20,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  perksTitle: {
    fontSize: getFontSize(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(124,116,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  perkTextWrap: { flex: 1 },
  perkTitle: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  perkText: {
    fontSize: getFontSize(12),
    color: '#7B8099',
    lineHeight: 18,
  },
  perkDivider: {
    position: 'absolute',
    left: 48,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});

export default DownloadsScreen;
