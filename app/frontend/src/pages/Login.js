import React, { useState } from 'react';
import {
  Container, Box, TextField, Button, Typography,
  Paper, Tabs, Tab, Alert, CircularProgress
} from '@mui/material';
import api from '../config/api';

function Login({ onLogin }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError('');

    try {
      let response;
      if (tab === 0) {
        response = await api.post('/api/auth/login', {
          email: form.email,
          password: form.password
        });
      } else {
        response = await api.post('/api/auth/register', form);
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 3 }}>

          <Typography variant="h4" align="center" fontWeight="bold" color="primary" gutterBottom>
            🚀 TaskManager
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enterprise DevSecOps Demo Application
          </Typography>

          <Tabs value={tab} onChange={(e, v) => { setTab(v); setError(''); }} centered sx={{ mb: 3 }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            {tab === 1 && (
              <TextField
                fullWidth margin="normal" label="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            )}
            <TextField
              fullWidth margin="normal" label="Email Address"
              type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <TextField
              fullWidth margin="normal" label="Password"
              type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Button
              type="submit" fullWidth variant="contained"
              size="large" sx={{ mt: 3, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (tab === 0 ? 'Login' : 'Create Account')}
            </Button>
          </Box>

          <Typography variant="caption" align="center" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Demo: demo@example.com / demo123
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;