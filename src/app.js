const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

const LOCAL_ORIGINS = ['http://localhost:7025', 'http://localhost:5173'];

function normalizeOrigin(origin) {
  return origin.trim().replace(/\/$/, '');
}

function parseAllowedOrigins() {
  const exact = new Set(LOCAL_ORIGINS);
  const patterns = [];

  const addOrigin = (value) => {
    if (!value) return;
    const normalized = normalizeOrigin(value);
    if (!normalized) return;
    if (normalized.includes('*')) {
      patterns.push(normalized);
    } else {
      exact.add(normalized);
    }
  };

  if (process.env.FRONTEND_URL) {
    addOrigin(process.env.FRONTEND_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(addOrigin);
  }

  // Convenience for Vercel deployments (production + preview URLs)
  if (process.env.ALLOW_VERCEL === 'true') {
    patterns.push('https://*.vercel.app');
  }

  return { exact: [...exact], patterns };
}

function originToRegex(pattern) {
  const escaped = normalizeOrigin(pattern)
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

const corsConfig = parseAllowedOrigins();

function isOriginAllowed(origin) {
  const normalized = normalizeOrigin(origin);
  if (corsConfig.exact.includes(normalized)) return true;

  return corsConfig.patterns.some((pattern) =>
    originToRegex(pattern).test(normalized)
  );
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (health checks, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    console.warn(`[CORS] Allowed exact: ${corsConfig.exact.join(', ')}`);
    if (corsConfig.patterns.length) {
      console.warn(`[CORS] Allowed patterns: ${corsConfig.patterns.join(', ')}`);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  next();
});

// Health check at root level for render 
app.get("/health", (re, res) => {
  res.json({status: "ok"})
});

// Auth routes
app.use('/api/auth', authRoutes);

// Chat routes
app.use('/api/chats', chatRoutes);

// API routes
app.use("/api", routes);


module.exports = app;
