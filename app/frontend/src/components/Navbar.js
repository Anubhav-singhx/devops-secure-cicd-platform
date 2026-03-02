import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Chip } from '@mui/material';
import { Dashboard, Assignment, Logout, Security } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Security sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ mr: 4 }}>
          TaskManager
        </Typography>

        <Chip label="DevSecOps Demo" size="small" color="secondary" variant="outlined"
          sx={{ mr: 4, color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} />

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button color="inherit" startIcon={<Dashboard />} onClick={() => navigate('/')}
            sx={{ fontWeight: isActive('/') ? 'bold' : 'normal',
                  borderBottom: isActive('/') ? '2px solid white' : 'none', borderRadius: 0 }}>
            Dashboard
          </Button>
          <Button color="inherit" startIcon={<Assignment />} onClick={() => navigate('/tasks')}
            sx={{ fontWeight: isActive('/tasks') ? 'bold' : 'normal',
                  borderBottom: isActive('/tasks') ? '2px solid white' : 'none', borderRadius: 0 }}>
            Tasks
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="body2">{user?.username}</Typography>
          <Button color="inherit" startIcon={<Logout />} onClick={handleLogout} size="small">
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;