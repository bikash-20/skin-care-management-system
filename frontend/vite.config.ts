import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-setup.ts'],
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                // Backend runs on 5050 by default (port 5000 is held by
                // macOS Control Center). Override with VITE_API_TARGET if
                // you run the backend on a different port.
                target: process.env.VITE_API_TARGET ?? 'http://localhost:5050',
                changeOrigin: true,
            },
        },
    },
});