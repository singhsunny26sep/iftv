import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native';
import { getTicket, replyToTicket, closeTicket, toThumbnail } from '../api/support';
import { moderateScale } from '../utils/Scalling';

const STATUS_COLORS = {
  open: '#4CAF50',
  in_progress: '#FF9800',
  closed: '#9FB0D2',
  resolved: '#2196F3',
};

const EmptyThread = () => (
  <Text style={styles.emptyThread}>
    No messages yet. Send a reply to start the conversation.
  </Text>
);

const toText = (m) =>
  m?.message ?? m?.text ?? m?.content ?? '';

const isSupport = (m) => {
  if (!m) return false;
  const role = (m.senderRole || m.user?.role || m.role || '').toLowerCase();
  return role === 'admin' || role === 'support' || role === 'agent';
};

const isMine = (m) => {
  if (!m) return true;
  if (isSupport(m)) return false;
  const role = (m.senderRole || m.user?.role || m.role || '').toLowerCase();
  if (role === 'user' || role === 'customer') return true;
  const sender = (m.sender || '').toLowerCase();
  return sender === 'me' || sender === 'user' || !!m.userId;
};

const formatAttachments = (attachments) => {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((a) => {
    const url = typeof a === 'string' ? a : a?.url || a?.uri || a?.path;
    if (!url) return null;
    return {
      full: url,
      thumb: toThumbnail(url),
    };
  }).filter(Boolean);
};

const toTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

const TicketDetailScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTicket(id);
      setTicket(res.ticket || null);
    } catch (e) {
      setError(e.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchTicket);
    return unsub;
  }, [navigation, fetchTicket]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Build the chat thread: the ticket's own `message` + `attachments` form the
  // first (user) bubble, then `replies` in oldest-to-newest order.
  const thread = [];
  if (ticket?.message) {
    thread.push({
      _id: `original-${ticket._id || ticket.id}`,
      message: ticket.message,
      attachments: ticket.attachments,
      createdAt: ticket.createdAt,
      senderRole: 'user',
      user: ticket.user,
    });
  }
  const replies = Array.isArray(ticket?.replies)
    ? ticket.replies
    : Array.isArray(ticket?.messages)
    ? ticket.messages
    : [];
  thread.push(...replies);

  const onSend = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await replyToTicket(id, { message: text, attachments: [] });
      setTicket(res.ticket || ticket);
      setReply('');
    } catch (e) {
      Alert.alert('Could not send reply', e.message || 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    Alert.alert('Close ticket', 'Mark this ticket as closed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await closeTicket(id);
            setTicket(res.ticket || ticket);
          } catch (e) {
            Alert.alert('Could not close', e.message || 'Something went wrong.');
          }
        },
      },
    ]);
  };

  const status = (ticket?.status || 'open').toLowerCase();
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.open;

  const renderMessage = ({ item }) => {
    const mine = isMine(item);
    const itemAttachments = formatAttachments(item.attachments);
    return (
      <View
        style={[
          styles.msgBubble,
          mine ? styles.msgRight : styles.msgLeft,
        ]}
      >
        {!mine ? (
          <Text style={styles.msgAuthor}>
            {item.user?.name || item.authorName || 'Support'}
          </Text>
        ) : null}
        <Text style={styles.msgText}>{toText(item)}</Text>
        {itemAttachments.length > 0 ? (
          <View style={styles.attachmentsContainer}>
            {itemAttachments.map((att, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => {
                  if (att.full) {
                    setPreviewImage(att.full);
                  }
                }}
              >
                <Image
                  source={{ uri: att.thumb || att.full }}
                  style={styles.attachedImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <Text style={styles.msgTime}>{toTime(item.createdAt || item.created_at)}</Text>
      </View>
    );
  };

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ticket?.subject || 'Ticket'}
          </Text>
          {ticket && status !== 'closed' ? (
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Icon
                name={status === 'resolved' ? 'checkmark-done' : 'checkmark-done-outline'}
                size={22}
                color={status === 'resolved' ? '#2196F3' : '#FF6B6B'}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#7C74FF" size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={fetchTicket}
              activeOpacity={0.85}
            >
              <Icon name="reload" size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: `${statusColor}20` },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {status.toUpperCase()}
                </Text>
              </View>
              {ticket?.category ? (
                <Text style={styles.category}>{ticket.category}</Text>
              ) : null}
              {ticket?.createdAt ? (
                <Text style={styles.createdAt}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </Text>
              ) : null}
            </View>

            <FlatList
              data={thread}
              keyExtractor={(_, i) => `msg-${i}`}
              renderItem={renderMessage}
              contentContainerStyle={styles.thread}
              showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyThread />}
            />
          </>
        )}

        <KeyboardAvoidingView
          style={styles.composerRow}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          keyboardVerticalOffset={80}
        >
          {status !== 'closed' ? (
            <>
              <TextInput
                style={styles.replyInput}
                placeholder="Type a reply..."
                placeholderTextColor="#6B7280"
                value={reply}
                onChangeText={setReply}
                onSubmitEditing={onSend}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!reply.trim() || sending) && styles.sendBtnDisabled,
                ]}
                onPress={onSend}
                activeOpacity={0.8}
                disabled={!reply.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Icon name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.closedNotice}>
              <Text style={styles.closedText}>Ye ticket band hai</Text>
            </View>
          )}
        </KeyboardAvoidingView>

        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPreviewImage(null)}
        >
          <TouchableWithoutFeedback onPress={() => setPreviewImage(null)}>
            <View style={styles.imagePreviewOverlay}>
              <Image
                source={{ uri: previewImage }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default TicketDetailScreen;

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
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: -30,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#FF6B6B', fontSize: moderateScale(13), marginBottom: 12 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#243057',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: { color: '#A79BFF', fontSize: moderateScale(12) },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: moderateScale(11), fontWeight: '700' },
  category: {
    fontSize: moderateScale(12),
    color: '#9FB0D2',
    textTransform: 'capitalize',
  },
  createdAt: {
    fontSize: moderateScale(11),
    color: '#6B7280',
    marginLeft: 'auto',
  },
  thread: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  msgLeft: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 6,
  },
  msgRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#3A3F72',
    borderTopRightRadius: 6,
  },
  msgAuthor: { color: '#A79BFF', fontSize: moderateScale(11), marginBottom: 2 },
  msgText: { color: '#FFFFFF', fontSize: moderateScale(13.5) },
  msgTime: {
    color: '#6B7280',
    fontSize: moderateScale(10),
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyThread: {
    color: '#6B7280',
    fontSize: moderateScale(12.5),
    textAlign: 'center',
    marginTop: 24,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  attachedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  closedNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#9FB0D2',
    fontSize: moderateScale(12),
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: '90%',
    height: '80%',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.18)',
  },
  sendBtn: {
    backgroundColor: '#7C74FF',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
