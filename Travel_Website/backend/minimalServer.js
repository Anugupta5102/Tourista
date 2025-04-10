const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5001; // Using different port

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/api/test' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'Minimal server is working' }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Connect to MongoDB and start server
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Minimal server running on port ${PORT}`);
      console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  server.close(() => {
    mongoose.disconnect();
    process.exit(0);
  });
});
