# Smart OpenSearch Proxy Server

This project includes a **smart proxy server** that dynamically routes requests to any OpenSearch instance based on the configuration in your React UI. No restarts needed!

## Why is a proxy needed?

When your React application (running on `http://localhost:3001`) tries to make HTTP requests directly to OpenSearch (e.g., `http://localhost:30920`), browsers block these requests due to CORS (Cross-Origin Resource Sharing) policy. OpenSearch typically doesn't have CORS headers configured to allow browser requests from different origins.

## How the Smart Proxy Works

The intelligent proxy server:
1. **Runs once** on `http://localhost:3002`  
2. **Dynamically routes** requests based on the `X-OpenSearch-Target` header
3. **Supports any host/port** - localhost:30920, localhost:9200, remote servers, etc.
4. **No restarts required** when you change OpenSearch targets in the UI
5. Adds proper CORS headers to all responses
6. Forwards authentication if provided

## Quick Start

### Option 1: Run both servers together (Recommended)
```bash
npm run dev
```
This starts both the proxy server (port 3002) and React app (port 3001).

### Option 2: Run servers separately
Terminal 1 - Start the proxy server:
```bash
npm run proxy
```

Terminal 2 - Start the React app:
```bash
npm start
```

## Configuration

### Environment Variable (Optional Default)
```bash
export OPENSEARCH_URL=http://localhost:9200  # Default fallback target
npm run proxy
```

### Smart Dynamic Routing
The proxy **automatically routes** based on what you configure in the React UI:
- Change host/port in the React app ➡️ Proxy automatically routes there
- No manual configuration needed!
- No proxy restarts required!

### Manual Configuration (Optional)
You can also set a default target via API (used when no header is provided):

```bash
curl -X POST http://localhost:3002/api/configure-proxy \
  -H "Content-Type: application/json" \
  -d '{"target": "http://localhost:30920"}'
```

## Testing the Smart Proxy

1. **Health check:**
   ```bash
   curl http://localhost:3002/health
   ```

2. **Test OpenSearch connection to port 30920:**
   ```bash
   curl -H "X-OpenSearch-Target: http://localhost:30920" http://localhost:3002/api/opensearch/
   ```

3. **Test different port (like 9200):**
   ```bash
   curl -H "X-OpenSearch-Target: http://localhost:9200" http://localhost:3002/api/opensearch/
   ```

4. **Check proxy configuration:**
   ```bash
   curl http://localhost:3002/api/proxy-config
   ```

## Using with Any OpenSearch Instance

1. **Start the proxy server** (one time setup):
   ```bash
   npm run proxy
   ```
2. **Open your React app** at `http://localhost:3001`
3. **Configure ANY connection** in the UI:
   - Host: `localhost`, `192.168.1.100`, `opensearch.example.com`, etc.
   - Port: `30920`, `9200`, `9201`, `443`, etc.
   - Protocol: `http` or `https` 
   - Authentication: If required
4. **Test the connection** - proxy automatically routes to your target!
5. **Change targets anytime** - no proxy restart needed!

## Smart Proxy Server Features

- ✅ **Intelligent routing** - Automatically routes to any host/port from React UI
- ✅ **No restarts needed** - Change targets instantly without stopping proxy
- ✅ **Universal compatibility** - Works with localhost, remote servers, any port
- ✅ **CORS headers** - Automatically added to all responses  
- ✅ **Authentication forwarding** - Passes through HTTP auth headers
- ✅ **Error handling** - Detailed error messages for troubleshooting
- ✅ **Request logging** - See all proxied requests with target info
- ✅ **Health checks** - Monitor proxy server status
- ✅ **URL validation** - Ensures target URLs are valid before routing

## Troubleshooting

### Proxy server won't start
- Check if port 3002 is already in use: `lsof -i :3002`
- Try a different port by modifying `PORT` in `proxy-server.js`

### Connection still fails
- Verify your OpenSearch is actually running: `curl http://localhost:30920/`
- Check the proxy server logs for error messages
- Ensure the target URL is correct in the proxy configuration

### CORS errors persist
- Make sure you're using the proxy (React app should connect to localhost:3002 internally)
- Check browser developer tools Network tab to see if requests are going through proxy
- Verify the proxy server is adding CORS headers (check response headers)

## Direct Connection (Without Proxy)

If you want to bypass the proxy and connect directly, you'll need to:

1. Configure your OpenSearch to allow CORS requests
2. Add to OpenSearch configuration:
   ```yaml
   http.cors.enabled: true
   http.cors.allow-origin: "http://localhost:3001"
   http.cors.allow-headers: "Content-Type, Authorization"
   http.cors.allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
   ```
3. Restart OpenSearch
4. In the React app connection settings, make sure it's configured to connect directly

However, using the proxy is simpler and doesn't require OpenSearch configuration changes.
