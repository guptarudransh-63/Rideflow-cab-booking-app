const BASE_URL = '/api/v1';

export const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('rideflow_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // sends and receives HttpOnly cookies
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Passenger / Rides
  searchLocations: (q) => request(`/passenger/locations?q=${encodeURIComponent(q || '')}`),
  getEstimate: (payload) => request('/passenger/rides/estimate', { method: 'POST', body: payload }),
  createRide: (payload) => request('/passenger/rides', { method: 'POST', body: payload }),
  getRide: (id) => request(`/passenger/rides/${id}`),
  cancelRide: (id, payload) => request(`/passenger/rides/${id}/cancel`, { method: 'POST', body: payload }),
  submitRating: (id, payload) => request(`/passenger/rides/${id}/rating`, { method: 'POST', body: payload }),
  reportSupportIssue: (id, payload) => request(`/passenger/rides/${id}/support`, { method: 'POST', body: payload }),
  getPassengerRides: (page = 1) => request(`/passenger/rides?page=${page}`),

  // Driver
  getDriverProfile: () => request('/driver/profile'),
  updateAvailability: (isOnline) => request('/driver/availability', { method: 'POST', body: { isOnline } }),
  updateDriverLocation: (payload) => request('/driver/location', { method: 'POST', body: payload }),
  getOffers: () => request('/driver/offers'),
  acceptOffer: (id) => request(`/driver/offers/${id}/accept`, { method: 'POST' }),
  rejectOffer: (id) => request(`/driver/offers/${id}/reject`, { method: 'POST' }),
  markArrived: (id) => request(`/driver/rides/${id}/arrived`, { method: 'POST' }),
  startRide: (id, pin) => request(`/driver/rides/${id}/start`, { method: 'POST', body: { pin } }),
  completeRide: (id, payload) => request(`/driver/rides/${id}/complete`, { method: 'POST', body: payload }),
  getDriverEarnings: () => request('/driver/earnings'),
  getDriverRides: (page = 1) => request(`/driver/rides?page=${page}`),

  // Payments
  processPayment: (payload) => request('/payments/intent', { method: 'POST', body: payload }),
  getPayment: (id) => request(`/payments/${id}`),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminUsers: (params = '') => request(`/admin/users?${params}`),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
  getPendingDrivers: () => request('/admin/drivers/pending'),
  approveDriver: (id) => request(`/admin/drivers/${id}/approve`, { method: 'POST' }),
  rejectDriver: (id, rejectionReason) => request(`/admin/drivers/${id}/reject`, { method: 'POST', body: { rejectionReason } }),
  getAdminRides: (params = '') => request(`/admin/rides?${params}`),
  getAdminPayments: () => request('/admin/payments'),
  getSupportCases: () => request('/admin/support-cases'),
  updateSupportCase: (id, payload) => request(`/admin/support-cases/${id}`, { method: 'PATCH', body: payload }),
  getFareConfigs: () => request('/admin/fare-configurations'),
  updateFareConfig: (cat, payload) => request(`/admin/fare-configurations/${cat}`, { method: 'PATCH', body: payload }),
  getAuditLogs: () => request('/admin/audit-logs'),
};
