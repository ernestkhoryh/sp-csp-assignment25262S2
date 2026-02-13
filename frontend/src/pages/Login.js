import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { authService } from '../services/api'; // For login API call
import { getCurrentUser } from '../utils/auth'; // For getting user after login

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Login attempt with:', { 
      email: formData.email, 
      passwordLength: formData.password.length 
    });

    try {
      const response = await authService.login(formData);
      console.log('Login response:', response);
      
      if (response.data.token && response.data.user.role) {
        localStorage.setItem('token', response.data.token);
        
        // Store user info
        if (response.data.user && response.data.user.role) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          // Decode token to get user info
          const tokenData = JSON.parse(atob(response.data.token.split('.')[1]));
          localStorage.setItem('user', JSON.stringify({
            username: tokenData.username,
            role: tokenData.role,
            userid: tokenData.userid
          }));
        }
        
        console.log('Login successful, token stored');
        console.log('Current user:', getCurrentUser());
        navigate('/');
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        setError(err.response.data?.message || `Login failed: ${err.response.status}`);
      } else if (err.request) {
        setError('Cannot connect to server. Check if backend is running.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Admin Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Test credentials:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: testuser3@test.com
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Password: simple123
              </Typography>
              
              <Link component={RouterLink} to="/" variant="body2" sx={{ display: 'block', mt: 2 }}>
                Back to Home
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;