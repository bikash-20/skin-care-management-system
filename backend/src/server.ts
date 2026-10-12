import { buildApp } from './app';
import { config } from './config';
import { initDb, closePool } from './db/pool';

async function main(): Promise<void> {
    await initDb();
    // eslint-disable-next-line no-console
    console.log(`Database driver initialized.`);

    const app = buildApp();
    const server = app.listen(config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`SCMS API listening on port ${config.port} (${config.nodeEnv})`);
    });

    async function shutdown(signal: string): Promise<void> {
        // eslint-disable-next-line no-console
        console.log(`Received ${signal}. Closing server...`);
        server.close(() => {
            void closePool().then(() => process.exit(0));
        });
        setTimeout(() => process.exit(1), 10000).unref();
    }

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
});