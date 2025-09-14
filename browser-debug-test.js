// Copy and paste this into the browser console at http://localhost:3001
// This will test the exact same requests the React app should be making

console.log('🔍 Browser Debug Test - Testing OpenSearch connectivity');

async function testProxyHealth() {
    console.log('=== Testing Proxy Health ===');
    try {
        const response = await fetch('http://localhost:3002/health');
        const data = await response.json();
        console.log('✅ Proxy Health Success:', response.status, data);
        return true;
    } catch (error) {
        console.error('❌ Proxy Health Failed:', error);
        return false;
    }
}

async function testOpenSearchConnection() {
    console.log('=== Testing OpenSearch Connection ===');
    try {
        const response = await fetch('http://localhost:3002/api/opensearch/', {
            method: 'GET',
            headers: {
                'X-OpenSearch-Target': 'http://localhost:30920',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('✅ OpenSearch Connection Success:', response.status);
        console.log('✅ Cluster Name:', data.cluster_name);
        console.log('✅ Version:', data.version.number);
        return true;
    } catch (error) {
        console.error('❌ OpenSearch Connection Failed:', error);
        return false;
    }
}

async function runFullTest() {
    console.log('🚀 Starting full connectivity test...');
    const proxyOk = await testProxyHealth();
    if (proxyOk) {
        await testOpenSearchConnection();
    }
    console.log('🏁 Test complete!');
}

// Run the test
runFullTest();
