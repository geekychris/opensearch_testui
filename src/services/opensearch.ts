import axios, { AxiosInstance } from 'axios';

export interface OpenSearchConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  username?: string;
  password?: string;
}

export interface IndexMapping {
  [key: string]: {
    type: string;
    properties?: IndexMapping;
  };
}

export interface SearchResult {
  took: number;
  timed_out: boolean;
  _shards: any;
  hits: {
    total: { value: number; relation: string };
    hits: Array<{
      _index: string;
      _id: string;
      _score: number;
      _source: any;
    }>;
  };
}

export interface ClusterHealth {
  cluster_name: string;
  status: 'green' | 'yellow' | 'red';
  timed_out: boolean;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
}

export class OpenSearchService {
  private client: AxiosInstance;
  private config: OpenSearchConfig;
  private useProxy: boolean;

  constructor(config: OpenSearchConfig, useProxy: boolean = true) {
    this.config = config;
    this.useProxy = useProxy;
    
    if (useProxy) {
      // Use the proxy server to avoid CORS issues
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
    } else {
      // Direct connection (may have CORS issues)
      this.client = axios.create({
        baseURL: `${config.protocol}://${config.host}:${config.port}`,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: config.username && config.password ? {
          username: config.username,
          password: config.password,
        } : undefined,
      });
    }
  }

  updateConfig(config: OpenSearchConfig) {
    this.config = config;
    
    if (this.useProxy) {
      // Update proxy client
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
    } else {
      // Update direct client
      this.client = axios.create({
        baseURL: `${config.protocol}://${config.host}:${config.port}`,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: config.username && config.password ? {
          username: config.username,
          password: config.password,
        } : undefined,
      });
    }
  }

  // Connection testing
  async testConnection(): Promise<boolean> {
    // Ensure the axios client is properly configured before making request
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Add timeout to prevent hanging requests
      const response = await this.client.get('/', { timeout: 10000 });
      return response.status === 200;
    } catch (error: any) {
      return false;
    }
  }

  // Cluster operations
  async getClusterHealth(): Promise<ClusterHealth> {
    const response = await this.client.get('/_cluster/health');
    return response.data;
  }

  async getClusterSettings(): Promise<any> {
    const response = await this.client.get('/_cluster/settings');
    return response.data;
  }

  async getNodesInfo(): Promise<any> {
    const response = await this.client.get('/_nodes');
    return response.data;
  }

  // Index operations
  async listIndices(): Promise<any[]> {
    const response = await this.client.get('/_cat/indices?format=json');
    return response.data;
  }

  async createIndex(indexName: string, settings?: any, mappings?: any): Promise<any> {
    const body: any = {};
    if (settings) body.settings = settings;
    if (mappings) body.mappings = mappings;
    
    const response = await this.client.put(`/${indexName}`, body);
    return response.data;
  }

  async deleteIndex(indexName: string): Promise<any> {
    const response = await this.client.delete(`/${indexName}`);
    return response.data;
  }

  async getIndexMapping(indexName: string): Promise<any> {
    const response = await this.client.get(`/${indexName}/_mapping`);
    return response.data;
  }

  async putIndexMapping(indexName: string, mappings: any): Promise<any> {
    const response = await this.client.put(`/${indexName}/_mapping`, mappings);
    return response.data;
  }

  // Document operations
  async indexDocument(indexName: string, document: any, documentId?: string): Promise<any> {
    const url = documentId ? `/${indexName}/_doc/${documentId}` : `/${indexName}/_doc`;
    const response = await this.client.post(url, document);
    return response.data;
  }

  async bulkIndex(operations: any[]): Promise<any> {
    const body = operations.map(op => JSON.stringify(op)).join('\n') + '\n';
    const response = await this.client.post('/_bulk', body, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });
    return response.data;
  }

  // Search operations
  async search(indexName: string, query: any): Promise<SearchResult> {
    const response = await this.client.post(`/${indexName}/_search`, query);
    return response.data;
  }

  async searchAll(query: any): Promise<SearchResult> {
    const response = await this.client.post('/_search', query);
    return response.data;
  }

  // SQL operations (if available)
  async executeSQLQuery(query: string): Promise<any> {
    try {
      const response = await this.client.post('/_plugins/_sql', {
        query: query
      });
      return response.data;
    } catch (error) {
      throw new Error('SQL plugin not available or query failed');
    }
  }

  // Plugin operations
  async getPlugins(): Promise<any> {
    try {
      const response = await this.client.get('/_nodes/plugins');
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
let openSearchService: OpenSearchService | null = null;

export const getOpenSearchService = (config?: OpenSearchConfig, useProxy: boolean = true): OpenSearchService => {
  // Always create a fresh service if configuration is provided
  if (config) {
    openSearchService = new OpenSearchService(config, useProxy);
  } else if (!openSearchService) {
    throw new Error('OpenSearchService not initialized. Provide configuration.');
  }
  return openSearchService;
};

// Function to reset the singleton (useful for testing or config changes)
export const resetOpenSearchService = (): void => {
  openSearchService = null;
};

// Method to check if proxy server is available
export const checkProxyServer = async (): Promise<boolean> => {
  try {
    const response = await axios.get('http://localhost:3002/health');
    return response.status === 200;
  } catch (error: any) {
    return false;
  }
};

// Method to configure the proxy server target
export const configureProxy = async (targetUrl: string): Promise<boolean> => {
  try {
    const response = await axios.post('http://localhost:3002/api/configure-proxy', {
      target: targetUrl
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};
