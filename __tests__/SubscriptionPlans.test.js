import { getPlans } from '../src/api/subscriptions';

jest.mock('../src/api/client', () => ({
  apiRequest: jest.fn(),
}));

const { apiRequest } = require('../src/api/client');

const API_RESPONSE = {
  total: 36,
  plans: [
    {
      _id: '6943dbda7920168d35ceeb94',
      name: 'Basic Starter',
      description: 'Get started with essential features...',
      type: 'monthly',
      price: 99,
      durationInDays: 30,
      benefits: ['Stream in HD quality', 'Watch on 1 device at a time'],
      limitations: ['Limited to 1 simultaneous stream'],
      sortOrder: 0,
      isPopular: false,
    },
    {
      _id: '6943dba47920168d35ceeb90',
      name: 'Premium Plus',
      description: 'Unlock unlimited access...',
      type: 'monthly',
      price: 199,
      durationInDays: 30,
      benefits: ['Unlimited ad-free streaming in 4K Ultra HD'],
      limitations: ['Maximum 5 devices can be registered per account'],
      sortOrder: 0,
      isPopular: false,
    },
  ],
};

describe('subscription plans', () => {
  beforeEach(() => apiRequest.mockReset());

  it('formats plans from the public /subscriptions/plans endpoint', async () => {
    apiRequest.mockResolvedValueOnce({ success: true, data: API_RESPONSE.plans });

    const res = await getPlans();
    expect(res.success).toBe(true);
    expect(res.plans).toHaveLength(2);

    const basic = res.plans.find((p) => p.id === '6943dbda7920168d35ceeb94');
    expect(basic.name).toBe('Basic Starter');
    expect(basic.price).toBe(99); // rupees, not paise
    expect(basic.canPurchase).toBe(true);
    expect(basic.isPopular).toBe(false);
    expect(basic.benefits).toHaveLength(2);
    expect(basic.limitations).toHaveLength(1);
    expect(basic.currency).toBe('INR');

    const premium = res.plans.find((p) => p.id === '6943dba47920168d35ceeb90');
    expect(premium.price).toBe(199);
    expect(premium.canPurchase).toBe(true);
  });

  it('marks a free / price-less plan as not purchasable', async () => {
    apiRequest.mockResolvedValueOnce({
      success: true,
      data: [{ _id: 'free', name: 'Free', price: 0 }],
    });
    const res = await getPlans();
    expect(res.plans[0].canPurchase).toBe(false);
  });
});
