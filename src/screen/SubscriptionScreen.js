import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getPlans,
  getQuote,
  createOrder,
  verifyPayment,
  reportFailedPayment,
} from '../api/subscriptions';

const SubscriptionScreen = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPlans();

      if (response.success) {
        setSubscriptions(response.plans || []);
      } else {
        setError(response.message || 'Failed to load subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (plan) => {
    if (!plan.canPurchase || plan.price === 0) {
      return;
    }
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS purchase not supported',
        'Please buy your plan on the IFTV-OTT website.',
      );
      return;
    }

    setPurchasing(true);
    let orderId = null;
    try {
      const quoteRes = await getQuote(plan.id);
      if (!quoteRes.success) {
        Alert.alert('Cannot purchase', quoteRes.message || 'Plan not available right now.');
        return;
      }

      const orderRes = await createOrder(plan.id, 'android');
      if (!orderRes.success) {
        if (orderRes.iosBlocked) {
          Alert.alert('Not available on iOS', orderRes.message);
          return;
        }
        Alert.alert('Could not create order', orderRes.message || 'Please try again.');
        return;
      }

      orderId = orderRes.payment?._id || orderRes.checkout?.order_id;
      const checkout = orderRes.checkout;

      if (!checkout) {
        Alert.alert('Error', 'No checkout data received.');
        return;
      }

      // Use the Razorpay SDK via a lazy dynamic import so the module is only
      // pulled in on Android where it exists.
      const Razorpay = (await import('react-native-razorpay')).default;
      const options = {
        name: checkout.name,
        description: checkout.description,
        order_id: checkout.order_id,
        amount: checkout.amount,
        currency: checkout.currency,
        prefill: checkout.prefill,
        notes: checkout.notes,
      };

      const payment = await Razorpay.open(options);
      if (!payment || !payment.razorpay_payment_id) {
        await reportFailedPayment({
          razorpay_order_id: checkout.order_id,
          reason: 'User closed checkout',
        }).catch(() => {});
        return;
      }

      const verifyRes = await verifyPayment({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });

      if (verifyRes.success) {
        Alert.alert('Payment successful', 'Your plan is now active!', [
          { text: 'OK', onPress: () => navigation.replace('Main', { screen: 'Profile' }) },
        ]);
      } else {
        Alert.alert('Verification failed', 'Payment may have been processed. Check My Plan.');
      }
    } catch (e) {
      if (e.code === 'RazorpayPaymentCancelledError' || e.code === 'PAYMENT_CANCELLED') {
        await reportFailedPayment({
          razorpay_order_id: orderId || '',
          reason: 'User cancelled payment',
        }).catch(() => {});
      } else {
        Alert.alert('Payment error', e.message || 'Something went wrong.');
      }
    } finally {
      setPurchasing(false);
    }
  };
  const renderSubscriptionCard = (plan, index) => {
    const isSelected = selectedPlan?.id === plan.id;
    const isPremium = plan.price >= 199;
    return (
      <View key={plan.id} style={[styles.card, isSelected && styles.selectedCard]}>
        <LinearGradient
          colors={isPremium ? ['#FFD700', '#FFA500'] : ['#4A6BFF', '#6B8AFF']}
          style={styles.cardHeader}
        >
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planType}>{plan.type.toUpperCase()}</Text>
          {plan.isPopular && (
            <View style={styles.popularBadge}>
              <Icon name="star" size={10} color="#FFD700" />
              <Text style={styles.popularText}>Most popular</Text>
            </View>
          )}
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.cardContent}>
          {(plan.benefits.length > 0 || plan.limitations.length > 0) && (
            <>
              {plan.benefits.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icon name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Benefits</Text>
                  </View>
                  {plan.benefits.map((benefit, idx) => (
                    <View key={`b-${idx}`} style={styles.benefitItem}>
                      <Icon name="add" size={14} color="#4CAF50" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              )}

              {plan.limitations && plan.limitations.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icon name="remove-circle" size={18} color="#FF6B6B" />
                    <Text style={styles.sectionTitle}>Limitations</Text>
                  </View>
                  {plan.limitations.map((limitation, idx) => (
                    <View key={`l-${idx}`} style={styles.limitationItem}>
                      <Icon name="remove" size={14} color="#FF6B6B" />
                      <Text style={styles.limitationText}>{limitation}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.duration}>/{plan.durationInDays} days</Text>
          </View>

          {plan.price === 0 ? (
            <Text style={styles.freeLabel}>Free</Text>
          ) : (
            <TouchableOpacity
              style={[styles.buyButton, isSelected && styles.buyButtonSelected]}
              onPress={() => handleBuy(plan)}
              disabled={purchasing}
              activeOpacity={0.85}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buyButtonText}>Buy Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6BFF" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Icon name="diamond" size={32} color="#FFD700" />
          <Text style={styles.mainTitle}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>Select the perfect subscription for you</Text>
        </View>

        {/* Subscription Cards */}
        {subscriptions.map((plan, index) => renderSubscriptionCard(plan, index))}

        {/* Footer Info */}
        <View style={styles.footer}>
          <Icon name="shield-checkmark" size={16} color="#888" />
          <Text style={styles.footerText}>Secure payment • Cancel anytime</Text>
        </View>

        <TouchableOpacity
          style={styles.managePlansBtn}
          onPress={() => navigation.navigate('MyPlan')}
          activeOpacity={0.8}
        >
          <Text style={styles.managePlansText}>View My Plans &amp; History</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A6BFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#4A6BFF',
  },
  cardHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  planDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 15,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2D2D44',
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A6BFF',
  },
  price: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4A6BFF',
  },
  duration: {
    fontSize: 16,
    color: '#888',
    marginLeft: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
    lineHeight: 20,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 10,
  },
  limitationText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9999',
    marginLeft: 8,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#4A6BFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  selectedButton: {
    backgroundColor: 'rgba(74, 107, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#4A6BFF',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedButtonText: {
    color: '#4A6BFF',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginTop: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: '#4A6BFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buyButtonSelected: {
    backgroundColor: 'rgba(74, 107, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#4A6BFF',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  freeLabel: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 8,
  },
  managePlansBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  managePlansText: {
    color: '#A79BFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SubscriptionScreen;
