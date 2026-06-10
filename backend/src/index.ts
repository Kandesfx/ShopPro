import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { config } from './config';
import { initializeDatabase, seedDatabase, waitForDb } from './db';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';

dotenv.config();

class App {
  public app: Application;
  public server: any;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { success: false, message: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes);

    this.app.get('/api/health', (req, res) => {
      res.json({ success: true, message: 'ShopPro API is running', timestamp: new Date().toISOString() });
    });

    this.app.get('/api/docs', (req, res) => {
      res.json({
        success: true,
        message: 'ShopPro API v1.0.0',
        version: '1.0.0',
        endpoints: {
          auth: 'POST /api/auth/login, POST /api/auth/register, GET /api/auth/profile',
          products: 'GET /api/products, GET /api/products/:id, GET /api/products/featured',
          categories: 'GET /api/categories, GET /api/categories/:id',
          orders: 'GET /api/orders, POST /api/orders, PUT /api/orders/:id/status',
          inventory: 'GET /api/inventory, GET /api/inventory/low-stock',
          customers: 'GET /api/customers, GET /api/customers/:id',
          promotions: 'GET /api/promotions/active, POST /api/promotions/validate',
          reports: 'GET /api/reports/dashboard, GET /api/reports/sales',
          suppliers: 'GET /api/suppliers',
        },
      });
    });

    this.app.use((req, res) => {
      res.status(404).json({ success: false, message: 'Endpoint not found', path: req.path });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    try {
      console.log('Initializing database...');
      await waitForDb();
      console.log('Database initialized successfully');
      await seedDatabase();

      this.initializeRoutes();
      this.initializeErrorHandling();

      this.server = this.app.listen(config.port, () => {
        console.log(`\n╔══════════════════════════════════════════════════════╗`);
        console.log(`║  ShopPro API Server — running on port ${config.port}        ║`);
        console.log(`║  Environment: ${config.nodeEnv.padEnd(38)}║`);
        console.log(`║  Database: SQLite (sql.js WASM)                      ║`);
        console.log(`║                                                       ║`);
        console.log(`║  Endpoints:                                          ║`);
        console.log(`║  • Health: http://localhost:${config.port}/api/health      ║`);
        console.log(`║  • API:    http://localhost:${config.port}/api              ║`);
        console.log(`║  • Docs:   http://localhost:${config.port}/api/docs        ║`);
        console.log(`║                                                       ║`);
        console.log(`║  Credentials:                                        ║`);
        console.log(`║  • Admin:     admin / admin123                       ║`);
        console.log(`║  • Manager:   manager / staff123                     ║`);
        console.log(`║  • Staff:     staff / staff123                       ║`);
        console.log(`╚══════════════════════════════════════════════════════╝\n`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const app = new App();
app.start();
