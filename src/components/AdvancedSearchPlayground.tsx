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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
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

interface QueryFilter {
  field: string;
  value: string;
  type: 'term' | 'match' | 'range' | 'exists' | 'prefix' | 'wildcard';
  boolType: 'must' | 'should' | 'must_not' | 'filter';
}

interface AggregationConfig {
  name: string;
  type: 'terms' | 'date_histogram' | 'histogram' | 'avg' | 'sum' | 'max' | 'min' | 'cardinality';
  field: string;
  size?: number;
  interval?: string;
}

const AdvancedSearchPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [indices, setIndices] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [searchAllIndices, setSearchAllIndices] = useState(false);
  
  // Basic Query State
  const [queryType, setQueryType] = useState('multi_match');
  const [queryText, setQueryText] = useState('');
  const [queryFields, setQueryFields] = useState<string[]>(['']);
  const [fuzziness, setFuzziness] = useState('AUTO');
  const [boost, setBoost] = useState(1.0);
  
  // Advanced Query Features
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [aggregations, setAggregations] = useState<AggregationConfig[]>([]);
  const [highlight, setHighlight] = useState(true);
  const [highlightFields, setHighlightFields] = useState('');
  const [includeSource, setIncludeSource] = useState(true);
  const [sourceFields, setSourceFields] = useState('');
  const [explain, setExplain] = useState(false);
  const [trackScores, setTrackScores] = useState(true);
  
  // Pagination & Sorting
  const [size, setSize] = useState(10);
  const [from, setFrom] = useState(0);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchAfter, setSearchAfter] = useState('');
  
  // Raw Query State
  const [rawQuery, setRawQuery] = useState(JSON.stringify({
    query: {
      multi_match: {
        query: "your search terms",
        fields: ["title^2", "content", "description"]
      }
    },
    highlight: {
      fields: {
        "title": {},
        "content": {}
      }
    },
    aggs: {
      "categories": {
        "terms": {
          "field": "category.keyword",
          "size": 10
        }
      }
    }
  }, null, 2));
  
  // Results
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryTime, setQueryTime] = useState(0);

  const queryTypes = [
    { value: 'multi_match', label: 'Multi-Match', desc: 'Search across multiple fields' },
    { value: 'match', label: 'Match', desc: 'Full-text search on a single field' },
    { value: 'match_phrase', label: 'Match Phrase', desc: 'Exact phrase search' },
    { value: 'match_phrase_prefix', label: 'Match Phrase Prefix', desc: 'Prefix phrase search' },
    { value: 'query_string', label: 'Query String', desc: 'Lucene query syntax' },
    { value: 'simple_query_string', label: 'Simple Query String', desc: 'Simplified query syntax' },
    { value: 'term', label: 'Term', desc: 'Exact term match' },
    { value: 'terms', label: 'Terms', desc: 'Match any of multiple terms' },
    { value: 'range', label: 'Range', desc: 'Range queries for numbers/dates' },
    { value: 'exists', label: 'Exists', desc: 'Field must exist' },
    { value: 'fuzzy', label: 'Fuzzy', desc: 'Fuzzy matching' },
    { value: 'wildcard', label: 'Wildcard', desc: 'Wildcard patterns' },
    { value: 'regexp', label: 'Regexp', desc: 'Regular expressions' },
    { value: 'more_like_this', label: 'More Like This', desc: 'Find similar documents' },
    { value: 'function_score', label: 'Function Score', desc: 'Custom scoring functions' },
    { value: 'bool', label: 'Boolean', desc: 'Complex boolean logic' },
    { value: 'nested', label: 'Nested', desc: 'Query nested objects' },
    { value: 'match_all', label: 'Match All', desc: 'Match all documents' },
  ];

  const multiMatchTypes = [
    'best_fields', 'most_fields', 'cross_fields', 'phrase', 'phrase_prefix', 'bool_prefix'
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

  const buildAdvancedQuery = () => {
    const query: any = {};
    
    // Main query construction
    if (queryType === 'multi_match') {
      query.multi_match = {
        query: queryText,
        fields: queryFields.filter(f => f.trim()),
        type: 'best_fields',
        fuzziness: fuzziness === 'AUTO' ? 'AUTO' : parseInt(fuzziness) || 0,
        boost: boost
      };
    } else if (queryType === 'bool') {
      const boolQuery: any = { must: [], should: [], must_not: [], filter: [] };
      
      if (queryText) {
        boolQuery.must.push({
          multi_match: {
            query: queryText,
            fields: queryFields.filter(f => f.trim())
          }
        });
      }
      
      filters.forEach(filter => {
        const filterQuery: any = {};
        if (filter.type === 'term') {
          filterQuery.term = { [filter.field]: filter.value };
        } else if (filter.type === 'match') {
          filterQuery.match = { [filter.field]: filter.value };
        } else if (filter.type === 'range') {
          try {
            filterQuery.range = { [filter.field]: JSON.parse(filter.value) };
          } catch {
            filterQuery.range = { [filter.field]: { gte: filter.value } };
          }
        } else if (filter.type === 'exists') {
          filterQuery.exists = { field: filter.field };
        } else if (filter.type === 'prefix') {
          filterQuery.prefix = { [filter.field]: filter.value };
        } else if (filter.type === 'wildcard') {
          filterQuery.wildcard = { [filter.field]: filter.value };
        }
        
        boolQuery[filter.boolType].push(filterQuery);
      });
      
      query.bool = boolQuery;
    } else if (queryType === 'more_like_this') {
      query.more_like_this = {
        fields: queryFields.filter(f => f.trim()),
        like: queryText,
        min_term_freq: 1,
        max_query_terms: 12
      };
    } else if (queryType === 'function_score') {
      query.function_score = {
        query: {
          multi_match: {
            query: queryText,
            fields: queryFields.filter(f => f.trim())
          }
        },
        functions: [
          {
            filter: { match_all: {} },
            weight: 1.5
          }
        ],
        boost_mode: "multiply"
      };
    } else if (queryType === 'nested') {
      query.nested = {
        path: "nested_field",
        query: {
          match: {
            "nested_field.name": queryText
          }
        }
      };
    } else if (queryText) {
      if (queryType === 'query_string') {
        query.query_string = {
          query: queryText,
          fields: queryFields.filter(f => f.trim()),
          default_operator: 'AND'
        };
      } else if (queryType === 'simple_query_string') {
        query.simple_query_string = {
          query: queryText,
          fields: queryFields.filter(f => f.trim())
        };
      } else if (queryType === 'terms') {
        query.terms = {
          [queryFields[0] || '_all']: queryText.split(',').map(t => t.trim())
        };
      } else if (queryType === 'range') {
        try {
          query.range = { [queryFields[0] || 'timestamp']: JSON.parse(queryText) };
        } catch {
          query.range = { [queryFields[0] || 'timestamp']: { gte: queryText } };
        }
      } else if (queryType === 'exists') {
        query.exists = { field: queryFields[0] || '_all' };
      } else if (queryType === 'fuzzy') {
        query.fuzzy = {
          [queryFields[0] || '_all']: {
            value: queryText,
            fuzziness: fuzziness === 'AUTO' ? 'AUTO' : parseInt(fuzziness) || 2
          }
        };
      } else if (queryType === 'wildcard') {
        query.wildcard = { [queryFields[0] || '_all']: queryText };
      } else if (queryType === 'regexp') {
        query.regexp = { [queryFields[0] || '_all']: queryText };
      } else {
        // Default to match/match_phrase
        query[queryType] = { [queryFields[0] || '_all']: queryText };
      }
    } else {
      query.match_all = {};
    }

    const searchBody: any = { 
      query, 
      size, 
      from,
      track_scores: trackScores,
      explain: explain
    };
    
    // Source filtering
    if (!includeSource) {
      searchBody._source = false;
    } else if (sourceFields.trim()) {
      searchBody._source = sourceFields.split(',').map(f => f.trim());
    }
    
    // Sorting
    if (sortField) {
      searchBody.sort = [{ [sortField]: { order: sortOrder } }];
    }
    
    // Search after for pagination
    if (searchAfter) {
      try {
        searchBody.search_after = JSON.parse(searchAfter);
      } catch {
        // Ignore invalid search_after
      }
    }
    
    // Highlighting
    if (highlight) {
      const highlightConfig: any = {
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
        fields: {}
      };
      
      if (highlightFields.trim()) {
        highlightFields.split(',').forEach(field => {
          highlightConfig.fields[field.trim()] = {};
        });
      } else {
        queryFields.filter(f => f.trim()).forEach(field => {
          highlightConfig.fields[field] = {};
        });
      }
      
      searchBody.highlight = highlightConfig;
    }
    
    // Aggregations
    if (aggregations.length > 0) {
      const aggs: any = {};
      aggregations.forEach(agg => {
        if (agg.type === 'terms') {
          aggs[agg.name] = {
            terms: {
              field: agg.field,
              size: agg.size || 10
            }
          };
        } else if (agg.type === 'date_histogram') {
          aggs[agg.name] = {
            date_histogram: {
              field: agg.field,
              calendar_interval: agg.interval || 'day'
            }
          };
        } else if (agg.type === 'histogram') {
          aggs[agg.name] = {
            histogram: {
              field: agg.field,
              interval: parseInt(agg.interval || '1')
            }
          };
        } else {
          // Metric aggregations
          aggs[agg.name] = {
            [agg.type]: {
              field: agg.field
            }
          };
        }
      });
      searchBody.aggs = aggs;
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
        searchQuery = buildAdvancedQuery();
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

  const addQueryField = () => {
    setQueryFields([...queryFields, '']);
  };

  const removeQueryField = (index: number) => {
    setQueryFields(queryFields.filter((_, i) => i !== index));
  };

  const updateQueryField = (index: number, value: string) => {
    const newFields = [...queryFields];
    newFields[index] = value;
    setQueryFields(newFields);
  };

  const addFilter = () => {
    setFilters([...filters, { field: '', value: '', type: 'term', boolType: 'must' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof QueryFilter, value: any) => {
    const newFilters = [...filters];
    (newFilters[index] as any)[field] = value;
    setFilters(newFilters);
  };

  const addAggregation = () => {
    setAggregations([...aggregations, { name: 'agg_1', type: 'terms', field: '', size: 10 }]);
  };

  const removeAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const updateAggregation = (index: number, field: keyof AggregationConfig, value: any) => {
    const newAggs = [...aggregations];
    (newAggs[index] as any)[field] = value;
    setAggregations(newAggs);
  };

  const copyQuery = () => {
    const query = activeTab === 0 ? JSON.stringify(buildAdvancedQuery(), null, 2) : rawQuery;
    navigator.clipboard.writeText(query);
  };

  const clearResults = () => {
    setResults(null);
    setError('');
    setQueryTime(0);
  };

  const loadQueryTemplate = (template: string) => {
    const templates: { [key: string]: any } = {
      'multi_match': {
        query: {
          multi_match: {
            query: "your search terms",
            fields: ["title^2", "content", "description"],
            type: "best_fields",
            fuzziness: "AUTO"
          }
        }
      },
      'bool_with_filters': {
        query: {
          bool: {
            must: [
              { match: { title: "search terms" } }
            ],
            filter: [
              { term: { status: "published" } },
              { range: { publish_date: { gte: "2023-01-01" } } }
            ]
          }
        }
      },
      'aggregations': {
        query: { match_all: {} },
        aggs: {
          categories: {
            terms: { field: "category.keyword", size: 10 }
          },
          date_histogram: {
            date_histogram: {
              field: "timestamp",
              calendar_interval: "day"
            }
          }
        }
      },
      'more_like_this': {
        query: {
          more_like_this: {
            fields: ["title", "content"],
            like: "sample text to find similar documents",
            min_term_freq: 1,
            max_query_terms: 12
          }
        }
      },
      'function_score': {
        query: {
          function_score: {
            query: { match: { title: "search terms" } },
            functions: [
              {
                filter: { match: { category: "important" } },
                weight: 2
              }
            ],
            boost_mode: "multiply"
          }
        }
      }
    };
    
    setRawQuery(JSON.stringify(templates[template], null, 2));
    setActiveTab(1);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Advanced Search Playground
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Query Builder Panel */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 60%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Query Builder
              </Typography>

              {/* Index Selection */}
              <Box sx={{ mb: 3 }}>
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
                <Tab label="Templates" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                {/* Query Type and Basic Config */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Query Configuration
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
                      <FormControl fullWidth>
                        <InputLabel>Query Type</InputLabel>
                        <Select
                          value={queryType}
                          onChange={(e) => setQueryType(e.target.value)}
                          label="Query Type"
                        >
                          {queryTypes.map(type => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box>
                                <Typography variant="body2">{type.label}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {type.desc}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                      <TextField
                        fullWidth
                        label="Fuzziness"
                        value={fuzziness}
                        onChange={(e) => setFuzziness(e.target.value)}
                        placeholder="AUTO, 0, 1, 2"
                      />
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Boost"
                        value={boost}
                        onChange={(e) => setBoost(parseFloat(e.target.value) || 1.0)}
                        inputProps={{
                          step: "0.1"
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Query Text and Fields */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Query Text"
                    multiline
                    rows={2}
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    disabled={queryType === 'match_all'}
                    sx={{ mb: 2 }}
                  />
                  
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">Query Fields</Typography>
                      <IconButton size="small" onClick={addQueryField}>
                        <AddIcon />
                      </IconButton>
                    </Box>
                    {queryFields.map((field, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="field_name^boost"
                          value={field}
                          onChange={(e) => updateQueryField(index, e.target.value)}
                        />
                        {queryFields.length > 1 && (
                          <IconButton size="small" onClick={() => removeQueryField(index)}>
                            <RemoveIcon />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Boolean Filters */}
                {queryType === 'bool' && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Boolean Filters</Typography>
                      <IconButton size="small" onClick={addFilter}>
                        <AddIcon />
                      </IconButton>
                    </Box>
                    {filters.map((filter, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
                          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 16.67%' } }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={filter.boolType}
                                onChange={(e) => updateFilter(index, 'boolType', e.target.value)}
                                label="Type"
                              >
                                <MenuItem value="must">Must</MenuItem>
                                <MenuItem value="should">Should</MenuItem>
                                <MenuItem value="must_not">Must Not</MenuItem>
                                <MenuItem value="filter">Filter</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 16.67%' } }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Query</InputLabel>
                              <Select
                                value={filter.type}
                                onChange={(e) => updateFilter(index, 'type', e.target.value)}
                                label="Query"
                              >
                                <MenuItem value="term">Term</MenuItem>
                                <MenuItem value="match">Match</MenuItem>
                                <MenuItem value="range">Range</MenuItem>
                                <MenuItem value="exists">Exists</MenuItem>
                                <MenuItem value="prefix">Prefix</MenuItem>
                                <MenuItem value="wildcard">Wildcard</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Field"
                              value={filter.field}
                              onChange={(e) => updateFilter(index, 'field', e.target.value)}
                            />
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33.33%' } }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Value"
                              value={filter.value}
                              onChange={(e) => updateFilter(index, 'value', e.target.value)}
                              placeholder={filter.type === 'range' ? '{"gte": 10, "lte": 20}' : ''}
                            />
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 auto' } }}>
                            <IconButton size="small" onClick={() => removeFilter(index)}>
                              <RemoveIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* Aggregations */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Aggregations</Typography>
                    <IconButton size="small" onClick={addAggregation}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                  {aggregations.map((agg, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Name"
                            value={agg.name}
                            onChange={(e) => updateAggregation(index, 'name', e.target.value)}
                          />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={agg.type}
                              onChange={(e) => updateAggregation(index, 'type', e.target.value)}
                              label="Type"
                            >
                              <MenuItem value="terms">Terms</MenuItem>
                              <MenuItem value="date_histogram">Date Histogram</MenuItem>
                              <MenuItem value="histogram">Histogram</MenuItem>
                              <MenuItem value="avg">Average</MenuItem>
                              <MenuItem value="sum">Sum</MenuItem>
                              <MenuItem value="max">Max</MenuItem>
                              <MenuItem value="min">Min</MenuItem>
                              <MenuItem value="cardinality">Cardinality</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 16.67%' } }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Field"
                            value={agg.field}
                            onChange={(e) => updateAggregation(index, 'field', e.target.value)}
                          />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 16.67%' } }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={agg.type === 'terms' ? 'Size' : 'Interval'}
                            value={agg.type === 'terms' ? agg.size : agg.interval}
                            onChange={(e) => updateAggregation(index, agg.type === 'terms' ? 'size' : 'interval', e.target.value)}
                          />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 auto' } }}>
                          <IconButton size="small" onClick={() => removeAggregation(index)}>
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>

                {/* Additional Options */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Advanced Options</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33.33%' } }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={highlight}
                              onChange={(e) => setHighlight(e.target.checked)}
                            />
                          }
                          label="Enable Highlighting"
                        />
                        {highlight && (
                          <TextField
                            fullWidth
                            size="small"
                            label="Highlight Fields"
                            value={highlightFields}
                            onChange={(e) => setHighlightFields(e.target.value)}
                            placeholder="title,content,description"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33.33%' } }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={includeSource}
                              onChange={(e) => setIncludeSource(e.target.checked)}
                            />
                          }
                          label="Include Source"
                        />
                        {includeSource && (
                          <TextField
                            fullWidth
                            size="small"
                            label="Source Fields"
                            value={sourceFields}
                            onChange={(e) => setSourceFields(e.target.value)}
                            placeholder="field1,field2,field3"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33.33%' } }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={explain}
                              onChange={(e) => setExplain(e.target.checked)}
                            />
                          }
                          label="Explain Scoring"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={trackScores}
                              onChange={(e) => setTrackScores(e.target.checked)}
                            />
                          }
                          label="Track Scores"
                          sx={{ display: 'block', mt: 1 }}
                        />
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Size"
                          value={size}
                          onChange={(e) => setSize(parseInt(e.target.value) || 10)}
                        />
                      </Box>
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="From"
                          value={from}
                          onChange={(e) => setFrom(parseInt(e.target.value) || 0)}
                        />
                      </Box>
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
                        <TextField
                          fullWidth
                          label="Sort Field"
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value)}
                        />
                      </Box>
                      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
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
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Generated Query Preview */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Generated Query:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 400, overflow: 'auto' }}>
                    <pre style={{ fontSize: '12px', margin: 0 }}>
                      {JSON.stringify(buildAdvancedQuery(), null, 2)}
                    </pre>
                  </Paper>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  label="Raw Query (JSON)"
                  value={rawQuery}
                  onChange={(e) => setRawQuery(e.target.value)}
                  sx={{ fontFamily: 'monospace' }}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" gutterBottom>
                  Query Templates
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { key: 'multi_match', title: 'Multi-Match Query', desc: 'Search across multiple fields with boosting' },
                    { key: 'bool_with_filters', title: 'Boolean with Filters', desc: 'Complex boolean query with filters' },
                    { key: 'aggregations', title: 'Aggregations Example', desc: 'Terms and date histogram aggregations' },
                    { key: 'more_like_this', title: 'More Like This', desc: 'Find similar documents' },
                    { key: 'function_score', title: 'Function Score', desc: 'Custom scoring functions' }
                  ].map(template => (
                    <Box key={template.key} sx={{ flex: '1 1 100%' }}>
                      <Card variant="outlined" sx={{ cursor: 'pointer', height: '100%' }} onClick={() => loadQueryTemplate(template.key)}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>{template.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.desc}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </TabPanel>

              <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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

        {/* Results Panel */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 40%' } }}>
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
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                    {results.timed_out && (
                      <Chip 
                        label="Timed out" 
                        color="error"
                        variant="outlined" 
                      />
                    )}
                  </Box>

                  {/* Aggregations */}
                  {(results as any).aggregations && (
                    <Accordion sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">Aggregations</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: 200 }}>
                          {JSON.stringify((results as any).aggregations, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {results.hits.hits.length > 0 ? (
                      results.hits.hits.map((hit: any) => (
                        <Accordion key={hit._id}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
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
                            {hit.highlight && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Highlights:
                                </Typography>
                                <Box sx={{ backgroundColor: '#fff3cd', p: 1, borderRadius: 1, mb: 2 }}>
                                  {Object.entries(hit.highlight).map(([field, highlights]) => (
                                    <div key={field}>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                        {field}:
                                      </Typography>
                                      {(highlights as string[]).map((highlight, i) => (
                                        <Typography 
                                          key={i} 
                                          variant="body2" 
                                          dangerouslySetInnerHTML={{ __html: highlight }}
                                          sx={{ ml: 1 }}
                                        />
                                      ))}
                                    </div>
                                  ))}
                                </Box>
                              </Box>
                            )}
                            
                            {hit._explanation && (
                              <Accordion variant="outlined" sx={{ mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="subtitle2">Score Explanation</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <pre style={{ fontSize: '11px', overflow: 'auto' }}>
                                    {JSON.stringify(hit._explanation, null, 2)}
                                  </pre>
                                </AccordionDetails>
                              </Accordion>
                            )}
                            
                            <Typography variant="subtitle2" gutterBottom>
                              Document Source:
                            </Typography>
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
                      ))
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
    </Box>
  );
};

export default AdvancedSearchPlayground;
