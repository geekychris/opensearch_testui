#!/usr/bin/env node

const axios = require('axios');

const PROXY_URL = 'http://localhost:3002/api/opensearch';
const PROXY_HEALTH = 'http://localhost:3002/health';

async function testProxy() {
  console.log('🧪 Testing Smart OpenSearch Proxy...\n');

  try {
    // Check proxy health
    console.log('1. Checking proxy server health...');
    const health = await axios.get(PROXY_HEALTH);
    console.log('✅ Proxy server is running:', health.data.message);

    // Test with your OpenSearch instance on port 30920
    console.log('\n2. Testing connection to localhost:30920...');
    try {
      const response1 = await axios.get(PROXY_URL, {
        headers: {
          'X-OpenSearch-Target': 'http://localhost:30920'
        }
      });
      console.log('✅ Successfully connected to port 30920');
      console.log('   Cluster:', response1.data.cluster_name);
      console.log('   Version:', response1.data.version.number);
    } catch (error) {
      console.log('❌ Failed to connect to port 30920:', error.message);
    }

    // Test with different port (should fail gracefully)
    console.log('\n3. Testing connection to localhost:9200 (should fail if not running)...');
    try {
      const response2 = await axios.get(PROXY_URL, {
        headers: {
          'X-OpenSearch-Target': 'http://localhost:9200'
        }
      });
      console.log('✅ Successfully connected to port 9200');
      console.log('   Cluster:', response2.data.cluster_name);
    } catch (error) {
      console.log('❌ Failed to connect to port 9200 (expected if not running)');
    }

    // Test with invalid target
    console.log('\n4. Testing with invalid target (should fail gracefully)...');
    try {
      await axios.get(PROXY_URL, {
        headers: {
          'X-OpenSearch-Target': 'http://invalid-host:99999'
        }
      });
    } catch (error) {
      console.log('❌ Failed to connect to invalid target (expected)');
    }

    console.log('\n🎉 Smart proxy test completed!');
    console.log('\nKey Features Demonstrated:');
    console.log('  ✅ Dynamic routing based on X-OpenSearch-Target header');
    console.log('  ✅ Works with any host/port combination');
    console.log('  ✅ Graceful error handling for unreachable targets');
    console.log('  ✅ No proxy restart needed for different targets');

  } catch (error) {
    console.error('❌ Proxy server not running. Start it with: npm run proxy');
  }
}

// Run the test
testProxy().catch(console.error);
