import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

const TOKENS_DIR = path.join(__dirname, '../../../packages/tokens/build/web/global');

// Middleware
app.use(express.json());

// Utility function to get token files dynamically
const getTokenFilePath = (brand: string, format: string) => {
  const filePath = path.join(TOKENS_DIR, brand, format, `${brand}-color.${format}`);
  return fs.existsSync(filePath) ? filePath : null;
};

// API Endpoint: List available brands
app.get('/api/tokens/brands', (req, res) => {
  const brands = fs.readdirSync(TOKENS_DIR).filter(dir => fs.statSync(path.join(TOKENS_DIR, dir)).isDirectory());
  res.json({ brands });
});

// API Endpoint: Fetch tokens by brand & format
app.get('/api/tokens/:brand/:format', (req, res) => {
  const { brand, format } = req.params;
  const validFormats = ['css', 'js', 'json', 'scss'];

  if (!validFormats.includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Supported: css, js, json, scss' });
  }

  const filePath = getTokenFilePath(brand, format);
  if (!filePath) {
    return res.status(404).json({ error: 'Token file not found' });
  }

  res.sendFile(filePath);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Token API is running at http://localhost:${PORT}`);
});
