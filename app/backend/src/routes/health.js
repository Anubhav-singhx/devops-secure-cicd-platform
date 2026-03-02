const express = require('express');
const router = express.Router();
const pool = require('../config/database');
router.get('/', async (req, res) => {
  const health = {
    status: 'OK',
    uptime: process.uptime(),       
    timestamp: new Date().toISOString(),
    service: 'task-manager-backend',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
    res.status(200).json(health);
  } catch (error) {
    health.status = 'DEGRADED';
    health.database = 'disconnected';
    health.error = error.message;
    res.status(503).json(health);
  }
});

module.exports = router;