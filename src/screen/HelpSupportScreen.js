import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
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

const FAQS = [
  {
    id: '1',
    question: 'How do I reset my password?',
    answer:
      'IFTV uses mobile number OTP login. Tap Log Out, then sign in again with your mobile number and we will send you a fresh OTP.',
  },
  {
    id: '2',
    question: 'Which devices can I use IFTV on?',
    answer:
      'You can sign in on any phone, tablet or Android TV. Your watch progress and profile stay synced across all devices.',
  },
  {
    id: '3',
    question: 'How do I cancel my subscription?',
    answer:
      'Open Profile > Subscription to review your current plan. You can cancel any time and keep access until the end of the billing period.',
  },
  {
    id: '4',
    question: 'Why is a movie not playing?',
    answer:
      'Check your internet connection and try again. If the issue persists, clear the app cache from your device settings and relaunch IFTV.',
  },
  {
    id: '5',
    question: 'How do I download a movie?',
    answer:
      'Open any movie, tap the download icon and choose a quality. Downloaded content is available on the Downloads tab even without internet.',
  },
];

const CONTACT_OPTIONS = [
  {
    id: 'email',
    icon: 'mail-outline',
    title: 'Email Support',
    subtitle: 'support@iftv.com',
    color: '#6C63FF',
    url: 'mailto:support@iftv.com',
  },
  {
    id: 'phone',
    icon: 'call-outline',
    title: 'Call Support',
    subtitle: '+91 1800 123 4567',
    color: '#4CAF50',
    url: 'tel:+9118001234567',
  },
  {
    id: 'chat',
    icon: 'chatbubble-ellipses-outline',
    title: 'Live Chat',
    subtitle: 'Available 10 AM - 10 PM',
    color: '#FF6B6B',
    url: null,
  },
];

const HelpSupportScreen = ({ navigation }) => {
  const [openFaq, setOpenFaq] = useState(null);

  const handleContactPress = (option) => {
    if (!option.url) {
      return;
    }
    Linking.openURL(option.url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#0a0e27', '#1a1f4e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIconContainer}>
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.heroIcon}
              >
                <Icon name="help-buoy" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>How can we help?</Text>
            <Text style={styles.heroSubtitle}>
              Find quick answers or reach out to our team anytime.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>

          <View style={styles.contactList}>
            {CONTACT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.contactCard}
                onPress={() => handleContactPress(option)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.contactIcon, { backgroundColor: `${option.color}20` }]}
                >
                  <Icon name={option.icon} size={20} color={option.color} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>

          <View style={styles.faqList}>
            {FAQS.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={[styles.faqCard, isOpen && styles.faqCardOpen]}
                  onPress={() => setOpenFaq(isOpen ? null : faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Icon
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#6C63FF"
                    />
                  </View>
                  {isOpen && (
                    <View style={styles.faqAnswerWrapper}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.appVersionCard}>
            <Icon name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.appVersionText}>IFTV Version 1.0.0</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingVertical: isSmallPhone ? 12 : 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: getFontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: getFontSize(22),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: getFontSize(14),
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: getFontSize(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contactList: {
    marginBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: getFontSize(12),
    color: '#9CA3AF',
  },
  faqList: {
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  faqCardOpen: {
    borderColor: 'rgba(108,99,255,0.3)',
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 12,
  },
  faqAnswerWrapper: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  faqAnswer: {
    fontSize: getFontSize(13),
    color: '#9CA3AF',
    lineHeight: 20,
  },
  appVersionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  appVersionText: {
    fontSize: getFontSize(12),
    color: '#6B7280',
    marginLeft: 6,
  },
});

export default HelpSupportScreen;
