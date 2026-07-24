const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const config = require("./config/env");

const healthRoutes = require("./routes/health.routes");
const categoryRoutes = require("./routes/category.routes");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const adminOrderRoutes = require("./routes/admin-order.routes");
const shopSettingsRoutes = require("./routes/shop-settings.routes");
const notFoundMiddleware = require("./middleware/not-found.middleware");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// 1. Trust proxy configuration (Required for Railway/Vercel and express-rate-limit)
app.set('trust proxy', 1);

// 2. Security middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow serving images to frontend

// 3. CORS
app.use(cors({
  origin: config.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." }
});
// Skip rate limiting if NODE_ENV is test
if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

// API Routes that need raw streams (like multipart) should go BEFORE global body parsers to prevent interference
app.use("/api/products", productRoutes);

// 4 & 5. Body parsing with safe limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));


// 7. API Routes
app.use("/api/health", healthRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/shop-settings", shopSettingsRoutes);

// 8. Fallback for missing routes
app.use(notFoundMiddleware);

// 9. Global Error Handler
app.use(errorMiddleware);

// 10. One final export
module.exports = app;
