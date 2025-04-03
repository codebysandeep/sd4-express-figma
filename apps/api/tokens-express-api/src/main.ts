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
// Utility function to get token file path based on the exact structure
const getTokenFilePath = (brand: string, format: string) => {
  // The exact structure is: build/web/global/[brand]/[format]/[brand]-color.[format]
  const filePath = path.join(GLOBAL_DIR, brand, format, `${brand}-color.${format}`);
  
  console.log(`Looking for token file at: ${filePath}`);
  return fs.existsSync(filePath) ? filePath : null;
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
// API Endpoint: Fetch tokens by brand & format
app.get('/api/tokens/:brand/:format', (req, res) => {
  const { brand, format } = req.params;
  const validFormats = ['css', 'js', 'json', 'scss', 'md'];
  if (!validFormats.includes(format)) {
    return res.status(400).json({ error: `Invalid format. Supported: ${validFormats.join(', ')}` });
  }
  const filePath = getTokenFilePath(brand, format);
  
  if (!filePath) {
    // Get list of available brands for better error message
    let availableBrands: string[] = [];
    try {
      if (fs.existsSync(GLOBAL_DIR)) {
        availableBrands = fs.readdirSync(GLOBAL_DIR)
          .filter(item => fs.statSync(path.join(GLOBAL_DIR, item)).isDirectory());
      }
    } catch (err: unknown) {
      console.error('Error listing brands:', err);
    }
    
    return res.status(404).json({ 
      error: 'Token file not found', 
      details: `Brand '${brand}' with format '${format}' not found or file doesn't exist`,
      availableBrands,
      expectedPath: `global/${brand}/${format}/${brand}-color.${format}`
    });
  }
  // Set appropriate content type
  if (format === 'css') res.type('text/css');
  else if (format === 'js') res.type('application/javascript'); 
  else if (format === 'scss') res.type('text/x-scss');
  else if (format === 'md') res.type('text/markdown');
  
  return res.sendFile(filePath);
});
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
    });
  } else {
    console.log('WARNING: Global directory not found!');
  }
});