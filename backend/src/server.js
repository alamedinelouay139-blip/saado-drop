const config = require('./config/env');
const { pool, query } = require('./database/pool');
const app = require('./app');

// Test DB and Start Server
const startServer = async () => {
  try {
    // Verify DB connectivity
    await query("SELECT 1");
    console.log("Database connection established.");
  } catch (err) {
    console.error("Failed to connect to the database. Exiting...");
    process.exit(1);
  }

  const server = app.listen(config.PORT, () => {
    console.log(`Server is running on http://localhost:${config.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await pool.end();
        console.log("MariaDB pool closed.");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MariaDB pool:", err.message);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();
