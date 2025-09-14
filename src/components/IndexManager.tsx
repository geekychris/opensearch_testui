import React, { useState, useEffect } from 'react';
import {
  
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
   getOpenSearchService } from '../services/opensearch';

interface IndexInfo {
  health: string;
  status: string;
  index: string;
  uuid: string;
  pri: string;
  rep: string;
  'docs.count': string;
  'docs.deleted': string;
  'store.size': string;
  'pri.store.size': string;
}

interface FieldMapping {
  name: string;
  type: string;
  analyzer?: string;
  index?: boolean;
  store?: boolean;
}

const IndexManager: React.FC = () => {
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [selectedIndexMapping, setSelectedIndexMapping] = useState<any>(null);

  // Create index form state
  const [newIndexName, setNewIndexName] = useState('');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { name: '', type: 'text', index: true, store: false }
  ]);

  const fieldTypes = [
    'text', 'keyword', 'long', 'integer', 'short', 'byte', 'double', 'float',
    'boolean', 'date', 'ip', 'geo_point', 'geo_shape', 'binary'
  ];

  const textAnalyzers = [
    'standard', 'simple', 'whitespace', 'stop', 'keyword', 'pattern',
    'language', 'snowball', 'custom'
  ];

  useEffect(() => {
    loadIndices();
  }, []);

  const loadIndices = async () => {
    setLoading(true);
    try {
      const service = getOpenSearchService();
      const indexList = await service.listIndices();
      setIndices(indexList);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load indices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIndex = async () => {
    if (!newIndexName.trim()) {
      setError('Index name is required');
      return;
    }

    try {
      const service = getOpenSearchService();
      
      // Build mappings from field definitions
      const mappings: any = {
        properties: {}
      };

      fieldMappings.forEach(field => {
        if (field.name.trim()) {
          const fieldDef: any = { type: field.type };
          
          if (field.type === 'text' && field.analyzer) {
            fieldDef.analyzer = field.analyzer;
          }
          
          if (field.index !== undefined) {
            fieldDef.index = field.index;
          }
          
          if (field.store !== undefined) {
            fieldDef.store = field.store;
          }

          mappings.properties[field.name] = fieldDef;
        }
      });

      await service.createIndex(newIndexName, undefined, mappings);
      setCreateDialogOpen(false);
      setNewIndexName('');
      setFieldMappings([{ name: '', type: 'text', index: true, store: false }]);
      loadIndices();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create index');
    }
  };

  const handleDeleteIndex = async (indexName: string) => {
    if (!window.confirm(`Are you sure you want to delete index "${indexName}"?`)) {
      return;
    }

    try {
      const service = getOpenSearchService();
      await service.deleteIndex(indexName);
      loadIndices();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete index');
    }
  };

  const handleViewMapping = async (indexName: string) => {
    try {
      const service = getOpenSearchService();
      const mapping = await service.getIndexMapping(indexName);
      setSelectedIndex(indexName);
      setSelectedIndexMapping(mapping);
      setMappingDialogOpen(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get index mapping');
    }
  };

  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { name: '', type: 'text', index: true, store: false }]);
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const updateFieldMapping = (index: number, field: string, value: any) => {
    const newMappings = [...fieldMappings];
    (newMappings[index] as any)[field] = value;
    setFieldMappings(newMappings);
  };

  const getStatusColor = (health: string) => {
    switch (health) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Index Management</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Create Index
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadIndices}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Index Name</TableCell>
                  <TableCell>Health</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Documents</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {indices.map((index) => (
                  <TableRow key={index.index}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {index.index}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={index.health}
                        color={getStatusColor(index.health) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{index.status}</TableCell>
                    <TableCell align="right">{index['docs.count'] || '0'}</TableCell>
                    <TableCell align="right">{index['store.size'] || '0b'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Mapping">
                        <IconButton
                          size="small"
                          onClick={() => handleViewMapping(index.index)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Index">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteIndex(index.index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {indices.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No indices found. Create your first index to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Index Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Index</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Index Name"
            value={newIndexName}
            onChange={(e) => setNewIndexName(e.target.value)}
            margin="normal"
            helperText="Index name must be lowercase and can contain letters, numbers, hyphens, and underscores"
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Field Mappings
          </Typography>

          {fieldMappings.map((field, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  Field {index + 1}: {field.name || 'Unnamed Field'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33.333%' } }}>
                    <TextField
                      fullWidth
                      label="Field Name"
                      value={field.name}
                      onChange={(e) => updateFieldMapping(index, 'name', e.target.value)}
                    />
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33.333%' } }}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={field.type}
                        onChange={(e) => updateFieldMapping(index, 'type', e.target.value)}
                        label="Type"
                      >
                        {fieldTypes.map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {field.type === 'text' && (
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33.333%' } }}>
                      <FormControl fullWidth>
                        <InputLabel>Analyzer</InputLabel>
                        <Select
                          value={field.analyzer || ''}
                          onChange={(e) => updateFieldMapping(index, 'analyzer', e.target.value)}
                          label="Analyzer"
                        >
                          {textAnalyzers.map(analyzer => (
                            <MenuItem key={analyzer} value={analyzer}>{analyzer}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Button
                      size="small"
                      onClick={() => updateFieldMapping(index, 'index', !field.index)}
                      color={field.index ? 'primary' : 'inherit'}
                    >
                      {field.index ? '✓' : '✗'} Searchable
                    </Button>
                    <Button
                      size="small"
                      onClick={() => updateFieldMapping(index, 'store', !field.store)}
                      color={field.store ? 'primary' : 'inherit'}
                      sx={{ ml: 1 }}
                    >
                      {field.store ? '✓' : '✗'} Stored
                    </Button>
                  </Box>
                  {fieldMappings.length > 1 && (
                    <Button
                      size="small"
                      onClick={() => removeFieldMapping(index)}
                      color="error"
                    >
                      Remove Field
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          <Button
            variant="outlined"
            onClick={addFieldMapping}
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
          >
            Add Field
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateIndex} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Index Mapping Dialog */}
      <Dialog 
        open={mappingDialogOpen} 
        onClose={() => setMappingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Index Mapping: {selectedIndex}</DialogTitle>
        <DialogContent>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(selectedIndexMapping, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMappingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IndexManager;
