import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Button, Card, CardContent, CardActions,
  Grid, Chip, Box, IconButton, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Snackbar
} from '@mui/material';
import { Add, Delete, Edit, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import api from '../config/api';

const priorityColor = { high: 'error', medium: 'warning', low: 'success' };
const statusColor = { pending: 'default', in_progress: 'primary', completed: 'success' };
const priorityBorder = { high: '#d32f2f', medium: '#ed6c02', low: '#2e7d32' };

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/api/tasks');
      setTasks(response.data.tasks);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', priority: 'medium', due_date: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      notify('Title is required', 'error');
      return;
    }
    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.id}`, form);
        notify('Task updated!', 'success');
      } else {
        await api.post('/api/tasks', form);
        notify('Task created!', 'success');
      }
      setDialogOpen(false);
      loadTasks();
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to save task', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      notify('Task deleted', 'info');
      loadTasks();
    } catch (err) {
      notify('Failed to delete task', 'error');
    }
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/api/tasks/${task.id}`, { status: newStatus });
      loadTasks();
    } catch (err) {
      notify('Failed to update status', 'error');
    }
  };

  const notify = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress size={60} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">✅ My Tasks</Typography>
          <Typography color="text.secondary">{tasks.length} tasks total</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog} size="large">
          New Task
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {tasks.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Typography variant="h5" color="text.secondary" gutterBottom>No tasks yet</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>Create your first task to get started</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
              Create Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {tasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <Card sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                borderTop: `3px solid ${priorityBorder[task.priority]}`,
                opacity: task.status === 'completed' ? 0.7 : 1,
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom
                    sx={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                    {task.title}
                  </Typography>
                  {task.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={task.priority} color={priorityColor[task.priority]} size="small" />
                    <Chip label={task.status.replace('_', ' ')} color={statusColor[task.status]} size="small" variant="outlined" />
                  </Box>
                  {task.due_date && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                      📅 Due: {new Date(task.due_date).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <IconButton onClick={() => toggleComplete(task)} size="small"
                    color={task.status === 'completed' ? 'success' : 'default'}>
                    {task.status === 'completed' ? <CheckCircle /> : <RadioButtonUnchecked />}
                  </IconButton>
                  <IconButton onClick={() => openEditDialog(task)} size="small" color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(task.id)} size="small" color="error">
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Title *"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField fullWidth margin="normal" label="Description" multiline rows={3}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select value={form.priority} label="Priority"
              onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <MenuItem value="low">🟢 Low</MenuItem>
              <MenuItem value="medium">🟡 Medium</MenuItem>
              <MenuItem value="high">🔴 High</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth margin="normal" label="Due Date" type="date"
            value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Tasks;
