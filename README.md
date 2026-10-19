<p align="center">
  <img src="assets/logo.png" alt="Opensearch Testui logo" width="180">
</p>

# OpenSearch Experimenter UI

A comprehensive React-based user interface for interacting with OpenSearch clusters. This application provides a rich set of tools for managing indices, importing data, searching, and monitoring your OpenSearch deployment.

## Features

### 🔗 Connection Management
- Configure OpenSearch host, port, and protocol (HTTP/HTTPS)
- Support for authenticated and non-authenticated connections
- Connection testing and cluster information display
- Persistent connection settings

### 📊 Index Management
- List all indices with health status, document count, and size
- Create new indices with custom field mappings
- Configure field types, analyzers, and indexing options
- View and explore index mappings
- Delete indices with confirmation

### 📤 CSV Import
- Step-by-step CSV import wizard
- Automatic field type detection
- Manual field type override and configuration
- Bulk document indexing with progress tracking
- Generate and download bulk JSON for external use
- Error handling and retry mechanisms

### 🔍 Search Playground
- Visual query builder for common search patterns
- Raw JSON query editor with syntax highlighting
- Support for various query types (match, term, range, bool, etc.)
- Search across single index or all indices
- Result formatting and pagination
- Query performance metrics
- Built-in query examples and documentation

### 🖥️ System Introspection
- Real-time cluster health monitoring
- Node information and resource utilization
- Cluster settings (persistent, transient, defaults)
- Plugin inventory and version information
- Shard allocation and index statistics

### 💾 SQL Interface
- SQL query support (requires OpenSearch SQL plugin)
- Interactive SQL editor with syntax highlighting
- Tabular result display for structured queries
- Sample queries and SQL function reference
- Query execution performance metrics

### 📚 Documentation
- Comprehensive API reference
- Query DSL examples and tutorials
- Field type and mapping documentation
- Troubleshooting guides
- Links to official OpenSearch resources

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Access to an OpenSearch cluster

## Installation

1. Clone or extract the project:
   ```bash
   cd opensearch-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to http://localhost:3000

## OpenSearch Configuration

For the UI to work properly with your OpenSearch cluster, you may need to configure CORS settings:

```yaml
# opensearch.yml
http.cors.enabled: true
http.cors.allow-origin: "http://localhost:3000"
http.cors.allow-headers: "X-Requested-With, Content-Type, Content-Length, Authorization"
http.cors.allow-credentials: true
```

**Security Note:** The above configuration is for development only. For production deployments, restrict CORS origins to your specific domains.

## Usage

### Getting Started

1. **Connect to OpenSearch**: Start by configuring your connection in the "Connection" tab
2. **Explore Indices**: View existing indices or create new ones
3. **Import Data**: Use the CSV import feature to bulk load your data
4. **Search & Query**: Experiment with different query types in the Search Playground
5. **Monitor System**: Check cluster health and performance metrics

### CSV Import Process

1. Upload a CSV file (UTF-8 encoding recommended)
2. Review auto-detected field types and adjust as needed
3. Configure field properties (searchable, stored, analyzer)
4. Select target index or create a new one
5. Execute import with real-time progress tracking

### Query Building

The Search Playground offers two modes:
- **Visual Builder**: GUI-based query construction
- **Raw Query**: Direct JSON query editing

Common query patterns are provided with examples and explanations.

### System Monitoring

Monitor your cluster's health and performance:
- Cluster status and node information
- Index statistics and shard distribution
- Resource utilization and settings
- Installed plugins and versions

## Features by Component

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| Connection Manager | Cluster connectivity | Host config, auth, testing |
| Index Manager | Index operations | CRUD operations, mappings |
| CSV Importer | Data ingestion | Type detection, bulk loading |
| Search Playground | Query development | Visual + raw editors |
| System Introspection | Monitoring | Health, nodes, settings |
| SQL Interface | SQL queries | Plugin integration |
| Documentation | User guidance | Examples, troubleshooting |

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **HTTP Client**: Axios
- **CSV Processing**: PapaParse
- **State Management**: React Hooks

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (irreversible)

### Project Structure

```
src/
├── components/           # React components
│   ├── ConnectionManager.tsx
│   ├── IndexManager.tsx
│   ├── CSVImporter.tsx
│   ├── SearchPlayground.tsx
│   ├── SystemIntrospection.tsx
│   ├── SQLInterface.tsx
│   └── Documentation.tsx
├── services/            # API services
│   └── opensearch.ts
├── App.tsx             # Main application
└── index.tsx          # Application entry point
```

## OpenSearch Compatibility

This UI is compatible with:
- OpenSearch 1.x and 2.x
- Elasticsearch 7.x (with limitations)

Some features require specific plugins:
- **SQL Interface**: OpenSearch SQL plugin
- **Security**: OpenSearch Security plugin (for authentication)

## Troubleshooting

### Common Issues

**Connection Failed**
- Verify OpenSearch is running and accessible
- Check network connectivity and firewall rules
- Ensure CORS is properly configured

**Authentication Errors**
- Verify credentials are correct
- Check user permissions in OpenSearch
- Ensure security plugin is properly configured

**CSV Import Issues**
- Verify CSV format and UTF-8 encoding
- Check field type mappings match data
- Monitor cluster resources during large imports

### Performance Tips

- Use appropriate shard and replica settings for indices
- Monitor cluster resources during bulk operations
- Consider index templates for consistent mappings
- Use filters instead of queries when possible for better performance

## Security Considerations

- This UI connects directly to OpenSearch via REST API
- Ensure proper network security (VPN, firewall rules)
- Use authentication for production deployments
- Restrict CORS origins to your specific domains
- Consider using a proxy server for additional security layers

## Contributing

This is an experimental tool. Suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for experimental and educational purposes.

## Support

For issues related to:
- **OpenSearch**: Refer to [OpenSearch Documentation](https://opensearch.org/docs/)
- **This UI**: Check the troubleshooting section or create an issue

---

**Happy Searching!** 🔍
