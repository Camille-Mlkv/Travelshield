import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'dotenv/config'
import router from './src/routes/index.js'
import { errorHandler } from './src/middleware/error.middleware.js'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'

const swaggerFile = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'swagger-output.json'), 'utf8')
);

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
app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 TravelShield API запущен на порту ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api/doc`);
});


export default app;