import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { getMyPlan, toRupees } from '../api/subscriptions';
import { moderateScale } from '../utils/Scalling';

const MyPlanScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyPlan();
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', fetchPlan);
    return unsub;
  }, [navigation, fetchPlan]);

  const renderCurrentPlan = () => {
    if (!data?.current) return null;
    const plan = data.current.plan || {};
    const end = data.current.endDate
      ? new Date(data.current.endDate).toLocaleDateString()
      : '';
    return (
      <View style={styles.planCard}>
        <LinearGradient
          colors={['#6C63FF', '#4A3FF5']}
          style={styles.planCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.planName}>{plan.name || 'Unknown Plan'}</Text>
          <Text style={styles.planType}>{plan.type?.toUpperCase() || ''}</Text>
        </LinearGradient>
        <View style={styles.planDetails}>
          {end ? (
            <Text style={styles.validText}>Valid till {end}</Text>
          ) : null}
          {typeof data.current.daysLeft === 'number' ? (
            <Text style={styles.daysLeft}>{data.current.daysLeft} din bache</Text>
          ) : null}
          {data.current.amountPaid > 0 ? (
            <Text style={styles.amountPaid}>Paid: {toRupees(data.current.amountPaid)}</Text>
          ) : null}
          <Text style={styles.statusBadge}>
            Status: {data.current.status || 'unknown'}
          </Text>

          {data.current.source === 'admin_grant' ? null : typeof data.current.amountPaid === 'number' && data.current.amountPaid > 0 ? (
            <Text style={styles.receiptText}>
              Receipt: {data.current.paymentId || 'N/A'}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderScheduled = () => {
    if (!data?.scheduled?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Renewal</Text>
        {data.scheduled.map((s) => {
          const start = s.startDate ? new Date(s.startDate).toLocaleDateString() : '';
          const plan = s.plan || {};
          return (
            <View key={s.id} style={styles.scheduledItem}>
              <Text style={styles.scheduledName}>{plan.name || 'Plan'}</Text>
              <Text style={styles.scheduledDate}>{start ? `Shuru: ${start}` : ''}</Text>
              <Text style={styles.scheduledAmount}>{toRupees(s.amountPaid || 0)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRenewButton = () => {
    if (!data?.canRenew) return null;
    return (
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Subscription')}
      >
        <LinearGradient
          colors={['#6C63FF', '#4A3FF5']}
          style={styles.actionBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.actionBtnText}>Renew Plan</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderUpgradeOptions = () => {
    if (!data?.upgradeEnabled || !data?.upgradeOptions?.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upgrade Options</Text>
        {data.upgradeOptions.map((opt, idx) => {
          const plan = opt.plan || {};
          return (
            <View key={idx} style={styles.upgradeItem}>
              <View>
                <Text style={styles.upgradePlanName}>{plan.name || 'Plan'}</Text>
                <Text style={styles.upgradeDetails}>
                  ₹{((opt.planPrice || 0) / 100).toFixed(2)} − ₹{((opt.creditApplied || 0) / 100).toFixed(2)} credit = ₹{((opt.payable || 0) / 100).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.upgradeBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.upgradeBtnText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <View style={styles.center}>
          <ActivityIndicator color="#6C63FF" size="large" />
          <Text style={styles.loadingText}>Loading plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>My Plan</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <>
              {!data?.isSubscribed ? (
                <View style={styles.emptyPlan}>
                  <Icon name="lock-closed" size={48} color="#6B7280" />
                  <Text style={styles.emptyTitle}>Aapka koi plan nahi hai</Text>
                  <Text style={styles.emptyText}>
                    Choose a subscription plan to unlock premium content.
                  </Text>
                  <TouchableOpacity
                    style={styles.ctaBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Subscription')}
                  >
                    <LinearGradient
                      colors={['#6C63FF', '#4A3FF5']}
                      style={styles.ctaBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.ctaBtnText}>Browse Plans</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {renderCurrentPlan()}
                  {renderScheduled()}
                  {renderRenewButton()}
                  {renderUpgradeOptions()}
                </>
              )}

              <TouchableOpacity
                style={styles.historyLink}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SubscriptionHistory')}
              >
                <Text style={styles.historyLinkText}>View subscription history</Text>
                <Icon name="chevron-forward" size={16} color="#A79BFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.historyLink}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Transactions')}
              >
                <Text style={styles.historyLinkText}>View transactions</Text>
                <Icon name="chevron-forward" size={16} color="#A79BFF" />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { color: '#9FB0D2', marginTop: 12, fontSize: moderateScale(14) },
  errorText: { color: '#FF6B6B', fontSize: moderateScale(14) },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.12)',
  },
  planCardGradient: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: { fontSize: moderateScale(18), fontWeight: '700', color: '#FFFFFF' },
  planType: { fontSize: moderateScale(11), fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  planDetails: { padding: 16, gap: 6 },
  validText: { color: '#FFFFFF', fontSize: moderateScale(13), fontWeight: '600' },
  daysLeft: { color: '#FF9800', fontSize: moderateScale(14), fontWeight: '700' },
  amountPaid: { color: '#9FB0D2', fontSize: moderateScale(12) },
  statusBadge: {
    color: '#4CAF50',
    fontSize: moderateScale(12),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  receiptText: { color: '#6B7280', fontSize: moderateScale(11) },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginBottom: 12,
  },
  scheduledItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.08)',
  },
  scheduledName: { color: '#FFFFFF', fontSize: moderateScale(13), fontWeight: '600' },
  scheduledDate: { color: '#9FB0D2', fontSize: moderateScale(12), marginTop: 2 },
  scheduledAmount: { color: '#6B7280', fontSize: moderateScale(11), marginTop: 2 },
  actionBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 8 },
  actionBtnGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionBtnText: { color: '#FFFFFF', fontSize: moderateScale(15), fontWeight: '700' },
  upgradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.08)',
  },
  upgradePlanName: { color: '#FFFFFF', fontSize: moderateScale(13), fontWeight: '600' },
  upgradeDetails: { color: '#9FB0D2', fontSize: moderateScale(11), marginTop: 2 },
  upgradeBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeBtnText: { color: '#FFFFFF', fontSize: moderateScale(12), fontWeight: '700' },
  emptyPlan: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { color: '#FFFFFF', fontSize: moderateScale(16), fontWeight: '700', marginTop: 12 },
  emptyText: { color: '#9FB0D2', fontSize: moderateScale(12), marginTop: 8, textAlign: 'center' },
  ctaBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 20 },
  ctaBtnGradient: { paddingVertical: 12, paddingHorizontal: 30, alignItems: 'center' },
  ctaBtnText: { color: '#FFFFFF', fontSize: moderateScale(15), fontWeight: '700' },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140,130,255,0.08)',
  },
  historyLinkText: { color: '#9FB0D2', fontSize: moderateScale(14) },
});

export default MyPlanScreen;
