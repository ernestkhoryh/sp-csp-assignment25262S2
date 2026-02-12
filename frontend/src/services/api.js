import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`${config.method.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      console.log('Authentication error, clearing tokens');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect here to avoid conflicts
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    console.log('AuthService: Login attempt with', credentials.email);
    
    // Ensure we're sending the right structure
    const payload = {
      email: credentials.email,
      password: credentials.password
    };
    
    try {
      const response = await api.post('/user/login', payload);
      console.log('AuthService: Login successful', response.data);
      return response;
    } catch (error) {
      console.error('AuthService: Login failed', error);
      throw error;
    }
  },
  
  // logout: () => {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  // },
  
  // getCurrentUser: () => {
  //   try {
  //     const user = localStorage.getItem('user');
  //     return user ? JSON.parse(user) : null;
  //   } catch (error) {
  //     console.error('Error parsing user from localStorage:', error);
  //     return null;
  //   }
  // }
};

// User services
export const userService = {
  getAllUsers: () => api.get('/user'),
  getUserById: (id) => api.get(`/user/${id}`),
  createUser: (userData) => api.post('/user', userData),
  updateUser: (id, userData) => api.put(`/user/${id}`, userData),
  deleteUser: (id) => api.delete(`/user/${id}`),
};

// Travel services
export const travelService = {
  getAllListings: async () => {
    console.log('TravelService: Fetching all listings');
    try {
      const response = await api.get('/travel-listings');
      console.log('TravelService: Got', response.data?.length, 'listings');
      return response;
    } catch (error) {
      console.error('TravelService: Error fetching listings', error);
      throw error;
    }
  },
  
  getListingById: (id) => api.get(`/travel-listings/${id}`),
  getItineraries: (travelId) => api.get(`/travel-listings/${travelId}/itineraries`),
  
  searchListings: async (query) => {
    console.log('TravelService: Searching for', query);
    try {
      // Try different endpoints based on your backend
      const response = await api.get(`/travel-listings/search?q=${query}`);
      return response;
    } catch (error) {
      console.error('TravelService: Search failed', error);
      // Fallback to client-side filtering
      throw error;
    }
  },
};

export default api;