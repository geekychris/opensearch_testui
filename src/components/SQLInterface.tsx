import React, { useState, useEffect } from 'react';
import {
  
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,

  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Divider,
  Grid,
} from '@mui/material';
import {
  
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
   getOpenSearchService } from '../services/opensearch';

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
      id={`sql-tabpanel-${index}`}
      aria-labelledby={`sql-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SQLInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM your_index_name LIMIT 10');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryTime, setQueryTime] = useState(0);
  const [sqlSupported, setSqlSupported] = useState<boolean | null>(null);
  
  // Sample queries for different use cases
  const sampleQueries = [
    {
      title: 'Basic SELECT',
      query: 'SELECT * FROM your_index_name LIMIT 10',
      description: 'Basic select query to retrieve all fields'
    },
    {
      title: 'Filtered Query',
      query: "SELECT field1, field2 FROM your_index_name WHERE field1 = 'value' LIMIT 10",
      description: 'Select specific fields with a WHERE clause'
    },
    {
      title: 'Aggregation',
      query: 'SELECT COUNT(*) as total_count FROM your_index_name GROUP BY category',
      description: 'Count documents grouped by a field'
    },
    {
      title: 'Date Range',
      query: "SELECT * FROM your_index_name WHERE timestamp >= '2023-01-01' AND timestamp <= '2023-12-31'",
      description: 'Filter documents within a date range'
    },
    {
      title: 'Order By',
      query: 'SELECT * FROM your_index_name ORDER BY timestamp DESC LIMIT 20',
      description: 'Sort results by a field in descending order'
    },
    {
      title: 'Text Search',
      query: "SELECT * FROM your_index_name WHERE MATCH(content, 'search terms')",
      description: 'Full-text search using MATCH function'
    }
  ];

  useEffect(() => {
    checkSQLSupport();
  }, []);

  const checkSQLSupport = async () => {
    try {
      const service = getOpenSearchService();
      // Try to execute a simple SQL query to check if SQL plugin is available
      await service.executeSQLQuery('SELECT 1');
      setSqlSupported(true);
    } catch (err) {
      setSqlSupported(false);
      setError('SQL plugin not available. Make sure the OpenSearch SQL plugin is installed.');
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError('');
    const startTime = Date.now();

    try {
      const service = getOpenSearchService();
      const result = await service.executeSQLQuery(sqlQuery);
      setResults(result);
      setQueryTime(Date.now() - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(sqlQuery);
  };

  const clearResults = () => {
    setResults(null);
    setError('');
    setQueryTime(0);
  };

  const loadSampleQuery = (query: string) => {
    setSqlQuery(query);
  };

  const formatResults = () => {
    if (!results) return null;

    // Handle different result formats
    if (results.schema && results.datarows) {
      // Standard tabular format
      const columns = results.schema.map((col: any) => col.name);
      const rows = results.datarows;

      return (
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((col: string, index: number) => (
                  <TableCell key={index}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {col}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row: any[], rowIndex: number) => (
                <TableRow key={rowIndex}>
                  {row.map((cell: any, cellIndex: number) => (
                    <TableCell key={cellIndex}>
                      <Typography variant="body2">
                        {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (results.aggregations || results._shards) {
      // Elasticsearch-style result format
      return (
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 500, overflow: 'auto' }}>
          <pre style={{ fontSize: '12px', margin: 0 }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </Paper>
      );
    } else {
      // Raw result format
      return (
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 500, overflow: 'auto' }}>
          <pre style={{ fontSize: '12px', margin: 0 }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </Paper>
      );
    }
  };

  if (sqlSupported === false) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          SQL Interface
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          The OpenSearch SQL plugin is not available or not installed. 
          To use SQL queries, please install the SQL plugin in your OpenSearch cluster.
          <br /><br />
          You can install it by running: <code>bin/opensearch-plugin install opensearch-sql</code>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        SQL Interface
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 66.666%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SQL Query Editor
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={6}
                label="SQL Query"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }
                }}
                placeholder="SELECT * FROM your_index_name WHERE condition LIMIT 10"
              />

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={executeQuery}
                  disabled={loading}
                  startIcon={<PlayIcon />}
                >
                  {loading ? 'Executing...' : 'Execute Query'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={copyQuery}
                  startIcon={<CopyIcon />}
                >
                  Copy
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearResults}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {results && (
                <>
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Executed in ${queryTime}ms`} 
                      color="primary" 
                    />
                    {results.total && (
                      <Chip 
                        label={`${results.total} rows`} 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Query Results
                  </Typography>
                  {formatResults()}
                </>
              )}

              {!results && !loading && !error && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Enter a SQL query and click Execute to see results
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33.333%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Query History
              </Typography>
              
              {sampleQueries.map((sample, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">{sample.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {sample.description}
                    </Typography>
                    <Paper sx={{ p: 1, backgroundColor: '#f5f5f5', mb: 2 }}>
                      <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {sample.query}
                      </pre>
                    </Paper>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadSampleQuery(sample.query)}
                    >
                      Load Query
                    </Button>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SQL Functions
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Supported Functions:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'MATCH', 'LIKE', 'IN', 'BETWEEN'].map(func => (
                  <Chip key={func} label={func} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Operators:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {['=', '!=', '<', '>', '<=', '>=', 'AND', 'OR', 'NOT'].map(op => (
                  <Chip key={op} label={op} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Quick Tips:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                • Use index name as table name<br/>
                • String values need single quotes<br/>
                • Date format: 'YYYY-MM-DD'<br/>
                • Use LIMIT for large datasets<br/>
                • MATCH() for full-text search<br/>
                • DESC keyword for descending sort
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SQLInterface;
