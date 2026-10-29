import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socket.service.js';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Express app
    const app = createApp();
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    initSocket(io);

    // 4. Start HTTP Server
    server.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 RideFlow Server running on port ${ENV.PORT}`);
      console.log(`🌐 Environment: ${ENV.NODE_ENV}`);
      console.log(`📖 Swagger API Docs: http://localhost:${ENV.PORT}/api/docs`);
      console.log(`🚗 Map Service: ${ENV.MAP_PROVIDER}`);
      console.log(`💳 Payment Mode: ${ENV.PAYMENT_MODE}`);
      console.log(`===============================================`);
    });

    // Graceful Shutdown
    const handleShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Closing HTTP server and DB connections...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    console.error('Fatal Server Error:', err);
    process.exit(1);
  }
};

startServer();
