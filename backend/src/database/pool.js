/**
 * MariaDB Connection Pool.
 *
 * Creates a single reusable pool. Other modules import this
 * and call pool.getConnection() or use the query helper.
 */

const mariadb = require('mariadb');
const env = require('../config/env');

const pool = mariadb.createPool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  connectionLimit: Number(env.DB_CONNECTION_LIMIT),
  // Return plain objects instead of arrays for rows
  rowsAsArray: false,
});

const normalizeBigInts = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === 'bigint') return Number(val);
  if (Array.isArray(val)) return val.map(normalizeBigInts);
  if (typeof val === 'object' && val.constructor === Object) {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = normalizeBigInts(v);
    }
    return res;
  }
  return val;
};

/**
 * Execute a parameterized query using a connection from the pool.
 * Automatically acquires and releases the connection.
 *
 * @param {string} sql  - SQL query with ? placeholders
 * @param {Array}  params - values for placeholders
 * @returns {Promise<*>} query result
 */
const query = async (sql, params = []) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);
    return normalizeBigInts(result);
  } finally {
    if (conn) conn.release();
  }
};

module.exports = { pool, query };
