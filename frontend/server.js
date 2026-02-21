import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

// Serve static files from the dist directory (CSS, JS, images, etc.)
app.use(express.static(join(__dirname, 'dist'), {
  // Don't serve index.html for static file requests
  index: false,
  // Set proper cache headers for static assets
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Handle all routes - serve index.html for SPA routing
// This must be the last route to catch all non-static requests
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'dist', 'index.html');
  
  // Check if index.html exists
  if (!existsSync(indexPath)) {
    return res.status(500).send('Application not built. Please run "npm run build" first.');
  }
  
  try {
    const html = readFileSync(indexPath, 'utf-8');
    // Set proper headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Error loading application');
  }
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Serving SPA from: ${join(__dirname, 'dist')}`);
});

