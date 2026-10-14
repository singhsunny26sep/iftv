// Subscriptions + Razorpay payments API (app-api.md §4).
//
// Money rules (app-api.md §4):
//   - plan.price is in rupees (e.g. 199 = ₹199)
//   - every payment amount field is in paise (e.g. 19900 = ₹199)
// Display as: `₹${(amountInPaise / 100).toFixed(2)}`.
import { apiRequest } from './client';

export const toRupees = (paise) =>
  `₹${(Number(paise || 0) / 100).toFixed(2)}`;

// ---- 4.1 Plans (public, no login) ----
export async function getPlans() {
  const payload = await apiRequest('/subscriptions/plans', { method: 'GET' });
  const plans = Array.isArray(payload?.data) ? payload.data : [];
  return {
    success: true,
    plans: plans.map(formatPlan).sort((a, b) => {
      // app-api.md: "display order mein (sortOrder, phir price)"
      if ((a.sortOrder || 0) !== (b.sortOrder || 0)) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return (a.price || 0) - (b.price || 0);
    }),
  };
}

export async function getPlan(planId) {
  const payload = await apiRequest(`/subscriptions/plans/${planId}`, {
    method: 'GET',
  });
  return { success: true, plan: formatPlan(payload?.data) };
}

const formatPlan = (plan) => ({
  id: plan._id || plan.id,
  name: plan.name || '',
  type: plan.type || '',
  price: plan.price || 0, // rupees
  currency: plan.currency || 'INR',
  durationInDays: plan.durationInDays || 0,
  benefits: plan.benefits || [],
  limitations: plan.limitations || [],
  sortOrder: plan.sortOrder || 0,
  isPopular: !!plan.isPopular,
  // ₹0 plan can't be bought -> hide the Buy button.
  canPurchase: (plan.price || 0) > 0,
});

// ---- 4.2 Quote (kitna dena hoga) ----
// 409 here means the upgrade isn't allowed yet; surface `blockedUntil`.
export async function getQuote(planId) {
  try {
    const payload = await apiRequest('/payments/quote', {
      method: 'GET',
      query: { planId },
    });
    const data = payload?.data;
    return {
      success: true,
      quote: {
        purpose: data?.purpose,
        planId: data?.planId,
        plan: formatPlan(data?.plan),
        planPrice: data?.planPrice,
        creditApplied: data?.creditApplied,
        payable: data?.payable,
        currency: data?.currency || 'INR',
        startsAt: data?.startsAt,
        endsAt: data?.endsAt,
        currentSubscriptionId: data?.currentSubscriptionId,
        blockedUntil: data?.blockedUntil || null,
      },
    };
  } catch (e) {
    if (e.status === 409) {
      return { success: false, blocked: true, message: e.message };
    }
    throw e;
  }
}

// ---- 4.5 Create order + Razorpay checkout ----
// iOS can't buy in-app (Apple rule). The server returns 403 for platform "ios".
export async function createOrder(planId, platform) {
  try {
    const payload = await apiRequest('/payments/create-order', {
      method: 'POST',
      body: { planId, platform },
    });
    const payment = payload?.data?.payment;
    const checkout = payload?.data?.checkout;
    const quote = payload?.data?.quote;
    return {
      success: true,
      payment: { ...payment },
      checkout: checkout
        ? {
            key: checkout.key,
            order_id: checkout.order_id,
            amount: checkout.amount,
            currency: checkout.currency,
            name: checkout.name,
            description: checkout.description,
            prefill: checkout.prefill,
            notes: checkout.notes,
          }
        : null,
      quote,
    };
  } catch (e) {
    if (e.status === 403) {
      return { success: false, iosBlocked: true, message: e.message };
    }
    throw e;
  }
}

// Build the options object the react-native-razorpay SDK expects.
export const buildRazorpayOptions = (checkout) => ({
  order_id: checkout.order_id,
  amount: checkout.amount, // paise, exactly as the server sent
  currency: checkout.currency,
  name: checkout.name,
  description: checkout.description,
  prefill: checkout.prefill,
  notes: checkout.notes,
});

// ---- 4.6 Verify ----
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const payload = await apiRequest('/payments/verify', {
    method: 'POST',
    body: {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    },
  });
  const data = payload?.data;
  return {
    success: true,
    alreadyProcessed: data?.alreadyProcessed || false,
    payment: data?.payment,
    subscription: data?.subscription,
  };
}

// ---- 4.7 Payment failed / cancelled ----
export async function reportFailedPayment({ razorpay_order_id, reason }) {
  const payload = await apiRequest('/payments/failed', {
    method: 'POST',
    body: { razorpay_order_id, reason },
  });
  return { success: true, payment: payload?.data };
}

// ---- 4.2 / 4.3 My plan + history ----
export async function getMyPlan() {
  const payload = await apiRequest('/subscriptions/my', { method: 'GET' });
  const data = payload?.data;
  return {
    success: true,
    isSubscribed: data?.isSubscribed || false,
    current: data?.current ? formatPeriod(data.current) : null,
    scheduled: (data?.scheduled || []).map(formatPeriod),
    canRenew: data?.canRenew || false,
    upgradeEnabled: data?.upgradeEnabled || false,
    upgradeOptions: (data?.upgradeOptions || []).map((o) => ({
      plan: formatPlan(o?.plan),
      planPrice: o?.planPrice,
      creditApplied: o?.creditApplied,
      payable: o?.payable,
      currency: o?.currency || 'INR',
    })),
  };
}

export async function getSubscriptionHistory({ page = 1, limit = 10 } = {}) {
  const payload = await apiRequest('/subscriptions/my/history', {
    method: 'GET',
    query: { page, limit },
  });
  return {
    success: true,
    total: payload?.data?.total || 0,
    totalPages: payload?.data?.totalPages || 0,
    page: payload?.data?.page || page,
    limit: payload?.data?.limit || limit,
    data: (payload?.data?.data || []).map(formatPeriod),
  };
}

const STATUS_BADGE = {
  active: { label: 'Active', color: '#4CAF50' },
  scheduled: { label: 'Scheduled', color: '#FF9800' },
  expired: { label: 'Expired', color: '#9E9E9E' },
  upgraded: { label: 'Upgraded', color: '#2196F3' },
  cancelled: { label: 'Cancelled', color: '#F44336' },
};

const formatPeriod = (p) => ({
  id: p._id || p.id,
  planId: p.planId,
  plan: p.plan ? formatPlan(p.plan) : null,
  status: p.status || 'expired',
  statusBadge: STATUS_BADGE[p.status] || STATUS_BADGE.expired,
  source: p.source || 'purchase',
  startDate: p.startDate,
  endDate: p.endDate,
  daysLeft: p.daysLeft || null,
  amountPaid: p.amountPaid || 0,
  creditApplied: p.creditApplied || 0,
  paymentId: p.paymentId || null,
  currency: p.currency || 'INR',
});

// ---- 4.8 Transactions ----
export async function getTransactions({ page = 1, limit = 10, status } = {}) {
  const payload = await apiRequest('/payments/my', {
    method: 'GET',
    query: { page, limit, status },
  });
  return {
    success: true,
    total: payload?.data?.total || 0,
    totalPages: payload?.data?.totalPages || 0,
    page: payload?.data?.page || page,
    limit: payload?.data?.limit || limit,
    data: (payload?.data?.data || []).map(formatTransaction),
  };
}

export async function getTransaction(id) {
  const payload = await apiRequest(`/payments/my/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  const data = payload?.data;
  return {
    success: true,
    payment: formatTransaction(data),
    subscription: data?.subscription || null,
  };
}

const TRANSACTION_STATUS = {
  paid: { label: 'Paid', color: '#4CAF50' },
  failed: { label: 'Failed', color: '#F44336' },
  expired: { label: 'Expired', color: '#9E9E9E' },
  created: { label: 'Pending', color: '#FF9800' },
};

const formatTransaction = (t) => ({
  id: t._id || t.id,
  receipt: t.receipt,
  planName: t.plan?.name,
  amount: t.amount || 0, // paise
  status: t.status || 'created',
  statusBadge: TRANSACTION_STATUS[t.status] || TRANSACTION_STATUS.created,
  purpose: t.purpose || 'new',
  creditApplied: t.creditApplied || 0,
  method: t.method || null,
  failureReason: t.failureReason || null,
  paidAt: t.paidAt || null,
  createdAt: t.createdAt,
});
