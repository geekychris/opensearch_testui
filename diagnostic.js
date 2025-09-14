const axios = require('axios');

async function diagnostics() {
  console.log('🔍 OpenSearch Connection Diagnostics\n');
  
  // Test 1: Proxy server health
  console.log('1. Testing proxy server health...');
  try {
    const health = await axios.get('http://localhost:3002/health');
    console.log('✅ Proxy server is healthy:', health.data);
  } catch (error) {
    console.log('❌ Proxy server health check failed:', error.message);
    return;
  }
  
  // Test 2: Direct OpenSearch connection
  console.log('\n2. Testing direct OpenSearch connection via proxy...');
  try {
    const response = await axios.get('http://localhost:3002/api/opensearch/', {
      headers: {
        'X-OpenSearch-Target': 'http://localhost:30920'
      }
    });
    console.log('✅ OpenSearch connection working');
    console.log('   Cluster:', response.data.cluster_name);
    console.log('   Version:', response.data.version.number);
  } catch (error) {
    console.log('❌ OpenSearch connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 This suggests the SSH tunnel might not be working');
    }
    return;
  }
  
  // Test 3: CORS headers
  console.log('\n3. Testing CORS headers...');
  try {
    const response = await axios.options('http://localhost:3002/api/opensearch/', {
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-OpenSearch-Target'
      }
    });
    console.log('✅ CORS preflight working');
  } catch (error) {
    console.log('⚠️  CORS preflight issue:', error.message);
  }
  
  // Test 4: React app accessibility
  console.log('\n4. Testing React app accessibility...');
  try {
    const response = await axios.get('http://localhost:3001');
    if (response.data.includes('<div id="root">')) {
      console.log('✅ React app is serving correctly');
    } else {
      console.log('⚠️  React app response seems unusual');
    }
  } catch (error) {
    console.log('❌ React app not accessible:', error.message);
  }
  
  // Test 5: Proxy configuration endpoint
  console.log('\n5. Testing proxy configuration...');
  try {
    const config = await axios.get('http://localhost:3002/api/proxy-config');
    console.log('✅ Proxy configuration:', config.data);
  } catch (error) {
    console.log('❌ Proxy configuration check failed:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('- SSH Tunnel: localhost:30920 → Your OpenSearch cluster');
  console.log('- Proxy Server: localhost:3002 → Routes requests');
  console.log('- React App: localhost:3001 → UI interface');
  console.log('\n💡 If all tests pass but browser still fails:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Check network tab for failed requests');
  console.log('3. Try hard refresh (Cmd+Shift+R)');
  console.log('4. Try incognito/private browsing mode');
}

diagnostics().catch(console.error);
