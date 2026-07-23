/**
 * Health-check routes.
 *
 * GET /api/health          — basic API liveness check
 * GET /api/health/database — MariaDB connectivity check
 */

const express = require('express');
const { query } = require('../database/pool');

const router = express.Router();

// Basic API health
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Crepe & Chocolate API is running',
  });
});

// Database health
router.get('/database', async (req, res) => {
  try {
    await query('SELECT 1 AS health');

    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
    });
  } catch (error) {
    // Log internally but never expose details to the client
    console.error('Database health check failed:', error.message);

    res.status(503).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

module.exports = router;
