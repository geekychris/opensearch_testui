const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3003; // Use different port for debugging

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📄 Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('---');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ status: 'OK', message: 'Debug OpenSearch Proxy Server is running' });
});

// Default target URL
let defaultTarget = 'http://localhost:30920'; // Changed default to 30920

// Smart dynamic proxy middleware
const dynamicProxy = createProxyMiddleware({
  target: 'http://placeholder',
  changeOrigin: true,
  pathRewrite: {
    '^/api/opensearch': '',
  },
  router: (req) => {
    const headerTarget = req.headers['x-opensearch-target'];
    const targetUrl = headerTarget || defaultTarget;
    
    console.log(`🎯 Target from header: ${headerTarget}`);
    console.log(`🎯 Using target: ${targetUrl}`);
    
    try {
      const url = new URL(targetUrl);
      if (!url.hostname || url.hostname === 'invalid-host') {
        throw new Error('Invalid hostname');
      }
    } catch (error) {
      console.error(`❌ Invalid target URL: ${targetUrl}`, error.message);
      return null;
    }
    
    console.log(`🔀 Proxying ${req.method} ${req.url} -> ${targetUrl}${req.url}`);
    return targetUrl;
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`📤 Proxy response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-OpenSearch-Target';
  },
  onError: (err, req, res) => {
    const targetUrl = req.headers['x-opensearch-target'] || defaultTarget;
    console.error(`❌ Proxy Error for ${targetUrl}:`, err.message);
    res.status(500).json({
      error: 'Proxy Error',
      message: err.message,
      target: targetUrl,
    });
  }
});

app.use('/api/opensearch', dynamicProxy);

app.listen(PORT, () => {
  console.log(`🚀 DEBUG OpenSearch Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Default target: ${defaultTarget}`);
  console.log(`🔍 This will show all requests from the React app`);
  console.log('');
});
