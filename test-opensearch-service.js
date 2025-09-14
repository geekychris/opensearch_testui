// Test script to simulate exactly what the React app does
const axios = require('axios');

class OpenSearchService {
  constructor(config, useProxy = true) {
    this.config = config;
    this.useProxy = useProxy;
    
    if (useProxy) {
      this.client = axios.create({
        baseURL: 'http://localhost:3002/api/opensearch',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenSearch-Target': `${config.protocol}://${config.host}:${config.port}`,
        },
        auth: config.username && config.password ? {
          username: config.username,
          password: config.password,
        } : undefined,
      });
    }
  }
  
  async testConnection() {
    try {
      const response = await this.client.get('/');
      console.log('✅ testConnection() SUCCESS');
      console.log('Response status:', response.status);
      console.log('Cluster name:', response.data?.cluster_name);
      return true;
    } catch (error) {
      console.log('❌ testConnection() FAILED');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      return false;
    }
  }
  
  async getClusterHealth() {
    const response = await this.client.get('/_cluster/health');
    return response.data;
  }
}

// Test with the same config the React app would use
async function runTest() {
  console.log('🧪 Testing OpenSearch service...');
  
  const config = {
    host: 'localhost',
    port: 30920,
    protocol: 'http',
    username: '',
    password: '',
  };
  
  console.log('Configuration:', config);
  console.log('Expected X-OpenSearch-Target header:', `${config.protocol}://${config.host}:${config.port}`);
  
  const service = new OpenSearchService(config, true); // useProxy = true
  
  const connected = await service.testConnection();
  
  if (connected) {
    try {
      const health = await service.getClusterHealth();
      console.log('✅ getClusterHealth() SUCCESS');
      console.log('Cluster health:', {
        cluster_name: health.cluster_name,
        status: health.status,
        number_of_nodes: health.number_of_nodes
      });
    } catch (error) {
      console.log('❌ getClusterHealth() FAILED');
      console.log('Error:', error.message);
    }
  }
}

runTest().catch(console.error);
