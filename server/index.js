import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase, closeDatabase } from './config/database.js';
import { setupSocketHandlers } from './handlers/socketHandlers.js';
import { logInfo, logError } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Configurar CORS
app.use(cors());

// Configurar Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Servir archivos estáticos
app.use(express.static(join(__dirname, '../public')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../public/index.html'));
});

// Inicializar base de datos
try {
    initDatabase();
    logInfo('Base de datos inicializada');
} catch (error) {
    logError('Error al inicializar base de datos', error);
    process.exit(1);
}

// Configurar handlers de Socket.IO
setupSocketHandlers(io);

// Manejar cierre graceful
process.on('SIGTERM', () => {
    logInfo('SIGTERM recibido, cerrando servidor...');
    closeDatabase();
    server.close(() => {
        logInfo('Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logInfo('SIGINT recibido, cerrando servidor...');
    closeDatabase();
    server.close(() => {
        logInfo('Servidor cerrado');
        process.exit(0);
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logInfo(`Servidor corriendo en el puerto ${PORT}`);
});

