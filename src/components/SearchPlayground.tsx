import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { getOpenSearchService, SearchResult } from '../services/opensearch';

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
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SearchPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [indices, setIndices] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [searchAllIndices, setSearchAllIndices] = useState(false);
  
  // Query Builder State
  const [queryText, setQueryText] = useState('');
  const [queryField, setQueryField] = useState('');
  const [queryType, setQueryType] = useState('match');
  const [filters, setFilters] = useState<any[]>([]);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [size, setSize] = useState(10);
  const [from, setFrom] = useState(0);
  
  // Raw Query State
  const [rawQuery, setRawQuery] = useState(JSON.stringify({
    query: {
      match_all: {}
    }
  }, null, 2));
  
  // Results
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryTime, setQueryTime] = useState(0);

  const queryTypes = [
    { value: 'match', label: 'Match' },
    { value: 'match_phrase', label: 'Match Phrase' },
    { value: 'term', label: 'Term' },
    { value: 'range', label: 'Range' },
    { value: 'wildcard', label: 'Wildcard' },
    { value: 'fuzzy', label: 'Fuzzy' },
    { value: 'bool', label: 'Boolean' },
    { value: 'match_all', label: 'Match All' },
  ];

  useEffect(() => {
    loadIndices();
  }, []);

  const loadIndices = async () => {
    try {
      const service = getOpenSearchService();
      const indexList = await service.listIndices();
      setIndices(indexList.map((index: any) => index.index));
      if (indexList.length > 0) {
        setSelectedIndex(indexList[0].index);
      }
    } catch (err) {
      console.error('Failed to load indices:', err);
    }
  };

  const buildQuery = () => {
    const query: any = {};
    
    if (queryType === 'match_all') {
      query.match_all = {};
    } else if (queryText) {
      if (queryType === 'match' && queryField) {
        query.match = { [queryField]: queryText };
      } else if (queryType === 'match_phrase' && queryField) {
        query.match_phrase = { [queryField]: queryText };
      } else if (queryType === 'term' && queryField) {
        query.term = { [queryField]: queryText };
      } else if (queryType === 'wildcard' && queryField) {
        query.wildcard = { [queryField]: queryText };
      } else if (queryType === 'fuzzy' && queryField) {
        query.fuzzy = { [queryField]: queryText };
      } else if (queryType === 'range' && queryField) {
        try {
          const rangeValues = JSON.parse(queryText);
          query.range = { [queryField]: rangeValues };
        } catch {
          query.range = { [queryField]: { gte: queryText } };
        }
      } else {
        // Default to query_string
        query.query_string = { query: queryText };
      }
    } else {
      query.match_all = {};
    }

    const searchBody: any = { query, size, from };
    
    if (sortField) {
      searchBody.sort = [{ [sortField]: { order: sortOrder } }];
    }

    return searchBody;
  };

  const executeSearch = async () => {
    if (!selectedIndex && !searchAllIndices) {
      setError('Please select an index or enable search all indices');
      return;
    }

    setLoading(true);
    setError('');
    const startTime = Date.now();

    try {
      const service = getOpenSearchService();
      let searchQuery;
      
      if (activeTab === 0) {
        searchQuery = buildQuery();
      } else {
        searchQuery = JSON.parse(rawQuery);
      }

      let searchResults;
      if (searchAllIndices) {
        searchResults = await service.searchAll(searchQuery);
      } else {
        searchResults = await service.search(selectedIndex, searchQuery);
      }

      setResults(searchResults);
      setQueryTime(Date.now() - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const copyQuery = () => {
    const query = activeTab === 0 ? JSON.stringify(buildQuery(), null, 2) : rawQuery;
    navigator.clipboard.writeText(query);
  };

  const clearResults = () => {
    setResults(null);
    setError('');
    setQueryTime(0);
  };

  const addFilter = () => {
    setFilters([...filters, { field: '', value: '', type: 'term' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: any) => {
    const newFilters = [...filters];
    (newFilters[index] as any)[field] = value;
    setFilters(newFilters);
  };

  const formatResult = (hit: any) => {
    return (
      <Accordion key={hit._id}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {hit._id}
            </Typography>
            <Chip 
              label={`Score: ${hit._score?.toFixed(2)}`} 
              size="small" 
              color="primary" 
            />
            <Chip 
              label={hit._index} 
              size="small" 
              variant="outlined" 
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
            margin: 0
          }}>
            {JSON.stringify(hit._source, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Search Playground
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Configuration
              </Typography>

              {/* Index Selection */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <InputLabel>Target Index</InputLabel>
                  <Select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    label="Target Index"
                    disabled={searchAllIndices}
                  >
                    {indices.map(index => (
                      <MenuItem key={index} value={index}>{index}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchAllIndices}
                      onChange={(e) => setSearchAllIndices(e.target.checked)}
                    />
                  }
                  label="Search All Indices"
                />
              </Box>

              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Visual Builder" />
                <Tab label="Raw Query" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                      <FormControl fullWidth>
                        <InputLabel>Query Type</InputLabel>
                        <Select
                          value={queryType}
                          onChange={(e) => setQueryType(e.target.value)}
                          label="Query Type"
                        >
                          {queryTypes.map(type => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                      <TextField
                        fullWidth
                        label="Field Name"
                        value={queryField}
                        onChange={(e) => setQueryField(e.target.value)}
                        disabled={queryType === 'match_all'}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="Query Text"
                      multiline
                      rows={2}
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      disabled={queryType === 'match_all'}
                      helperText={queryType === 'range' ? 'For range queries, use JSON format like {"gte": 10, "lte": 20}' : ''}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33.333%' } }}>
                      <TextField
                        fullWidth
                        label="Sort Field"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                      />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33.333%' } }}>
                      <FormControl fullWidth>
                        <InputLabel>Sort Order</InputLabel>
                        <Select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          label="Sort Order"
                        >
                          <MenuItem value="asc">Ascending</MenuItem>
                          <MenuItem value="desc">Descending</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33.333%' } }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Size"
                        value={size}
                        onChange={(e) => setSize(parseInt(e.target.value) || 10)}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Generated Query Preview */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Generated Query:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <pre style={{ fontSize: '12px', margin: 0, overflow: 'auto' }}>
                      {JSON.stringify(buildQuery(), null, 2)}
                    </pre>
                  </Paper>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  label="Raw Query (JSON)"
                  value={rawQuery}
                  onChange={(e) => setRawQuery(e.target.value)}
                  sx={{ fontFamily: 'monospace' }}
                />
              </TabPanel>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={executeSearch}
                  disabled={loading}
                  startIcon={<SearchIcon />}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={copyQuery}
                  startIcon={<CopyIcon />}
                >
                  Copy Query
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearResults}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Results
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {results && (
                <>
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${results.hits.total.value} hits`} 
                      color="primary" 
                    />
                    <Chip 
                      label={`${queryTime}ms`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Took: ${results.took}ms`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={results.timed_out ? 'Timed out' : 'Completed'} 
                      color={results.timed_out ? 'error' : 'success'}
                      variant="outlined" 
                    />
                  </Box>

                  <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {results.hits.hits.length > 0 ? (
                      results.hits.hits.map(formatResult)
                    ) : (
                      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No results found
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {!results && !loading && !error && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Execute a search to see results here
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Query Examples */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Query Examples
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Match All
                </Typography>
                <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  "query": {
    "match_all": {}
  }
}`}
                </pre>
              </Paper>
            </Box>
            
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Term Query
                </Typography>
                <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  "query": {
    "term": {
      "status": "published"
    }
  }
}`}
                </pre>
              </Paper>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Range Query
                </Typography>
                <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  "query": {
    "range": {
      "age": {
        "gte": 10,
        "lte": 20
      }
    }
  }
}`}
                </pre>
              </Paper>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Boolean Query
                </Typography>
                <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  "query": {
    "bool": {
      "must": [
        {"match": {"title": "search"}},
        {"range": {"date": {"gte": "2023-01-01"}}}
      ],
      "filter": [
        {"term": {"status": "published"}}
      ]
    }
  }
}`}
                </pre>
              </Paper>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Aggregations
                </Typography>
                <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  "query": {"match_all": {}},
  "aggs": {
    "popular_tags": {
      "terms": {
        "field": "tags",
        "size": 10
      }
    }
  }
}`}
                </pre>
              </Paper>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fuzzy Search
                </Typography>
                <pre style={{ fontSize: '11px', margin: 0 }}>
{`{
  "query": {
    "fuzzy": {
      "title": {
        "value": "opensearh",
        "fuzziness": "AUTO"
      }
    }
  }
}`}
                </pre>
              </Paper>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SearchPlayground;
