import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getSubscriptionHistory,
  toRupees,
} from '../api/subscriptions';
import { moderateScale } from '../utils/Scalling';

const STATUS_LABELS = {
  active: { label: 'Active', color: '#4CAF50' },
  scheduled: { label: 'Scheduled', color: '#FF9800' },
  expired: { label: 'Expired', color: '#9E9E9E' },
  upgraded: { label: 'Upgraded', color: '#2196F3' },
  cancelled: { label: 'Cancelled', color: '#F44336' },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
};

const SubscriptionHistoryScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (pageNum, { isRefresh = false } = {}) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await getSubscriptionHistory({ page: pageNum, limit: 10 });
        setItems(isRefresh ? res.data : (prev) => [...prev, ...res.data]);
        setTotalPages(res.totalPages || 0);
        setPage(res.page || pageNum);
      } catch (e) {
        setError(e.message || 'Failed to load history');
        if (pageNum === 1 && !isRefresh) setItems([]);
      } finally {
        setRefreshing(false);
        if (pageNum === 1) setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(1));
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => load(1, { isRefresh: true });
  const onEndReached = () => {
    if (loading || refreshing) return;
    if (page < totalPages) load(page + 1);
  };

  const renderItem = ({ item }) => {
    const badge = STATUS_LABELS[item.status] || STATUS_LABELS.expired;
    const plan = item.plan || {};
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View>
            <Text style={styles.planName}>{plan.name || 'Unknown Plan'}</Text>
            <Text style={styles.source}>{item.source || ''}</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: `${badge.color}20` }]}>
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start:</Text>
            <Text style={styles.detailValue}>{formatDate(item.startDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End:</Text>
            <Text style={styles.detailValue}>{formatDate(item.endDate)}</Text>
          </View>
          {item.daysLeft != null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Days left:</Text>
              <Text style={styles.detailValue}>{item.daysLeft}</Text>
            </View>
          )}
          {item.amountPaid > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Paid:</Text>
              <Text style={styles.detailValue}>{toRupees(item.amountPaid)}</Text>
            </View>
          )}
        </View>
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
          <Text style={styles.headerTitle}>Subscription History</Text>
          <View style={styles.backButton} />
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color="#6C63FF" size="large" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : error && items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && items.length > 0 ? (
                <ActivityIndicator color="#6C63FF" style={styles.footer} />
              ) : null
            }
            ListEmptyComponent={
              !loading && !error ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No subscription history yet.</Text>
                </View>
              ) : null
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
            removeClippedSubviews
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

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
  scrollView: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingBottom: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { color: '#9FB0D2', marginTop: 12, fontSize: moderateScale(14) },
  errorText: { color: '#FF6B6B', fontSize: moderateScale(14) },
  emptyText: { color: '#6B7280', fontSize: moderateScale(14) },
  footer: { marginVertical: 16 },
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
    marginBottom: 8,
  },
  planName: { color: '#FFFFFF', fontSize: moderateScale(14), fontWeight: '600' },
  source: { color: '#9FB0D2', fontSize: moderateScale(11) },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: moderateScale(11), fontWeight: '700' },
  itemDetails: { gap: 4 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailLabel: { color: '#9FB0D2', fontSize: moderateScale(12) },
  detailValue: { color: '#FFFFFF', fontSize: moderateScale(12), fontWeight: '500' },
});

export default SubscriptionHistoryScreen;
