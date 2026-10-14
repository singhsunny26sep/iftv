import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getMyTickets } from '../api/support';
import { moderateScale } from '../utils/Scalling';

const STATUS_COLORS = {
  open: '#4CAF50',
  in_progress: '#FF9800',
  closed: '#9FB0D2',
  resolved: '#2196F3',
};

const formatTicket = (t) => ({
  id: t._id || t.id || t.ticketId,
  subject: t.subject || t.title || 'Untitled ticket',
  category: t.category || '',
  status: (t.status || 'open').toLowerCase(),
  createdAt: t.createdAt || t.created_at || null,
  updatedAt: t.updatedAt || t.lastReplyAt || t.updated_at || t.createdAt || null,
  replies: t.messages ? t.messages.length : t.replies ? t.replies.length : 0,
});

const timeAgo = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.max(0, Math.floor((now - d) / 1000));
    const m = Math.floor(diff / 60);
    const h = Math.floor(m / 60);
    const day = Math.floor(h / 24);
    if (day > 0) return `${day}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
  } catch (e) {
    return '';
  }
};

const EmptyTickets = () => (
  <View style={styles.emptyArea}>
    <Text style={styles.emptyTitle}>Abhi koi ticket nahi</Text>
    <Text style={styles.emptyText}>
      Naya ticket banane ke liye neeeche ka button dabao.
    </Text>
  </View>
);

const TicketsScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (pageNum, { isRefresh = false } = {}) => {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      setError(null);
      try {
        const res = await getMyTickets({ page: pageNum, limit: 10 });
        const next = (res.data || []).map(formatTicket);
        setTickets(isRefresh ? next : (prev) => [...prev, ...next]);
        setTotalPages(res.totalPages || 0);
        setPage(res.page || pageNum);
      } catch (e) {
        setError(e.message || 'Failed to load tickets');
        if (pageNum === 1 && !isRefresh) setTickets([]);
      } finally {
        setRefreshing(false);
        if (pageNum === 1) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const onRefresh = () => load(1, { isRefresh: true });
  const onEndReached = () => {
    if (loading || refreshing) return;
    if (page < totalPages) load(page + 1);
  };

  const renderItem = ({ item }) => {
    const color = STATUS_COLORS[item.status] || STATUS_COLORS.open;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.itemCard}
        onPress={() => navigation.navigate('TicketDetail', { id: item.id })}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.subject} numberOfLines={1}>
            {item.subject}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
        </View>
        {item.category ? (
          <Text style={styles.category}>{item.category}</Text>
        ) : null}
        <View style={styles.itemFooter}>
          <Text style={styles.time}>{timeAgo(item.updatedAt)}</Text>
          {item.replies > 0 ? (
            <Text style={styles.replies}>{item.replies} repl{item.replies === 1 ? 'y' : 'ies'}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>My Tickets</Text>
          <View style={styles.backButton} />
        </View>

        {error && !loading ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => load(1)}
              activeOpacity={0.85}
            >
              <Icon name="reload" size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && tickets.length > 0 ? (
                <ActivityIndicator color="#7C74FF" style={styles.footer} />
              ) : null
            }
            ListEmptyComponent={EmptyTickets}
            refreshing={refreshing}
            onRefresh={onRefresh}
            removeClippedSubviews
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateTicket')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7C74FF', '#5A4DF0']}
            style={styles.fabInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="add" size={26} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default TicketsScreen;

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
  listContent: { paddingHorizontal: 12, paddingBottom: 80 },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.12)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subject: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  category: {
    fontSize: moderateScale(11.5),
    color: '#9FB0D2',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  time: { fontSize: moderateScale(11), color: '#6B7280' },
  replies: { fontSize: moderateScale(11), color: '#9FB0D2' },
  emptyArea: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyText: { fontSize: moderateScale(12), color: '#6B7280', textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#5A4DF0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabInner: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  footer: { marginVertical: 16 },
});
