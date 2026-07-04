import app from './app';
import prisma from './config/db';

const PORT = process.env.PORT || '3000';

async function startServer() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully.');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    // Graceful shutdown: clean up Prisma connection on process termination
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to connect to database or start server:', error);
    process.exit(1);
  }
}

startServer();
