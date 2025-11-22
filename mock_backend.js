// Simple Express mock to simulate the ESP8266 backend
// Run: node mock_backend.js

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

// In-memory servo angles (1..4)
const A = [0,0,0,0,0]; // index 0 unused, 1..4 used

app.get('/status', (req, res) => {
  res.json({ a1: A[1], a2: A[2], a3: A[3], a4: A[4], ip: '127.0.0.1', mode: 'local' });
});

app.get('/setServo', (req, res) => {
  const s = parseInt(req.query.servo);
  const ang = parseInt(req.query.angle);
  if (!s || !ang) return res.status(400).send('servo and angle required');
  if (s < 1 || s > 4) return res.status(400).send('servo out of range');
  A[s] = Math.max(0, Math.min(180, ang));
  console.log(`setServo -> servo=${s} angle=${A[s]}`);
  res.send('OK');
});

app.get('/', (req, res) => {
  res.send('Mock ESP8266 Backend running (express)');
});

app.listen(port, () => {
  console.log(`Mock backend listening at http://localhost:${port}`);
});
