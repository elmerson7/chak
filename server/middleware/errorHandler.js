import { logError } from '../utils/logger.js';

/**
 * Middleware de manejo de errores centralizado
 * @param {Error} error - Error capturado
 * @param {Object} socket - Socket de Socket.IO
 * @param {string} eventName - Nombre del evento que causó el error
 */
export function handleSocketError(error, socket, eventName = 'unknown') {
    logError(`Error en evento Socket.IO: ${eventName}`, error);
    
    // Enviar mensaje de error amigable al cliente
    socket.emit('error', {
        message: 'Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        code: 'SERVER_ERROR'
    });
}

/**
 * Wrapper para manejar errores en handlers de Socket.IO
 * @param {Function} handler - Función handler
 * @param {string} eventName - Nombre del evento
 * @returns {Function} Handler envuelto con manejo de errores
 */
export function withErrorHandling(handler, eventName) {
    return async (socket, ...args) => {
        try {
            await handler(socket, ...args);
        } catch (error) {
            handleSocketError(error, socket, eventName);
        }
    };
}

