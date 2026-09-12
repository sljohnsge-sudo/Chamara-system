import axios from 'axios';

const API_BASE_URL = 'http://localhost:8005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCustomers = (search = '') => 
  api.get('/customers', { params: { search } });

export const createCustomer = (data) => 
  api.post('/customers', data);

export const updateCustomer = (id, data) => 
  api.put(`/customers/${id}`, data);

export const getVehicles = (search = '', customer_id = null) => 
  api.get('/vehicles', { params: { search, customer_id } });

export const createVehicle = (data) => 
  api.post('/vehicles', data);

export const updateVehicle = (id, data) => 
  api.put(`/vehicles/${id}`, data);

export const getInventoryItems = (search = '', vehicle_model = '') => 
  api.get('/inventory', { params: { search, vehicle_model } });

export const getInventorySummary = () => 
  api.get('/inventory/summary');

export const createInventoryItem = (data) => 
  api.post('/inventory', data);

export const updateInventoryItem = (id, data) => 
  api.put(`/inventory/${id}`, data);

export const getJobCards = (search = '', status = '', payment_status = '') => 
  api.get('/jobs', { params: { search, status, payment_status } });

export const getJobCardById = (id) => 
  api.get(`/jobs/${id}`);

export const createJobCard = (data) => 
  api.post('/jobs', data);

export const issueInventoryToJob = (jobId, data) => 
  api.post(`/jobs/${jobId}/issue-inventory`, data);

export const issuePartToJob = issueInventoryToJob;

export const updateJobStatus = (jobId, data) => 
  api.patch(`/jobs/${jobId}/status`, data);

export const updateJobPayment = (jobId, paymentStatus, paymentMethod = "Cash") =>
  api.patch(`/jobs/${jobId}/payment`, { payment_status: paymentStatus, payment_method: paymentMethod });

export const releaseJobVehicle = (jobId, carReleased = true) =>
  api.patch(`/jobs/${jobId}/release`, { car_released: carReleased });

export const getManagerAnalytics = (period = 'month') => 
  api.get('/analytics/summary', { params: { period } });

// Quotations API Methods
export const createQuotation = (data) => api.post('/quotations', data);
export const getQuotations = (search = '') => api.get('/quotations', { params: { search } });
export const getQuotationById = (id) => api.get(`/quotations/${id}`);

// Customer History API Methods
export const searchCustomerHistory = (search = '') => api.get('/customers-history/search', { params: { search } });
export const getCustomerHistory = (customerId) => api.get(`/customers-history/${customerId}`);

export default api;
