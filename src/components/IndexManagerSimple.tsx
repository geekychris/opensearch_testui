import React, { useState, useEffect } from 'react';
import {
  
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
} from '@mui/material';
import {
   Refresh as RefreshIcon } from '@mui/icons-material';
import {
   getOpenSearchService } from '../services/opensearch';

interface IndexInfo {
  health: string;
  status: string;
  index: string;
  'docs.count': string;
  'store.size': string;
}

const IndexManagerSimple: React.FC = () => {
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadIndices}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {indices.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No indices found. Connect to OpenSearch to view indices.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default IndexManagerSimple;
