// Debug connection test - run this with: node debug-connection.js
const axios = require('axios');

async function debugConnection() {
  console.log('🔍 Debug Connection Test Starting...');
  
  const config = {
    host: 'localhost',
    port: 30920,
    protocol: 'http'
  };
  
  console.log('📋 Config:', config);
  
  // Test 1: Direct proxy health check
  console.log('\n=== Test 1: Proxy Health ===');
  try {
    const response = await axios.get('http://localhost:3002/health');
    console.log('✅ Proxy health:', response.status, response.data);
  } catch (error) {
    console.log('❌ Proxy health failed:', error.message);
    return;
  }
  
  // Test 2: Create axios client like the React app does
  console.log('\n=== Test 2: Create Axios Client ===');
  const client = axios.create({
    baseURL: 'http://localhost:3002/api/opensearch',
    headers: {
      'Content-Type': 'application/json',
      'X-OpenSearch-Target': `${config.protocol}://${config.host}:${config.port}`,
    },
  });
  
  console.log('📋 Client baseURL:', client.defaults.baseURL);
  console.log('📋 Client headers:', client.defaults.headers);
  
  // Test 3: Make the request immediately (like when console is closed)
  console.log('\n=== Test 3: Immediate Request ===');
  try {
    const response = await client.get('/', { timeout: 10000 });
    console.log('✅ Immediate request SUCCESS:', response.status, response.data?.cluster_name);
  } catch (error) {
    console.log('❌ Immediate request FAILED:', error.message);
    if (error.response) {
      console.log('📋 Response status:', error.response.status);
      console.log('📋 Response data:', error.response.data);
    }
  }
  
  // Test 4: Make the request with a delay (like when console is open)
  console.log('\n=== Test 4: Delayed Request (simulating console delay) ===');
  await new Promise(resolve => setTimeout(resolve, 100));
  try {
    const response = await client.get('/', { timeout: 10000 });
    console.log('✅ Delayed request SUCCESS:', response.status, response.data?.cluster_name);
  } catch (error) {
    console.log('❌ Delayed request FAILED:', error.message);
    if (error.response) {
      console.log('📋 Response status:', error.response.status);
      console.log('📋 Response data:', error.response.data);
    }
  }
  
  // Test 5: Multiple rapid requests (stress test)
  console.log('\n=== Test 5: Rapid Multiple Requests ===');
  for (let i = 0; i < 3; i++) {
    try {
      const response = await client.get('/', { timeout: 10000 });
      console.log(`✅ Request ${i+1} SUCCESS:`, response.status);
    } catch (error) {
      console.log(`❌ Request ${i+1} FAILED:`, error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay between requests
  }
  
  console.log('\n🏁 Debug test complete!');
}

debugConnection().catch(console.error);
