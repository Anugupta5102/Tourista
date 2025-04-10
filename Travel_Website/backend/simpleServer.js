const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_PORT = process.env.PORT || 5000;

function getAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.on('error', () => {
      server.close(() => resolve(getAvailablePort(startPort + 1)));
    });
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
  });
}

// Basic request handler
const createServer = (port) => {
  const server = http.createServer((req, res) => {
  // Set basic headers
  res.setHeader('Content-Type', 'application/json');
  
  // Simple route handling
  if (req.url === '/api/test' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'Server is working' }));
    return;
  }

  // 404 for other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// DB connection
console.log("Attempting to connect to MongoDB...");
mongoose.connect(process.env.DATABASE_URL)
.then(() => {
    console.log("MongoDB connected successfully");
    server.listen(PORT, () => console.log(`Simple server running on port ${PORT}`));
})
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
