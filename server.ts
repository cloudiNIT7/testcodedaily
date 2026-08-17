import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Auth setup
const ADMIN_USERNAME = 'abinashkumar19';
// Hash of Abinash@2004@1904
const ADMIN_PASSWORD_HASH = '4e85aa59f5e85a1f8b1e83d629dfe8c334e4b4082d14d0a459334e6b7c9cd12b';
const currentToken = crypto.createHash('sha256').update(ADMIN_PASSWORD_HASH + 'session-secret').digest('hex');

// Simple file-based persistence for test codes
const DATA_FILE = path.join(process.cwd(), 'data.json');

const defaultData = {
  "7:30 am": { code: "Pending", updatedAt: 0 },
  "9:00 am": { code: "Pending", updatedAt: 0 },
  "10:30 am": { code: "Pending", updatedAt: 0 },
  "7:30 pm": { code: "Pending", updatedAt: 0 }
};

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      for (const key of Object.keys(parsed)) {
        if (typeof parsed[key] === 'string') {
          parsed[key] = { code: parsed[key], updatedAt: 0 };
        }
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error reading data:', error);
  }
  return { ...defaultData };
}

function writeData(data: Record<string, any>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
}

// API Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (username === ADMIN_USERNAME && hash === ADMIN_PASSWORD_HASH) {
    res.json({ token: currentToken });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/test-codes', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/test-codes', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${currentToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const newCodes = req.body;
  if (typeof newCodes !== 'object' || newCodes === null) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  const currentData = readData();
  const now = Date.now();
  
  for (const [batch, code] of Object.entries(newCodes)) {
    if (typeof code === 'string') {
      currentData[batch] = { code, updatedAt: now };
    }
  }

  writeData(currentData);
  res.json({ success: true, data: currentData });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
