const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PORT_START = 5100; // Starting from a higher port to avoid conflicts

// Function to find available port
const getAvailablePort = (startPort) => new Promise((resolve) => {
  const server = http.createServer();
  server.listen(startPort, () => {
    server.close(() => resolve(startPort));
  });
  server.on('error', () => resolve(getAvailablePort(startPort + 1)));
});

// Create HTTP server
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Test endpoint
  if (req.url === '/api/test' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({ 
      status: 'Server is running',
      port: server.address().port 
    }));
  }

  // Not found handler
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Route not found' }));
});

// Start server
async function start() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected');
    
    const port = await getAvailablePort(PORT_START);
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Test endpoint: http://localhost:${port}/api/test`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      server.close(() => {
        mongoose.disconnect();
        console.log('Server stopped');
        process.exit(0);
      });
    });

  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
