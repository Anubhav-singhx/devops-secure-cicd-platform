import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography,
  Box, CircularProgress, Alert, LinearProgress, Chip
} from '@mui/material';
import { Assignment, CheckCircle, HourglassTop, TrendingUp } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../config/api';

const COLORS = ['#1976d2', '#9c27b0', '#2e7d32'];

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/api/tasks');
        setTasks(response.data.tasks);
      } catch (err) {
        setError('Could not load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress size={60} />
    </Box>
  );

  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100) : 0;

  const pieData = [
    { name: 'Pending', value: stats.pending },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Completed', value: stats.completed },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'High', count: tasks.filter(t => t.priority === 'high').length },
    { name: 'Medium', count: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Low', count: tasks.filter(t => t.priority === 'low').length },
  ];

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ borderLeft: `4px solid ${color}`, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h3" fontWeight="bold" color={color}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ color, opacity: 0.8, mt: 0.5 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📊 Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Overview of your tasks and productivity
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Tasks" value={stats.total} color="#1976d2"
            icon={<Assignment fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending" value={stats.pending} color="#ed6c02"
            icon={<HourglassTop fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="In Progress" value={stats.inProgress} color="#9c27b0"
            icon={<TrendingUp fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed" value={stats.completed} color="#2e7d32"
            icon={<CheckCircle fontSize="large" />} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Completion Rate */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Completion Rate</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={completionRate}
                    sx={{ height: 12, borderRadius: 6 }}
                    color={completionRate > 70 ? 'success' : completionRate > 40 ? 'warning' : 'error'}
                  />
                </Box>
                <Typography variant="h5" fontWeight="bold">{completionRate}%</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.completed} of {stats.total} tasks completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Distribution Pie Chart */}
        {pieData.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Task Distribution</Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>By Priority</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        {tasks.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Tasks</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {tasks.slice(0, 5).map(task => (
                    <Box key={task.id} sx={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', p: 1.5, borderRadius: 1,
                      bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200'
                    }}>
                      <Typography variant="body2" fontWeight="medium">{task.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={task.priority} size="small"
                          color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'} />
                        <Chip label={task.status.replace('_', ' ')} size="small" variant="outlined" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default Dashboard;