import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, isProd } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

export function buildApp(): express.Express {
    const app = express();

    app.use(helmet());
    app.use(cors({
        origin: config.frontendUrl.split(',').map((s) => s.trim()),
        credentials: false,
    }));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.get('/', (_req: Request, res: Response) => {
        res.json({
            success: true,
            data: {
                name: 'Skin Care Management System API',
                version: '1.0.0',
                env: config.nodeEnv,
            },
        });
    });

    app.use('/api', routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    // Mark prod for downstream tools
    void isProd;

    return app;
}