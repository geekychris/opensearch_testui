import React, { useState, useRef } from 'react';
import {
  
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  
  Grid,
} from '@mui/material';
import {
  
  Upload as UploadIcon,
  GetApp as DownloadIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';
import {
   getOpenSearchService } from '../services/opensearch';

interface CSVColumn {
  name: string;
  type: string;
  sample: string;
  enabled: boolean;
}

interface ImportProgress {
  total: number;
  processed: number;
  errors: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

const CSVImporter: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<CSVColumn[]>([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [indices, setIndices] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    errors: 0,
    status: 'idle'
  });
  const [bulkOperations, setBulkOperations] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = ['Upload CSV', 'Map Fields', 'Configure Import', 'Import Data'];

  const fieldTypes = [
    'text', 'keyword', 'long', 'integer', 'short', 'byte', 'double', 'float',
    'boolean', 'date', 'ip', 'geo_point'
  ];

  React.useEffect(() => {
    loadIndices();
  }, []);

  const loadIndices = async () => {
    try {
      const service = getOpenSearchService();
      const indexList = await service.listIndices();
      setIndices(indexList.map((index: any) => index.index));
    } catch (err) {
      console.error('Failed to load indices:', err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          return;
        }

        setCsvData(results.data);
        
        // Auto-detect column types
        const headers = Object.keys(results.data[0] || {});
        const detectedColumns: CSVColumn[] = headers.map(header => {
          const sampleValues = results.data.slice(0, 5).map((row: any) => row[header]).filter(v => v);
          const sampleValue = sampleValues[0] || '';
          
          let detectedType = 'text';
          
          // Simple type detection
          if (sampleValues.every(v => !isNaN(Number(v)) && Number.isInteger(Number(v)))) {
            detectedType = 'integer';
          } else if (sampleValues.every(v => !isNaN(Number(v)))) {
            detectedType = 'double';
          } else if (sampleValues.every(v => v === 'true' || v === 'false')) {
            detectedType = 'boolean';
          } else if (sampleValues.some(v => /^\d{4}-\d{2}-\d{2}/.test(v))) {
            detectedType = 'date';
          } else if (header.toLowerCase().includes('email') || sampleValue.includes('@')) {
            detectedType = 'keyword';
          } else if (header.toLowerCase().includes('id') || header.toLowerCase().includes('key')) {
            detectedType = 'keyword';
          }

          return {
            name: header,
            type: detectedType,
            sample: sampleValue,
            enabled: true
          };
        });

        setColumns(detectedColumns);
        setActiveStep(1);
        setError('');
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const updateColumnType = (index: number, type: string) => {
    const newColumns = [...columns];
    newColumns[index].type = type;
    setColumns(newColumns);
  };

  const toggleColumnEnabled = (index: number) => {
    const newColumns = [...columns];
    newColumns[index].enabled = !newColumns[index].enabled;
    setColumns(newColumns);
  };

  const generateBulkOperations = () => {
    const operations: any[] = [];
    const enabledColumns = columns.filter(col => col.enabled);
    
    csvData.forEach((row, index) => {
      // Index operation
      operations.push({
        index: {
          _index: selectedIndex,
          _id: `csv_import_${Date.now()}_${index}`
        }
      });

      // Document data
      const document: any = {};
      enabledColumns.forEach(col => {
        let value = row[col.name];
        
        // Type conversion
        if (value !== undefined && value !== null && value !== '') {
          switch (col.type) {
            case 'integer':
            case 'long':
            case 'short':
            case 'byte':
              value = parseInt(value);
              break;
            case 'double':
            case 'float':
              value = parseFloat(value);
              break;
            case 'boolean':
              value = value.toLowerCase() === 'true';
              break;
            case 'date':
              // Try to parse as ISO date
              if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                value = new Date(value).toISOString();
              }
              break;
          }
        }
        
        document[col.name] = value;
      });

      operations.push(document);
    });

    setBulkOperations(operations);
    setActiveStep(3);
  };

  const downloadBulkJSON = () => {
    const jsonContent = bulkOperations.map(op => JSON.stringify(op)).join('\n');
    const blob = new Blob([jsonContent], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedIndex}_bulk_import.ndjson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const executeImport = async () => {
    if (!selectedIndex || bulkOperations.length === 0) return;

    setProgress({
      total: csvData.length,
      processed: 0,
      errors: 0,
      status: 'processing'
    });

    try {
      const service = getOpenSearchService();
      
      // Split into batches of 1000 operations (500 documents)
      const batchSize = 1000; // 1000 operations = 500 documents (each doc has index + data)
      const batches = [];
      
      for (let i = 0; i < bulkOperations.length; i += batchSize) {
        batches.push(bulkOperations.slice(i, i + batchSize));
      }

      let processed = 0;
      let errors = 0;

      for (const batch of batches) {
        try {
          const result = await service.bulkIndex(batch);
          
          if (result.errors) {
            const batchErrors = result.items.filter((item: any) => 
              item.index && item.index.error
            ).length;
            errors += batchErrors;
          }
          
          processed += batch.length / 2; // Each document has 2 operations
          
          setProgress(prev => ({
            ...prev,
            processed,
            errors
          }));

          // Small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (batchError) {
          console.error('Batch import error:', batchError);
          errors += batch.length / 2;
          processed += batch.length / 2;
        }
      }

      setProgress(prev => ({
        ...prev,
        status: errors === 0 ? 'completed' : 'error'
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setProgress(prev => ({
        ...prev,
        status: 'error'
      }));
    }
  };

  const resetImporter = () => {
    setActiveStep(0);
    setCsvData([]);
    setColumns([]);
    setSelectedIndex('');
    setError('');
    setBulkOperations([]);
    setProgress({
      total: 0,
      processed: 0,
      errors: 0,
      status: 'idle'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<UploadIcon />}
            >
              Select CSV File
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Upload a CSV file to import data into OpenSearch
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Map CSV Fields ({csvData.length} records)
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Enabled</TableCell>
                    <TableCell>Field Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Sample Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {columns.map((column, index) => (
                    <TableRow key={column.name}>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => toggleColumnEnabled(index)}
                          color={column.enabled ? 'primary' : 'inherit'}
                        >
                          {column.enabled ? '✓' : '✗'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {column.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={column.type}
                            onChange={(e) => updateColumnType(index, e.target.value)}
                          >
                            {fieldTypes.map(type => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {column.sample}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!columns.some(col => col.enabled)}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Import
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                <FormControl fullWidth>
                  <InputLabel>Target Index</InputLabel>
                  <Select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    label="Target Index"
                  >
                    {indices.map(index => (
                      <MenuItem key={index} value={index}>{index}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2">
                Records to import: <strong>{csvData.length}</strong>
              </Typography>
              <Typography variant="body2">
                Fields to import: <strong>{columns.filter(col => col.enabled).length}</strong>
              </Typography>
              <Box sx={{ mt: 1 }}>
                {columns.filter(col => col.enabled).map(col => (
                  <Chip
                    key={col.name}
                    label={`${col.name} (${col.type})`}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={generateBulkOperations}
                disabled={!selectedIndex}
              >
                Generate Import
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Data
            </Typography>
            
            {progress.status === 'processing' && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(progress.processed / progress.total) * 100} 
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Processed: {progress.processed} / {progress.total} records
                  {progress.errors > 0 && ` (${progress.errors} errors)`}
                </Typography>
              </Box>
            )}

            {progress.status === 'completed' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Import completed successfully! Processed {progress.processed} records
                {progress.errors > 0 && ` with ${progress.errors} errors`}.
              </Alert>
            )}

            {progress.status === 'error' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Import completed with errors. Processed {progress.processed} records with {progress.errors} errors.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={downloadBulkJSON}
                startIcon={<DownloadIcon />}
              >
                Download Bulk JSON
              </Button>
              <Button
                variant="contained"
                onClick={executeImport}
                disabled={progress.status === 'processing' || !selectedIndex}
                startIcon={<SendIcon />}
              >
                {progress.status === 'processing' ? 'Importing...' : 'Import to OpenSearch'}
              </Button>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                onClick={() => setActiveStep(2)}
                disabled={progress.status === 'processing'}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                onClick={resetImporter}
                disabled={progress.status === 'processing'}
              >
                Start Over
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        CSV Import
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {renderStepContent()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CSVImporter;
