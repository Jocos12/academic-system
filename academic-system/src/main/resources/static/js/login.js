// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Get DOM elements
const emailStep = document.getElementById('emailStep');
const otpStep = document.getElementById('otpStep');
const emailForm = document.getElementById('emailForm');
const otpForm = document.getElementById('otpForm');
const emailInput = document.getElementById('email');
const emailDisplay = document.getElementById('emailDisplay');
const backBtn = document.getElementById('backBtn');
const resendOTPBtn = document.getElementById('resendOTP');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const otpInputs = document.querySelectorAll('.otp-input');
const roleButtons = document.querySelectorAll('.role-btn');

// Selected role (default: STUDENT)
let selectedRole = 'STUDENT';
let userEmail = '';

// Role selection
roleButtons.forEach((btn) => {
  btn.addEventListener('click', function () {
    roleButtons.forEach((b) => b.classList.remove('active'));
    this.classList.add('active');
    selectedRole = this.getAttribute('data-role');
  });
});

// Step 1: Request OTP
emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  userEmail = emailInput.value.trim();

  if (!userEmail) {
    showError('Please enter your email');
    return;
  }

  if (!isValidEmail(userEmail)) {
    showError('Please enter a valid email address');
    return;
  }

  showLoading(true);
  hideError();

  try {
    console.log('Sending OTP request for:', userEmail);

    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email: userEmail }),
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data);

      // Show OTP step
      emailDisplay.textContent = userEmail;
      emailStep.classList.remove('active');
      otpStep.classList.add('active');

      // Focus first OTP input
      otpInputs[0].focus();
    } else {
      // Handle error response
      let errorText = 'Failed to send OTP. Please try again.';

      try {
        const errorData = await response.json();
        errorText = errorData.error || errorData.message || errorText;
      } catch (e) {
        // If JSON parsing fails, try text
        errorText = await response.text();
      }

      console.error('Error response:', errorText);
      showError(errorText);
    }
  } catch (error) {
    console.error('Network error:', error);
    showError('Network error. Please check your connection and ensure the backend is running.');
  } finally {
    showLoading(false);
  }
});

// OTP Input handling (auto-focus next input)
otpInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      e.target.value = '';
      return;
    }

    // Move to next input if value entered
    if (value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  // Handle backspace
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });

  // Handle paste
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').split('');

    digits.forEach((digit, i) => {
      if (index + i < otpInputs.length) {
        otpInputs[index + i].value = digit;
      }
    });

    // Focus last filled input or next empty
    const lastIndex = Math.min(index + digits.length, otpInputs.length - 1);
    otpInputs[lastIndex].focus();
  });
});

// Step 2: Verify OTP and Login
otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect OTP from inputs
  const otpCode = Array.from(otpInputs)
    .map((input) => input.value)
    .join('');

  if (otpCode.length !== 6) {
    showError('Please enter all 6 digits');
    return;
  }

  showLoading(true);
  hideError();

  try {
    console.log('Verifying OTP for:', userEmail);

    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: userEmail,
        otp: otpCode,
      }),
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('Login successful:', userData);

      // Check if user role matches selected role
      if (userData.role !== selectedRole) {
        showError(
          `This account is registered as ${userData.role}. Please select the correct portal.`
        );
        return;
      }

      // Store user data in sessionStorage
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('userRole', userData.role);
      sessionStorage.setItem('userId', userData.id);
      sessionStorage.setItem('userEmail', userData.email);

      // Redirect based on role
      redirectToDashboard(userData.role);
    } else {
      let errorText = 'Invalid or expired OTP';

      try {
        const errorData = await response.json();
        errorText = errorData.error || errorData.message || errorText;
      } catch (e) {
        errorText = await response.text();
      }

      console.error('Verification error:', errorText);
      showError(errorText);

      // Clear OTP inputs
      otpInputs.forEach((input) => (input.value = ''));
      otpInputs[0].focus();
    }
  } catch (error) {
    console.error('Network error:', error);
    showError('Network error. Please check your connection.');
  } finally {
    showLoading(false);
  }
});

// Back button
backBtn.addEventListener('click', () => {
  otpStep.classList.remove('active');
  emailStep.classList.add('active');

  // Clear OTP inputs
  otpInputs.forEach((input) => (input.value = ''));
  hideError();
});

// Resend OTP
resendOTPBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  showLoading(true);
  hideError();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email: userEmail }),
    });

    if (response.ok) {
      const data = await response.json();

      // Show success message
      showError(data.message || 'New OTP sent to your email', 'success');
      setTimeout(hideError, 3000);

      // Clear OTP inputs
      otpInputs.forEach((input) => (input.value = ''));
      otpInputs[0].focus();
    } else {
      let errorText = 'Failed to resend OTP';

      try {
        const errorData = await response.json();
        errorText = errorData.error || errorData.message || errorText;
      } catch (e) {
        errorText = await response.text();
      }

      showError(errorText);
    }
  } catch (error) {
    console.error('Network error:', error);
    showError('Network error. Please try again.');
  } finally {
    showLoading(false);
  }
});

// Helper Functions

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showLoading(show) {
  if (show) {
    loadingSpinner.classList.add('active');
  } else {
    loadingSpinner.classList.remove('active');
  }
}

function showError(message, type = 'error') {
  errorMessage.textContent = message;
  errorMessage.classList.add('active');

  if (type === 'success') {
    errorMessage.style.background = '#dcfce7';
    errorMessage.style.borderColor = '#bbf7d0';
    errorMessage.style.color = '#16a34a';
  } else {
    errorMessage.style.background = '#fee2e2';
    errorMessage.style.borderColor = '#fecaca';
    errorMessage.style.color = '#dc2626';
  }
}

function hideError() {
  errorMessage.classList.remove('active');
}

function redirectToDashboard(role) {
  switch (role) {
    case 'STUDENT':
      window.location.href = '/student/dashboard.html';
      break;
    case 'LECTURER':
      window.location.href = '/lecturer/dashboard.html';
      break;
    case 'ADMIN':
      window.location.href = '/admin/admin.html';
      break;
    case 'PARENT':
      window.location.href = '/parent/dashboard.html';
      break;
    default:
      showError('Invalid user role');
  }
}

// Google Sign-In (placeholder - implement OAuth later)
const googleBtn = document.querySelector('.btn-google');
if (googleBtn) {
  googleBtn.addEventListener('click', () => {
    showError('Google Sign-In will be implemented soon', 'success');
  });
}

// Check if user is already logged in
window.addEventListener('load', () => {
  const user = sessionStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      redirectToDashboard(userData.role);
    } catch (e) {
      console.error('Error parsing user data:', e);
      sessionStorage.clear();
    }
  }
});