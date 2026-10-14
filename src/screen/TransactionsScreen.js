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
import { getTransactions, toRupees } from '../api/subscriptions';
import { moderateScale } from '../utils/Scalling';

const STATUS_LABELS = {
  paid: { label: 'Paid', color: '#4CAF50', icon: 'checkmark-circle' },
  failed: { label: 'Failed', color: '#F44336', icon: 'close-circle' },
  expired: { label: 'Expired', color: '#9E9E9E', icon: 'time' },
  created: { label: 'Pending', color: '#FF9800', icon: 'hourglass' },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
};

const TransactionsScreen = ({ navigation }) => {
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
        const res = await getTransactions({ page: pageNum, limit: 10 });
        setItems(isRefresh ? res.data : (prev) => [...prev, ...res.data]);
        setTotalPages(res.totalPages || 0);
        setPage(res.page || pageNum);
      } catch (e) {
        setError(e.message || 'Failed to load transactions');
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
    const badge = STATUS_LABELS[item.status] || STATUS_LABELS.created;
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{item.planName || 'Plan'}</Text>
            <Text style={styles.receipt}>Receipt: {item.receipt || 'N/A'}</Text>
          </View>
          <Text style={[styles.amount, item.status === 'failed' && styles.amountFailed]}>
            {toRupees(item.amount)}
          </Text>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Icon name={badge.icon} size={14} color={badge.color} />
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={styles.methodText}>
            {item.method
              ? item.method.charAt(0).toUpperCase() + item.method.slice(1)
              : '—'}
          </Text>
          {item.purpose === 'upgrade' && item.creditApplied > 0 ? (
            <Text style={styles.creditText}>
              ₹{((item.creditApplied || 0) / 100).toFixed(2)} credit applied
            </Text>
          ) : null}
          {item.status === 'failed' && item.failureReason ? (
            <Text style={styles.failureReason}>
              {item.failureReason}
            </Text>
          ) : null}
        </View>

        <View style={styles.itemFooter}>
          <Text style={styles.dateText}>{formatDate(item.paidAt || item.createdAt)}</Text>
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
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={styles.backButton} />
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color="#6C63FF" size="large" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
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
                  <Text style={styles.emptyText}>No transactions yet.</Text>
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
  planInfo: { flex: 1 },
  planName: { color: '#FFFFFF', fontSize: moderateScale(14), fontWeight: '600' },
  receipt: { color: '#9FB0D2', fontSize: moderateScale(11) },
  amount: { color: '#4CAF50', fontSize: moderateScale(18), fontWeight: '700' },
  amountFailed: { color: '#F44336' },
  itemDetails: { gap: 4, marginBottom: 8 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: { fontSize: moderateScale(12), fontWeight: '600' },
  methodText: { color: '#9FB0D2', fontSize: moderateScale(12) },
  creditText: { color: '#FF9800', fontSize: moderateScale(11) },
  failureReason: { color: '#FF6B6B', fontSize: moderateScale(11) },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(140,130,255,0.08)',
    paddingTop: 8,
  },
  dateText: { color: '#6B7280', fontSize: moderateScale(11) },
});

export default TransactionsScreen;
