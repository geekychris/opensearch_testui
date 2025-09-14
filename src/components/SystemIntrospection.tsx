import React, { useState, useEffect } from 'react';
import {
  
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Tabs,
  Tab,
  Paper,

  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Grid,
} from '@mui/material';
import {
  
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Computer as ComputerIcon,
  MonitorHeart as HealthIcon,
} from '@mui/icons-material';
import {
   getOpenSearchService, ClusterHealth } from '../services/opensearch';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`system-tabpanel-${index}`}
      aria-labelledby={`system-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemIntrospection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cluster data
  const [clusterHealth, setClusterHealth] = useState<ClusterHealth | null>(null);
  const [clusterSettings, setClusterSettings] = useState<any>(null);
  const [nodesInfo, setNodesInfo] = useState<any>(null);
  const [plugins, setPlugins] = useState<any>(null);
  const [indices, setIndices] = useState<any[]>([]);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    setLoading(true);
    setError('');
    
    try {
      const service = getOpenSearchService();
      
      // Load all system information
      const [health, settings, nodes, pluginsData, indexList] = await Promise.all([
        service.getClusterHealth().catch(e => ({ error: e.message })),
        service.getClusterSettings().catch(e => ({ error: e.message })),
        service.getNodesInfo().catch(e => ({ error: e.message })),
        service.getPlugins().catch(e => null),
        service.listIndices().catch(e => [])
      ]);

      setClusterHealth(health as ClusterHealth);
      setClusterSettings(settings);
      setNodesInfo(nodes);
      setPlugins(pluginsData);
      setIndices(indexList);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system information');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'error';
      default: return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderClusterHealth = () => (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              {clusterHealth && <HealthIcon sx={{ mr: 1, color: getHealthColor(clusterHealth.status) }} />}
              Cluster Health
            </Typography>
            {clusterHealth ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ mr: 2 }}>
                      <strong>Cluster:</strong> {clusterHealth.cluster_name}
                    </Typography>
                    <Chip
                      label={clusterHealth.status}
                      color={getHealthColor(clusterHealth.status)}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                    <Typography variant="body2">
                      <strong>Nodes:</strong> {clusterHealth.number_of_nodes}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Data Nodes:</strong> {clusterHealth.number_of_data_nodes}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                    <Typography variant="body2">
                      <strong>Active Shards:</strong> {clusterHealth.active_shards}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Primary Shards:</strong> {clusterHealth.active_primary_shards}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                    <Typography variant="body2">
                      <strong>Relocating:</strong> {clusterHealth.relocating_shards}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Initializing:</strong> {clusterHealth.initializing_shards}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                    <Typography variant="body2">
                      <strong>Unassigned:</strong> {clusterHealth.unassigned_shards}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Delayed Unassigned:</strong> {(clusterHealth as any).delayed_unassigned_shards || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography>Loading cluster health...</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
      
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Indices Summary
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Total Indices:</strong> {indices.length}
            </Typography>
            
            {indices.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total Documents:</strong>{' '}
                  {indices.reduce((sum, idx) => sum + parseInt(idx['docs.count'] || '0'), 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total Size:</strong>{' '}
                  {formatBytes(indices.reduce((sum, idx) => {
                    const size = idx['store.size'] || '0b';
                    const bytes = size.endsWith('kb') ? parseFloat(size) * 1024 :
                                 size.endsWith('mb') ? parseFloat(size) * 1024 * 1024 :
                                 size.endsWith('gb') ? parseFloat(size) * 1024 * 1024 * 1024 :
                                 parseFloat(size);
                    return sum + bytes;
                  }, 0))}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Health Distribution:</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['green', 'yellow', 'red'].map(status => {
                      const count = indices.filter(idx => idx.health === status).length;
                      return count > 0 ? (
                        <Chip
                          key={status}
                          label={`${status}: ${count}`}
                          color={getHealthColor(status) as any}
                          size="small"
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  const renderNodes = () => (
    <Box>
      {nodesInfo && !nodesInfo.error ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Object.entries(nodesInfo.nodes || {}).map(([nodeId, node]: [string, any]) => (
            <Box key={nodeId} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ComputerIcon sx={{ mr: 1 }} />
                    {node.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography variant="body2">
                        <strong>ID:</strong> {nodeId.substring(0, 8)}...
                      </Typography>
                      <Typography variant="body2">
                        <strong>Host:</strong> {node.host}
                      </Typography>
                      <Typography variant="body2">
                        <strong>IP:</strong> {node.ip}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Version:</strong> {node.version}
                      </Typography>
                    </Box>
                    
                    {node.os && (
                      <Box>
                        <Typography variant="body2">
                          <strong>OS:</strong> {node.os.pretty_name || `${node.os.name} ${node.os.version}`}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Architecture:</strong> {node.os.arch}
                        </Typography>
                      </Box>
                    )}
                    
                    {node.jvm && (
                      <Box>
                        <Typography variant="body2">
                          <strong>JVM:</strong> {node.jvm.vm_name} {node.jvm.version}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Heap Max:</strong> {formatBytes(node.jvm.mem.heap_max_in_bytes)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                        {node.roles && node.roles.map((role: string) => (
                          <Chip key={role} label={role} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        <Alert severity="error">Failed to load node information</Alert>
      )}
    </Box>
  );

  const renderSettings = () => (
    <Box>
      {clusterSettings && !clusterSettings.error ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Persistent Settings
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 400, overflow: 'auto' }}>
                    <pre style={{ fontSize: '12px', margin: 0 }}>
                      {JSON.stringify(clusterSettings.persistent || {}, null, 2)}
                    </pre>
                  </Paper>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transient Settings
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 400, overflow: 'auto' }}>
                    <pre style={{ fontSize: '12px', margin: 0 }}>
                      {JSON.stringify(clusterSettings.transient || {}, null, 2)}
                    </pre>
                  </Paper>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Default Settings
                </Typography>
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 400, overflow: 'auto' }}>
                  <pre style={{ fontSize: '12px', margin: 0 }}>
                    {JSON.stringify(clusterSettings.defaults || {}, null, 2)}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          </Box>
        </Box>
      ) : (
        <Alert severity="error">Failed to load cluster settings</Alert>
      )}
    </Box>
  );

  const renderPlugins = () => (
    <Box>
      {plugins && plugins.nodes ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(plugins.nodes).map(([nodeId, nodeData]: [string, any]) => (
            <Box key={nodeId}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Node: {nodeData.name}
                  </Typography>
                  
                  {nodeData.plugins && nodeData.plugins.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Plugin Name</TableCell>
                            <TableCell>Version</TableCell>
                            <TableCell>Description</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {nodeData.plugins.map((plugin: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {plugin.name}
                                </Typography>
                              </TableCell>
                              <TableCell>{plugin.version}</TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {plugin.description}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary">No plugins installed</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        <Alert severity="warning">Plugin information not available</Alert>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">System Introspection</Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={loadSystemInfo}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Cluster Health" />
          <Tab label="Nodes" />
          <Tab label="Settings" />
          <Tab label="Plugins" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {renderClusterHealth()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderNodes()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderSettings()}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {renderPlugins()}
      </TabPanel>
    </Box>
  );
};

export default SystemIntrospection;
