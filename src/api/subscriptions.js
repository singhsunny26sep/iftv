// Subscriptions API service

class SubscriptionService {
  async getAllSubscriptions() {
    try {
      const response = await fetch('https://iftv-ott.onrender.com/iftv-ott/subscriptions/get-all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Subscriptions fetched',
          data: data.data,
        };
      } else {
        throw new Error(data.message || `Failed to fetch subscriptions: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error('Network error or invalid response from server');
    }
  }

  async getSubscriptionById(subscriptionId, token) {
    try {
      const response = await fetch(`https://iftv-ott.onrender.com/iftv-ott/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Subscription fetched',
          data: data.data,
        };
      } else {
        throw new Error(data.message || `Failed to fetch subscription: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw new Error('Network error or invalid response from server');
    }
  }
}

export default new SubscriptionService();
