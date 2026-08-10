// Simple authentication API service for demo purposes
// In a real app, this would connect to your backend API

class AuthService {
  // Simulate API delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate a random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via API
  async sendOTP(mobileNumber, role = 'user') {
    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    try {
      console.log('Sending OTP request for mobile:', mobileNumber);
      const response = await fetch('https://iftv-ott.onrender.com/iftv-ott/auth/loginOrSignin-with-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobileNumber, // Send as string
          role: role
        }),
      });

      console.log('Response status:', response);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok) {
        // Assuming the API sends OTP and returns success
        console.log(`OTP sent to ${mobileNumber}`);
        return {
          success: true,
          message: data.message || 'OTP sent successfully',
          sessionId: data.data?.otpData?.Details, // Capture sessionId from data.otpData.Details
        };
      } else {
        throw new Error(data.message || `Failed to send OTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Network error or invalid response from server');
    }
  }

  // Register user
  async register(userData) {
    try {
      console.log('Registering user:', userData);
      const response = await fetch('https://iftv-ott.onrender.com/iftv-ott/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Register response status:', response.status);
      const responseText = await response.text();
      console.log('Register response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Registration successful',
          user: data.data?.user,
          token: data.data?.token
        };
      } else {
        throw new Error(data.message || `Registration failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error('Network error or invalid response from server');
    }
  }

  // Verify OTP via API
  async verifyOTP(mobileNumber, otp, sessionId) {
    // Validate inputs
    if (!/^\d{10}$/.test(mobileNumber)) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    if (!/^\d{6}$/.test(otp)) {
      throw new Error('Please enter a valid 6-digit OTP');
    }

    try {
      const requestBody = {
        sessionId: sessionId,
        mobile: parseInt(mobileNumber),
        otp: otp,
        fcmToken: "adskfrghskjhdfghsj", // TODO: Get actual FCM token
        currentScreen: "LANDING"
      };
      console.log(sessionId,"this is sessionId");
      const apiUrl = 'https://iftv-ott.onrender.com/iftv-ott/auth/verify-otp-mobile';
      console.log('Verifying OTP for mobile:', mobileNumber, 'OTP:', otp);
      console.log('API URL:', apiUrl);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Verify OTP response status:', response.status);
      const responseText = await response.text();
      console.log('Verify OTP response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Verify OTP parsed data:', data);

      if (response.ok) {
        // Try different possible response structures
        let authToken = data.data?.token || data.token;
        let userData = data.data?.user || data.data || data.user;

        console.log('Extracted token:', authToken);
        console.log('Extracted user data:', userData);

        if (!authToken) {
          throw new Error('No authentication token in response');
        }

        // Store user session
        this.userSession = {
          mobileNumber,
          authToken,
          loginTime: new Date().toISOString(),
          user: userData
        };

        return {
          success: true,
          message: data.message || 'OTP verified successfully',
          token: authToken,
          user: userData
        };
      } else {
        throw new Error(data.message || `Failed to verify OTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Network error or invalid response from server');
    }
  }

  // Get current user session
  getCurrentUser() {
    return this.userSession;
  }

  // Logout (clear session)
  logout() {
    this.userSession = null;
    this.storedOTP = null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.userSession;
  }

  // Get user profile from API
  async getUser(token) {
    try {
      console.log('Fetching user profile with token:', token);
      const response = await fetch('https://iftv-ott.onrender.com/iftv-ott/users/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Get user response status:', response.status);
      const responseText = await response.text();
      console.log('Get user response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok) {
        return {
          success: true,
          user: data.data, // User data is directly in data.data
        };
      } else {
        throw new Error(data.message || `Failed to get user: ${response.status}`);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Network error or invalid response from server');
    }
  }
}

// Export singleton instance
export default new AuthService();