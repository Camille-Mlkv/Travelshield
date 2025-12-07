import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'dotenv/config'
import router from './src/routes/index.js'
import { errorHandler } from './src/middleware/error.middleware.js'

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов 
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api', router);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 TravelShield API запущен на порту ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Health check: http://localhost:${PORT}/api/health`);
});

// Обработка graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM signal received: closing HTTP server');
//   process.exit(0);
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT signal received: closing HTTP server');
//   process.exit(0);
// });

export default app;