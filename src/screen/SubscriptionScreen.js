import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import subscriptionService from '../api/subscriptions';
import { scale } from '../utils/Scalling';

const SubscriptionScreen = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionService.getAllSubscriptions();

      if (response.success) {
        setSubscriptions(response.data.data || []);
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

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan._id);
  };
  const renderSubscriptionCard = (plan, index) => {
    const isSelected = selectedPlan === plan._id;
    const isPremium = plan.price >= 199;
    return (
      <View key={plan._id} style={[styles.card, isSelected && styles.selectedCard]}>
        {/* Header Section */}
        <LinearGradient
          colors={isPremium ? ['#FFD700', '#FFA500'] : ['#4A6BFF', '#6B8AFF']}
          style={styles.cardHeader}
        >
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planType}>{plan.type.toUpperCase()}</Text>
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.cardContent}>
          <Text style={styles.planDescription}>{plan.description}</Text>

          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.duration}>/{plan.durationInDays} days</Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Benefits</Text>
            </View>
            {plan.benefits.map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
                <Icon name="add" size={14} color="#4CAF50" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Limitations Section */}
          {plan.limitations && plan.limitations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="remove-circle" size={18} color="#FF6B6B" />
                <Text style={styles.sectionTitle}>Limitations</Text>
              </View>
              {plan.limitations.map((limitation, idx) => (
                <View key={idx} style={styles.limitationItem}>
                  <Icon name="remove" size={14} color="#FF6B6B" />
                  <Text style={styles.limitationText}>{limitation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Select Button */}
          <TouchableOpacity
            style={[styles.selectButton, isSelected && styles.selectedButton]}
            onPress={() => handleSelectPlan(plan)}
          >
            <Text style={[styles.selectButtonText, isSelected && styles.selectedButtonText]}>
              {isSelected ? 'Selected' : 'Select Plan'}
            </Text>
          </TouchableOpacity>
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
});

export default SubscriptionScreen;
