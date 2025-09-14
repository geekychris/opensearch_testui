const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'], // Allow React dev server
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'OpenSearch Proxy Server is running' });
});

// Default target URL (fallback when no header is provided)
let defaultTarget = process.env.OPENSEARCH_URL || 'http://localhost:9200';

// Configuration endpoint to get current proxy target
app.get('/api/proxy-config', (req, res) => {
  res.json({ 
    defaultTarget: defaultTarget,
    proxyPort: PORT,
    message: 'Proxy routes dynamically based on X-OpenSearch-Target header'
  });
});

// Smart dynamic proxy middleware that routes based on headers
const dynamicProxy = createProxyMiddleware({
  target: 'http://placeholder', // This will be ignored
  changeOrigin: true,
  pathRewrite: {
    '^/api/opensearch': '', // Remove /api/opensearch prefix
  },
  router: (req) => {
    // Always use the target specified in headers, fallback to default
    const headerTarget = req.headers['x-opensearch-target'];
    const targetUrl = headerTarget || defaultTarget;
    
    // Validate the target URL
    try {
      const url = new URL(targetUrl);
      // Additional validation for reasonable hosts
      if (!url.hostname || url.hostname === 'invalid-host') {
        throw new Error('Invalid hostname');
      }
    } catch (error) {
      console.error(`❌ Invalid target URL: ${targetUrl}`);
      // Return a more user-friendly response instead of throwing
      return null; // This will cause the proxy to fail gracefully
    }
    
    console.log(`🔀 Proxying ${req.method} ${req.url} -> ${targetUrl}${req.url}`);
    return targetUrl;
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to the response
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
      hint: 'Check if the target OpenSearch instance is running and accessible'
    });
  }
});

// Route all /api/opensearch/* requests through the dynamic proxy
app.use('/api/opensearch', dynamicProxy);

// Update default target endpoint (optional - proxy works dynamically anyway)
app.post('/api/configure-proxy', express.json(), (req, res) => {
  const { target } = req.body;
  
  if (!target) {
    return res.status(400).json({ error: 'Target URL is required' });
  }
  
  try {
    // Validate URL format
    new URL(target);
    
    // Update the default target (used when no header is provided)
    defaultTarget = target;
    console.log(`✅ Default proxy target updated to: ${target}`);
    res.json({ 
      success: true, 
      message: `Default target set to ${target}. Proxy still routes dynamically based on X-OpenSearch-Target header.`,
      defaultTarget: defaultTarget
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL format' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Smart OpenSearch Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Default target: ${defaultTarget}`);
  console.log(`🎯 Proxy routes dynamically based on 'X-OpenSearch-Target' header`);
  console.log(`🔍 Test connection: curl -H "X-OpenSearch-Target: http://localhost:30920" http://localhost:${PORT}/api/opensearch/`);
  console.log(`💚 Health check: curl http://localhost:${PORT}/health`);
  console.log('');
  console.log('How it works:');
  console.log('  - React app sends requests with X-OpenSearch-Target header');
  console.log('  - Proxy dynamically routes to any OpenSearch instance');
  console.log('  - No need to restart proxy when changing targets');
  console.log('');
  console.log('Environment variables:');
  console.log(`  OPENSEARCH_URL=${process.env.OPENSEARCH_URL || 'not set (using default: http://localhost:9200)'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Proxy server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Proxy server shutting down...');
  process.exit(0);
});
