import React, { useState } from 'react';
import {
  
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
} from '@mui/material';
import {
  
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Book as BookIcon,
  Help as HelpIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const Documentation: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | false>('getting-started');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const apiEndpoints = [
    {
      method: 'GET',
      endpoint: '/_cluster/health',
      description: 'Get cluster health status',
      example: 'GET localhost:9200/_cluster/health'
    },
    {
      method: 'GET',
      endpoint: '/_cat/indices',
      description: 'List all indices',
      example: 'GET localhost:9200/_cat/indices?format=json'
    },
    {
      method: 'PUT',
      endpoint: '/{index}',
      description: 'Create an index',
      example: 'PUT localhost:9200/my-index'
    },
    {
      method: 'GET',
      endpoint: '/{index}/_mapping',
      description: 'Get index mapping',
      example: 'GET localhost:9200/my-index/_mapping'
    },
    {
      method: 'POST',
      endpoint: '/{index}/_doc',
      description: 'Index a document',
      example: 'POST localhost:9200/my-index/_doc'
    },
    {
      method: 'POST',
      endpoint: '/{index}/_search',
      description: 'Search documents',
      example: 'POST localhost:9200/my-index/_search'
    },
    {
      method: 'POST',
      endpoint: '/_bulk',
      description: 'Bulk index documents',
      example: 'POST localhost:9200/_bulk'
    },
  ];

  const queryExamples = [
    {
      title: 'Match Query',
      description: 'Full-text search on a specific field',
      query: `{
  "query": {
    "match": {
      "title": "OpenSearch tutorial"
    }
  }
}`,
    },
    {
      title: 'Multi-Match Query',
      description: 'Search across multiple fields',
      query: `{
  "query": {
    "multi_match": {
      "query": "search engine",
      "fields": ["title", "content", "tags"]
    }
  }
}`,
    },
    {
      title: 'Boolean Query',
      description: 'Combine multiple query clauses',
      query: `{
  "query": {
    "bool": {
      "must": [
        {"match": {"title": "OpenSearch"}}
      ],
      "filter": [
        {"range": {"date": {"gte": "2023-01-01"}}}
      ],
      "must_not": [
        {"term": {"status": "draft"}}
      ]
    }
  }
}`,
    },
    {
      title: 'Aggregation Query',
      description: 'Group and analyze data',
      query: `{
  "query": {"match_all": {}},
  "aggs": {
    "categories": {
      "terms": {
        "field": "category",
        "size": 10
      }
    },
    "avg_score": {
      "avg": {
        "field": "score"
      }
    }
  }
}`,
    },
  ];

  const fieldTypes = [
    { type: 'text', description: 'Full-text searchable content', analyzer: 'Yes' },
    { type: 'keyword', description: 'Exact value matching, sorting, aggregations', analyzer: 'No' },
    { type: 'long', description: '64-bit signed integer', analyzer: 'No' },
    { type: 'integer', description: '32-bit signed integer', analyzer: 'No' },
    { type: 'double', description: '64-bit floating point', analyzer: 'No' },
    { type: 'float', description: '32-bit floating point', analyzer: 'No' },
    { type: 'boolean', description: 'True/false values', analyzer: 'No' },
    { type: 'date', description: 'Date/time values', analyzer: 'No' },
    { type: 'ip', description: 'IPv4 and IPv6 addresses', analyzer: 'No' },
    { type: 'geo_point', description: 'Latitude/longitude coordinates', analyzer: 'No' },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <BookIcon sx={{ mr: 1 }} />
        OpenSearch Documentation
      </Typography>

      <Accordion 
        expanded={expandedSection === 'getting-started'} 
        onChange={handleChange('getting-started')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Getting Started</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            This OpenSearch UI provides a comprehensive interface for interacting with your OpenSearch cluster.
            Here's how to get started:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="1. Configure Connection" 
                secondary="Set up your OpenSearch host, port, and authentication details in the Connection tab."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Explore Indices" 
                secondary="View existing indices or create new ones in the Index Management section."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="3. Import Data" 
                secondary="Use the CSV Import feature to bulk load data into your indices."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="4. Search & Query" 
                secondary="Use the Search Playground to test queries and explore your data."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="5. Monitor System" 
                secondary="Check cluster health and system information in the System Introspection tab."
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Security Note:</strong> This UI connects directly to OpenSearch. Ensure your OpenSearch cluster
            has proper security configurations in place for production use.
          </Alert>
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedSection === 'api-reference'} 
        onChange={handleChange('api-reference')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 1 }} />
            API Reference
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            Common OpenSearch REST API endpoints used by this interface:
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Method</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiEndpoints.map((api, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip 
                        label={api.method} 
                        size="small" 
                        color={api.method === 'GET' ? 'primary' : 
                               api.method === 'POST' ? 'success' : 
                               api.method === 'PUT' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {api.endpoint}
                    </TableCell>
                    <TableCell>{api.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Authentication
          </Typography>
          <Typography variant="body2" paragraph>
            The UI supports both authenticated and non-authenticated connections. For secure clusters,
            enable authentication in the connection settings and provide valid credentials.
          </Typography>

          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              curl -X GET "localhost:9200/_cluster/health" -H "Content-Type: application/json" -u username:password
            </Typography>
          </Paper>
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedSection === 'query-dsl'} 
        onChange={handleChange('query-dsl')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 1 }} />
            Query DSL Examples
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            OpenSearch Query DSL (Domain Specific Language) examples for common search patterns:
          </Typography>
          
          {queryExamples.map((example, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {example.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {example.description}
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre style={{ fontSize: '12px', margin: 0, overflow: 'auto' }}>
                  {example.query}
                </pre>
              </Paper>
            </Box>
          ))}

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Query Context vs Filter Context
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Query Context:</strong> How well does this document match this query clause? 
            Scores are calculated and can affect result ranking.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Filter Context:</strong> Does this document match this query clause? 
            Simple yes/no answer, no scores calculated. Faster and cacheable.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedSection === 'field-types'} 
        onChange={handleChange('field-types')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Field Types & Mappings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            Understanding field types is crucial for proper data indexing and searching:
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Analyzed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fieldTypes.map((field, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {field.type}
                    </TableCell>
                    <TableCell>{field.description}</TableCell>
                    <TableCell>{field.analyzer}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Mapping Example
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <pre style={{ fontSize: '12px', margin: 0, overflow: 'auto' }}>
{`{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "standard"
      },
      "status": {
        "type": "keyword"
      },
      "publish_date": {
        "type": "date"
      },
      "rating": {
        "type": "double"
      }
    }
  }
}`}
            </pre>
          </Paper>
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedSection === 'troubleshooting'} 
        onChange={handleChange('troubleshooting')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <HelpIcon sx={{ mr: 1 }} />
            Troubleshooting
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle1" gutterBottom>
            Common Issues & Solutions
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Connection Failed
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Check if OpenSearch is running on the specified host and port" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Verify network connectivity and firewall settings" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Ensure CORS is properly configured for browser access" />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Authentication Errors
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Verify username and password are correct" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Check if the user has necessary permissions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Ensure security plugin is properly configured" />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Query Failures
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Check JSON syntax in raw queries" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Verify field names exist in the index mapping" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Ensure proper field types for query operations" />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Import Issues
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Verify CSV format and encoding (UTF-8 recommended)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Check field type mappings match your data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Monitor cluster resources during large imports" />
              </ListItem>
            </List>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Performance Tip:</strong> For large datasets, consider creating indices with appropriate 
            shard and replica settings before importing data.
          </Alert>
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedSection === 'resources'} 
        onChange={handleChange('resources')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Additional Resources</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            Useful links and resources for learning more about OpenSearch:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary={<Link href="https://opensearch.org/docs/" target="_blank" rel="noopener">Official OpenSearch Documentation</Link>}
                secondary="Comprehensive documentation for all OpenSearch features"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={<Link href="https://opensearch.org/docs/latest/opensearch/query-dsl/" target="_blank" rel="noopener">Query DSL Reference</Link>}
                secondary="Complete reference for OpenSearch query syntax"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={<Link href="https://opensearch.org/docs/latest/opensearch/rest-api/" target="_blank" rel="noopener">REST API Reference</Link>}
                secondary="Full REST API documentation"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={<Link href="https://opensearch.org/docs/latest/security-plugin/" target="_blank" rel="noopener">Security Plugin</Link>}
                secondary="Security configuration and best practices"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={<Link href="https://github.com/opensearch-project" target="_blank" rel="noopener">OpenSearch GitHub</Link>}
                secondary="Source code, issues, and community contributions"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Community & Support
          </Typography>
          <Typography variant="body2" paragraph>
            Join the OpenSearch community for help, discussions, and contributions:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• OpenSearch Forum for questions and discussions" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• GitHub Issues for bug reports and feature requests" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Slack community for real-time chat" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Documentation;
