import React, { useState, useEffect } from 'react';
import {
  
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
   OpenSearchConfig, getOpenSearchService, checkProxyServer } from '../services/opensearch';

// Common OpenSearch connection presets
const CONNECTION_PRESETS: { [key: string]: Partial<OpenSearchConfig> } = {
  'Custom Port 30920': { host: 'localhost', port: 30920, protocol: 'http' },
  'Local Default': { host: 'localhost', port: 9200, protocol: 'http' },
  'Local HTTPS': { host: 'localhost', port: 9200, protocol: 'https' },
  'Local 9201': { host: 'localhost', port: 9201, protocol: 'http' },
  'Local 9300': { host: 'localhost', port: 9300, protocol: 'http' },
  'Docker Default': { host: 'localhost', port: 9200, protocol: 'http' },
};

interface ConnectionManagerProps {
  onConnectionChange: (connected: boolean, config: OpenSearchConfig) => void;
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({ onConnectionChange }) => {
  const [config, setConfig] = useState<OpenSearchConfig>({
    host: 'localhost',
    port: 30920,
    protocol: 'http',
    username: '',
    password: '',
  });

  const [useAuth, setUseAuth] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    connected: false,
    message: 'Not connected',
    type: 'info',
  });

  const [clusterInfo, setClusterInfo] = useState<any>(null);
  const [proxyStatus, setProxyStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem('opensearch-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        setUseAuth(Boolean(parsed.username && parsed.password));
      } catch (error) {
        console.error('Failed to load saved config:', error);
      }
    }
    
    // Check proxy server status
    checkProxyStatus();
  }, []);
  
  const checkProxyStatus = async () => {
    setProxyStatus('checking');
    const isAvailable = await checkProxyServer();
    setProxyStatus(isAvailable ? 'available' : 'unavailable');
  };

  const saveConfig = (newConfig: OpenSearchConfig) => {
    localStorage.setItem('opensearch-config', JSON.stringify(newConfig));
  };

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus({
      connected: false,
      message: 'Connecting...',
      type: 'info',
    });
    
    try {
      // Create a fresh service instance to avoid any stale state
      const service = getOpenSearchService(config);
      
      const connected = await service.testConnection();
      
      if (connected) {
        // Get cluster information
        try {
          const health = await service.getClusterHealth();
          setClusterInfo(health);
          setConnectionStatus({
            connected: true,
            message: `Connected to cluster: ${health.cluster_name} (Status: ${health.status})`,
            type: 'success',
          });
          saveConfig(config);
          onConnectionChange(true, config);
        } catch (error) {
          setConnectionStatus({
            connected: true,
            message: 'Connected but failed to get cluster info',
            type: 'success',
          });
          onConnectionChange(true, config);
        }
      } else {
        setConnectionStatus({
          connected: false,
          message: 'Failed to connect to OpenSearch',
          type: 'error',
        });
        setClusterInfo(null);
        onConnectionChange(false, config);
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
      setClusterInfo(null);
      onConnectionChange(false, config);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConfigChange = (field: keyof OpenSearchConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    if (!useAuth) {
      newConfig.username = '';
      newConfig.password = '';
    }
    setConfig(newConfig);
  };

  const handleAuthToggle = (enabled: boolean) => {
    setUseAuth(enabled);
    if (!enabled) {
      setConfig(prev => ({ ...prev, username: '', password: '' }));
    }
  };

  const handlePresetChange = (presetName: string) => {
    if (presetName && CONNECTION_PRESETS[presetName]) {
      const preset = CONNECTION_PRESETS[presetName];
      setConfig(prev => ({ ...prev, ...preset }));
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          OpenSearch Connection
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Connection Presets</InputLabel>
            <Select
              label="Connection Presets"
              value=""
              onChange={(e) => handlePresetChange(e.target.value as string)}
            >
              {Object.keys(CONNECTION_PRESETS).map((preset) => (
                <MenuItem key={preset} value={preset}>
                  {preset} ({CONNECTION_PRESETS[preset].protocol}://{CONNECTION_PRESETS[preset].host}:{CONNECTION_PRESETS[preset].port})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
            <TextField
              fullWidth
              label="Host"
              value={config.host}
              onChange={(e) => handleConfigChange('host', e.target.value)}
              margin="normal"
              helperText="e.g., localhost, 192.168.1.100, opensearch.example.com"
              placeholder="localhost"
            />
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
            <TextField
              fullWidth
              label="Port"
              type="number"
              value={config.port}
              onChange={(e) => handleConfigChange('port', parseInt(e.target.value) || 9200)}
              margin="normal"
              helperText="Default: 9200"
              inputProps={{ min: 1, max: 65535 }}
            />
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Connection URL: {config.protocol}://{config.host}:{config.port}
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={config.protocol === 'https'}
              onChange={(e) => handleConfigChange('protocol', e.target.checked ? 'https' : 'http')}
            />
          }
          label="Use HTTPS"
        />

        <FormControlLabel
          control={
            <Switch
              checked={useAuth}
              onChange={(e) => handleAuthToggle(e.target.checked)}
            />
          }
          label="Use Authentication"
        />

        {useAuth && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Username"
                value={config.username || ''}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                margin="normal"
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={config.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                margin="normal"
              />
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={testConnection}
            disabled={isConnecting}
            startIcon={isConnecting ? <CircularProgress size={20} /> : null}
          >
            {isConnecting ? 'Connecting...' : 'Test Connection'}
          </Button>
        </Box>

        <Alert severity={connectionStatus.type} sx={{ mb: 2 }}>
          {connectionStatus.message}
        </Alert>
        
        {proxyStatus !== 'checking' && (
          <Alert 
            severity={proxyStatus === 'available' ? 'info' : 'warning'} 
            sx={{ mb: 2 }}
            action={
              proxyStatus === 'unavailable' ? (
                <Button color="inherit" size="small" onClick={checkProxyStatus}>
                  Retry
                </Button>
              ) : null
            }
          >
            Proxy Server: {proxyStatus === 'available' ? 
              'Available (CORS issues resolved)' : 
              'Unavailable (direct connection may have CORS issues)'}
          </Alert>
        )}

        {clusterInfo && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Cluster Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2">
                  <strong>Cluster Name:</strong> {clusterInfo.cluster_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {clusterInfo.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Nodes:</strong> {clusterInfo.number_of_nodes}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2">
                  <strong>Data Nodes:</strong> {clusterInfo.number_of_data_nodes}
                </Typography>
                <Typography variant="body2">
                  <strong>Active Shards:</strong> {clusterInfo.active_shards}
                </Typography>
                <Typography variant="body2">
                  <strong>Unassigned Shards:</strong> {clusterInfo.unassigned_shards}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionManager;
