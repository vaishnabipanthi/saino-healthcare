const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

process.on('exit', (code) => {
  console.log('💀 Process exiting with code:', code);
});

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Sahi Frontend Path Auto-Detect (saino-health folder ko point karega)
const projectRoot = path.resolve(__dirname, '..', '..');
let webRoot = path.join(projectRoot, 'saino-health');
if (!fs.existsSync(webRoot)) {
  webRoot = path.join(__dirname, '..', 'saino-health');
}
if (!fs.existsSync(webRoot)) {
  webRoot = projectRoot;
}

console.log('Serving frontend from:', webRoot);

// 2. Static Files (CSS, JS, Images)
app.use(express.static(webRoot));

// 3. Frontend Pages Routes (Fixes all 404s)
app.get('/', (req, res) => {
  const file = path.join(webRoot, 'index.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.status(404).send('index.html not found in ' + webRoot);
});

app.get('/admin', (req, res) => {
  const file = path.join(webRoot, 'admin', 'index.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.status(404).send('Admin index.html not found in ' + webRoot);
});

app.get('/provider', (req, res) => {
  const loginFile = path.join(webRoot, 'provider', 'login.html');
  const indexFile = path.join(webRoot, 'provider', 'index.html');
  if (fs.existsSync(loginFile)) return res.sendFile(loginFile);
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(404).send('Provider files not found in ' + webRoot);
});

// 4. API Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/public', require('./routes/public'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'SAINO Health Backend is running!' }));

// 5. Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'Internal server error.' });
});

// 6. Start Server
app.listen(PORT, () => {
 
 console.log(`SAINO Health Backend running on: http://localhost:${PORT}`);
  console.log(`Patient Marketplace: http://localhost:${PORT}/`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`Provider Panel: http://localhost:${PORT}/provider`);
});