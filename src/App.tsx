import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  ThemeProvider,
  createTheme,
  Chip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Book as BookIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Code as SQLIcon,
  Settings as SystemIcon,
} from '@mui/icons-material';

// Import components
import ConnectionManager from './components/ConnectionManager';
import IndexManagerSimple from './components/IndexManagerSimple';
import AdvancedSearchPlayground from './components/AdvancedSearchPlayground';
import CSVImporter from './components/CSVImporter';
import SQLInterface from './components/SQLInterface';
import SystemIntrospection from './components/SystemIntrospection';
import Documentation from './components/Documentation';
import { OpenSearchConfig } from './services/opensearch';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  requiresConnection?: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState('connection');
  const [connected, setConnected] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState<OpenSearchConfig | null>(null);

  const handleConnectionChange = (isConnected: boolean, config: OpenSearchConfig) => {
    setConnected(isConnected);
    setConnectionConfig(config);
    if (isConnected && activeTab === 'connection') {
      setActiveTab('indices');
    }
  };

  const navigationItems: NavigationItem[] = [
    {
      id: 'connection',
      label: 'Connection',
      icon: <LinkIcon />,
      component: <ConnectionManager onConnectionChange={handleConnectionChange} />,
    },
    {
      id: 'search',
      label: 'Search & Query',
      icon: <SearchIcon />,
      component: <AdvancedSearchPlayground />,
      requiresConnection: true,
    },
    {
      id: 'indices',
      label: 'Index Management',
      icon: <StorageIcon />,
      component: <IndexManagerSimple />,
      requiresConnection: true,
    },
    {
      id: 'import',
      label: 'Data Import',
      icon: <UploadIcon />,
      component: <CSVImporter />,
      requiresConnection: true,
    },
    {
      id: 'sql',
      label: 'SQL Interface',
      icon: <SQLIcon />,
      component: <SQLInterface />,
      requiresConnection: true,
    },
    {
      id: 'system',
      label: 'System Info',
      icon: <SystemIcon />,
      component: <SystemIntrospection />,
      requiresConnection: true,
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: <BookIcon />,
      component: <Documentation />,
    },
  ];

  const currentItem = navigationItems.find(item => item.id === activeTab);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              OpenSearch Experimenter
            </Typography>
            {connectionConfig && (
              <Chip
                label={`${connectionConfig.protocol}://${connectionConfig.host}:${connectionConfig.port}`}
                color={connected ? 'success' : 'default'}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              />
            )}
          </Toolbar>
        </AppBar>

        {/* Navigation Drawer */}
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              🔍 OpenSearch UI
            </Typography>
          </Toolbar>
          
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  disabled={item.requiresConnection && !connected}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
            width: `calc(100% - ${drawerWidth}px)`,
          }}
        >
          <Toolbar />
          
          <Container maxWidth="xl" sx={{ mt: 2 }}>
            {currentItem?.component}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
