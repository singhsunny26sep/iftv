import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native';
import { createTicket } from '../api/support';
import { moderateScale } from '../utils/Scalling';

const CATEGORIES = [
  { value: 'payment', label: 'Payment' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'playback', label: 'Video / Playback' },
  { value: 'account', label: 'Account' },
  { value: 'content_request', label: 'Content request' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
];

const CreateTicketScreen = ({ navigation }) => {
  const [category, setCategory] = useState('playback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const pickAttachments = async () => {
    try {
      const result = await (await import('expo-document-picker')).getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: true,
        maxCount: 3,
      });

      if (result && !result.canceled && result.assets) {
        const next = [...attachments];
        for (const asset of result.assets) {
          if (next.length >= 3) break;
          const ext = (asset.name || '').split('.').pop().toLowerCase();
          if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
            next.push({ uri: asset.uri, name: asset.name, type: `image/${ext === 'jpeg' ? 'jpeg' : ext}` });
          }
        }
        setAttachments(next);
      }
    } catch (e) {
      // expo-document-picker not available — keep attachments empty
    }
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (trimmedSubject.length < 3 || trimmedSubject.length > 150) {
      Alert.alert(
        'Invalid subject',
        'Subject must be between 3 and 150 characters.',
      );
      return;
    }
    if (trimmedMessage.length < 10 || trimmedMessage.length > 2000) {
      Alert.alert(
        'Invalid message',
        'Message must be between 10 and 2000 characters.',
      );
      return;
    }

    setSubmitting(true);
    try {
      await createTicket({
        category,
        subject: trimmedSubject,
        message: trimmedMessage,
        attachments,
      });
      Alert.alert('Ticket created', 'Your ticket has been submitted.', [
        { text: 'OK', onPress: () => navigation.replace('Tickets') },
      ]);
    } catch (e) {
      Alert.alert('Could not create ticket', e.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeCategory = (value) => setCategory(value);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <LinearGradient
        colors={['#0a0e27', '#141A3F', '#0a0e27']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Ticket</Text>
          <View style={styles.backButton} />
        </View>

        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.categoryChip,
                      active && styles.categoryChipActive,
                    ]}
                    onPress={() => closeCategory(c.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief summary of the issue"
              placeholderTextColor="#6B7280"
              value={subject}
              onChangeText={setSubject}
              returnKeyType="next"
              maxLength={150}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor="#6B7280"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />

            <Text style={styles.label}>Attachments (0/3)</Text>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={pickAttachments}
              activeOpacity={0.8}
            >
              <Icon name="image-outline" size={18} color="#A79BFF" />
              <Text style={styles.attachText}>Add screenshots (max 3)</Text>
            </TouchableOpacity>

            {attachments.length > 0 ? (
              <View style={styles.attachmentsRow}>
                {attachments.map((a, i) => (
                  <View key={i} style={styles.attachThumb}>
                    <Image
                      source={{ uri: a.uri }}
                      style={styles.attachImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.attachRemove}
                      onPress={() => removeAttachment(i)}
                    >
                      <Icon name="close-circle" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Icon name="send" size={18} color="#FFFFFF" style={styles.sendIcon} />
              )}
              <Text style={styles.submitText}>
                {submitting ? 'Sending...' : 'Submit Ticket'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default CreateTicketScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: { width: 36, alignItems: 'center' },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  kav: { flex: 1 },
  form: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  label: {
    fontSize: moderateScale(12.5),
    fontWeight: '600',
    color: '#9FB0D2',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.18)',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 130,
    textAlignVertical: 'top',
    paddingBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.18)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(124,116,255,0.2)',
    borderColor: '#7C74FF',
  },
  categoryChipText: {
    fontSize: moderateScale(12),
    color: '#9FB0D2',
  },
  categoryChipTextActive: { color: '#A79BFF', fontWeight: '600' },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(124,116,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.18)',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  attachText: {
    color: '#A79BFF',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  attachThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  attachImage: { width: '100%', height: '100%' },
  attachRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C74FF',
    borderRadius: 28,
    paddingVertical: 12,
    gap: 6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  sendIcon: { marginRight: 6 },
});
