import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Define base directory for all token files
const BASE_TOKENS_DIR = path.join(__dirname, '../../../../packages/tokens/build');
const WEB_TOKENS_DIR = path.join(BASE_TOKENS_DIR, 'web');
const GLOBAL_DIR = path.join(WEB_TOKENS_DIR, 'global');

// Middleware
app.use(express.json());

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Utility function to get token file path based on the new structure
const getTokenFilePath = (brand: string, tokenType: string, format: string) => {
  // Check if the file exists with the pattern: [brand]-[tokenType].[format]
  const fileName = `${brand}-${tokenType}.${format}`;
  const filePath = path.join(GLOBAL_DIR, brand, format, fileName);
  
  console.log(`Looking for token file at: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  
  // If not found and tokenType is 'tokens', check for just 'tokens.css'
  if (tokenType === 'tokens') {
    const tokensFilePath = path.join(GLOBAL_DIR, brand, format, `tokens.${format}`);
    console.log(`Looking for generic tokens file at: ${tokensFilePath}`);
    if (fs.existsSync(tokensFilePath)) {
      return tokensFilePath;
    }
  }
  
  return null;
};

// Helper to list available files in a directory
const listAvailableFiles = (dirPath: string, extension: string): string[] => {
  if (!fs.existsSync(dirPath)) return [];
  
  try {
    return fs.readdirSync(dirPath)
      .filter(file => file.endsWith(`.${extension}`))
      .map(file => file.replace(`.${extension}`, ''));
  } catch (err) {
    console.error(`Error listing files in ${dirPath}:`, err);
    return [];
  }
};

// API Endpoint: List available brands
app.get('/api/tokens/brands', (req, res) => {
  try {
    // The brands are the directories directly under global
    if (fs.existsSync(GLOBAL_DIR)) {
      const brands = fs.readdirSync(GLOBAL_DIR)
        .filter(item => fs.statSync(path.join(GLOBAL_DIR, item)).isDirectory());
      
      return res.json({ brands });
    }
    
    res.status(404).json({ error: "Global directory not found" });
  } catch (err: unknown) {
    console.error('Error listing brands:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to list brands', details: errorMessage });
  }
});

// API Endpoint: List available token types for a brand and format
app.get('/api/tokens/:brand/:format/types', (req, res) => {
  const { brand, format } = req.params;
  const formatDir = path.join(GLOBAL_DIR, brand, format);
  
  try {
    if (fs.existsSync(formatDir)) {
      const files = fs.readdirSync(formatDir)
        .filter(file => file.endsWith(`.${format}`))
        .map(file => {
          // Extract token type from filename (brand-a-color.css -> color)
          if (file.startsWith(`${brand}-`)) {
            return file.replace(`${brand}-`, '').replace(`.${format}`, '');
          } else if (file === `tokens.${format}`) {
            return 'tokens';
          }
          return file.replace(`.${format}`, '');
        });
      
      return res.json({ 
        brand,
        format,
        tokenTypes: files
      });
    }
    
    res.status(404).json({ error: `Format directory not found for brand '${brand}'` });
  } catch (err: unknown) {
    console.error('Error listing token types:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to list token types', details: errorMessage });
  }
});

// Legacy API Endpoint: Fetch tokens by brand & format
app.get('/api/tokens/:brand/:format', (req, res) => {
  const { brand, format } = req.params;
  const validFormats = ['css', 'js', 'json', 'scss', 'md'];
  
  if (!validFormats.includes(format)) {
    return res.status(400).json({ error: `Invalid format. Supported: ${validFormats.join(', ')}` });
  }
  
  const formatDir = path.join(GLOBAL_DIR, brand, format);
  
  if (fs.existsSync(formatDir)) {
    try {
      // List all available files for this format
      const files = fs.readdirSync(formatDir)
        .filter(file => file.endsWith(`.${format}`));
      
      if (files.length === 0) {
        return res.status(404).json({ 
          error: 'No token files found',
          details: `No ${format} files found for brand '${brand}'`
        });
      }
      
      // Set appropriate content type
      setContentType(res, format);
      
      // For backward compatibility, prefer color tokens or return the first available file
      const colorFile = files.find(file => file.includes('color'));
      const fileToSend = colorFile || files[0];
      
      console.log(`Sending file: ${fileToSend}`);
      return res.sendFile(path.join(formatDir, fileToSend));
    } catch (err: unknown) {
      console.error(`Error reading directory ${formatDir}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: 'Error reading token files', details: errorMessage });
    }
  }
  
  // Directory doesn't exist
  return res.status(404).json({ 
    error: 'Token files not found', 
    details: `Brand '${brand}' with format '${format}' not found or directory doesn't exist`
  });
});

// New API Endpoint: Fetch tokens by brand, token type and format
app.get('/api/tokens/:brand/:tokenType/:format', (req, res) => {
  const { brand, tokenType, format } = req.params;
  const validFormats = ['css', 'js', 'json', 'scss', 'md'];
  
  if (!validFormats.includes(format)) {
    return res.status(400).json({ error: `Invalid format. Supported: ${validFormats.join(', ')}` });
  }
  
  const filePath = getTokenFilePath(brand, tokenType, format);
  
  if (!filePath) {
    // Get list of available token types for better error message
    const formatDir = path.join(GLOBAL_DIR, brand, format);
    const availableTokenTypes = listAvailableFiles(formatDir, format)
      .map(file => {
        if (file.startsWith(`${brand}-`)) {
          return file.replace(`${brand}-`, '');
        }
        return file;
      });
    
    return res.status(404).json({ 
      error: 'Token file not found', 
      details: `Token type '${tokenType}' for brand '${brand}' with format '${format}' not found`,
      availableTokenTypes,
      expectedPath: `global/${brand}/${format}/${brand}-${tokenType}.${format} or global/${brand}/${format}/tokens.${format}`
    });
  }
  
  // Set appropriate content type
  setContentType(res, format);
  
  return res.sendFile(filePath);
});

// Helper function to set the correct content type
function setContentType(res: express.Response, format: string) {
  if (format === 'css') res.type('text/css');
  else if (format === 'js') res.type('application/javascript'); 
  else if (format === 'scss') res.type('text/x-scss');
  else if (format === 'md') res.type('text/markdown');
  else if (format === 'json') res.type('application/json');
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Token API is running at http://localhost:${PORT}`);
  
  // Log directory structure for verification
  if (fs.existsSync(GLOBAL_DIR)) {
    console.log('Available brands:');
    const brands = fs.readdirSync(GLOBAL_DIR)
      .filter(item => fs.statSync(path.join(GLOBAL_DIR, item)).isDirectory());
    
    brands.forEach(brand => {
      console.log(`- ${brand}`);
      
      // Log available formats for each brand
      const brandDir = path.join(GLOBAL_DIR, brand);
      const formats = fs.readdirSync(brandDir)
        .filter(item => fs.statSync(path.join(brandDir, item)).isDirectory());
      
      console.log(`  Formats: ${formats.join(', ')}`);
      
      // Log available token types for each format
      formats.forEach(format => {
        const formatDir = path.join(brandDir, format);
        try {
          const files = fs.readdirSync(formatDir)
            .filter(file => file.endsWith(`.${format}`));
          
          console.log(`    ${format}: ${files.join(', ')}`);
        } catch (err) {
          console.error(`Error reading directory ${formatDir}:`, err);
        }
      });
    });
  } else {
    console.log('WARNING: Global directory not found!');
  }
});