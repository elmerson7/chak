import UserModel from '../models/User.js';
import MessageModel from '../models/Message.js';
import { validateAlias, validateMessage, validateImage, validateRateLimit } from '../utils/validators.js';
import { sanitizeAlias, sanitizeMessage, escapeHtml } from '../utils/sanitizers.js';
import { logInfo, logError } from '../utils/logger.js';
import { handleSocketError } from '../middleware/errorHandler.js';

// Rate limiting: Map<userId, { messages: [timestamps] }>
const userMessageCounts = new Map();

/**
 * Formatea la hora actual en formato 12 horas
 * @returns {string} Hora formateada
 */
function obtenerHoraActual() {
    const fechaActual = new Date();
    let hora = fechaActual.getHours();
    const minuto = fechaActual.getMinutes();
    const segundo = fechaActual.getSeconds();
    
    const periodo = (hora < 12) ? 'a.m.' : 'p.m.';
    hora = (hora > 12) ? hora - 12 : hora;
    hora = (hora === 0) ? 12 : hora;
    
    const horaStr = (hora < 10) ? `0${hora}` : hora.toString();
    const minutoStr = (minuto < 10) ? `0${minuto}` : minuto.toString();
    const segundoStr = (segundo < 10) ? `0${segundo}` : segundo.toString();
    
    return `${horaStr}:${minutoStr}:${segundoStr} ${periodo}`;
}

/**
 * Formatea un mensaje para enviar al cliente
 * @param {Object} messageData - Datos del mensaje desde la BD
 * @returns {Object} Mensaje formateado
 */
function formatMessageForClient(messageData) {
    // Solo retornar los datos, Vue se encargará del formato
    // Esto evita duplicar el alias que ya se muestra en el frontend
    return {
        emisor: messageData.alias,
        tipo: messageData.tipo,
        contenido: messageData.contenido,
        avatar_url: messageData.avatar_url,
        created_at: messageData.created_at
    };
}

/**
 * Configura los handlers de Socket.IO
 * @param {Object} io - Instancia de Socket.IO
 */
export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        logInfo('Nuevo cliente conectado', { socketId: socket.id });
        
        let currentUser = null;
        let currentUserId = null;
        
        // Enviar mensajes previos al cliente recién conectado
        MessageModel.getRecent(50)
            .then((mensajesPrevios) => {
                const mensajesFormateados = mensajesPrevios.map(formatMessageForClient);
                socket.emit('mensajesPrevios', mensajesFormateados);
            })
            .catch((error) => {
                logError('Error al cargar mensajes previos', error);
            });
        
        // Handler para establecer alias
        socket.on('setAlias', async (newAlias) => {
            try {
                // Validar alias
                const validation = validateAlias(newAlias);
                if (!validation.valid) {
                    socket.emit('error', { message: validation.error });
                    return;
                }
                
                // Sanitizar alias
                const aliasSanitizado = sanitizeAlias(newAlias);
                
                // Crear o obtener usuario
                currentUser = await UserModel.createOrGet(aliasSanitizado);
                currentUserId = currentUser.id;
                
                // Crear sesión
                await MessageModel.createSession(currentUserId, socket.id);
                
                // Inicializar rate limiting para este usuario
                userMessageCounts.set(currentUserId, { messages: [] });
                
                logInfo('Usuario conectado', {
                    alias: currentUser.alias,
                    userId: currentUserId,
                    socketId: socket.id
                });
                
                socket.emit('aliasEstablecido', {
                    alias: currentUser.alias,
                    avatar_url: currentUser.avatar_url
                });
            } catch (error) {
                handleSocketError(error, socket, 'setAlias');
            }
        });
        
        // Handler para mensajes de texto
        socket.on('mensaje', async (mensaje) => {
            try {
                if (!currentUser || !currentUserId) {
                    socket.emit('error', { message: 'Debes establecer un alias primero' });
                    return;
                }
                
                // Validar mensaje
                const validation = validateMessage(mensaje);
                if (!validation.valid) {
                    socket.emit('error', { message: validation.error });
                    return;
                }
                
                // Validar rate limiting
                const rateLimitValidation = validateRateLimit(
                    userMessageCounts,
                    currentUserId,
                    10,
                    60
                );
                if (!rateLimitValidation.valid) {
                    socket.emit('error', { message: rateLimitValidation.error });
                    return;
                }
                
                // Sanitizar mensaje
                const mensajeSanitizado = sanitizeMessage(mensaje.trim());
                
                // Guardar en base de datos
                const messageData = await MessageModel.create(
                    currentUserId,
                    mensajeSanitizado,
                    'texto'
                );
                
                // Obtener datos completos del mensaje con usuario
                const fullMessage = {
                    id: messageData.id,
                    contenido: messageData.contenido,
                    tipo: messageData.tipo,
                    created_at: messageData.created_at,
                    usuario_id: currentUserId,
                    alias: currentUser.alias,
                    avatar_url: currentUser.avatar_url
                };
                
                // Formatear y emitir a todos los clientes
                const mensajeFormateado = formatMessageForClient(fullMessage);
                io.emit('mensaje', mensajeFormateado);
                
                logInfo('Mensaje enviado', {
                    alias: currentUser.alias,
                    mensajeId: messageData.id
                });
            } catch (error) {
                handleSocketError(error, socket, 'mensaje');
            }
        });
        
        // Handler para imágenes
        socket.on('imagen', async (imagenData) => {
            try {
                if (!currentUser || !currentUserId) {
                    socket.emit('error', { message: 'Debes establecer un alias primero' });
                    return;
                }
                
                // Validar imagen
                const validation = validateImage(imagenData, 5);
                if (!validation.valid) {
                    socket.emit('error', { message: validation.error });
                    return;
                }
                
                // Validar rate limiting
                const rateLimitValidation = validateRateLimit(
                    userMessageCounts,
                    currentUserId,
                    10,
                    60
                );
                if (!rateLimitValidation.valid) {
                    socket.emit('error', { message: rateLimitValidation.error });
                    return;
                }
                
                // Guardar en base de datos
                const messageData = await MessageModel.create(
                    currentUserId,
                    imagenData,
                    'imagen'
                );
                
                // Obtener datos completos del mensaje con usuario
                const fullMessage = {
                    id: messageData.id,
                    contenido: messageData.contenido,
                    tipo: messageData.tipo,
                    created_at: messageData.created_at,
                    usuario_id: currentUserId,
                    alias: currentUser.alias,
                    avatar_url: currentUser.avatar_url
                };
                
                // Formatear y emitir a todos los clientes
                const mensajeFormateado = formatMessageForClient(fullMessage);
                io.emit('imagen', mensajeFormateado);
                
                logInfo('Imagen enviada', {
                    alias: currentUser.alias,
                    mensajeId: messageData.id
                });
            } catch (error) {
                handleSocketError(error, socket, 'imagen');
            }
        });
        
        // Handler para indicador de escritura
        socket.on('escribiendo', () => {
            if (currentUser) {
                socket.broadcast.emit('usuarioEscribiendo', {
                    alias: currentUser.alias
                });
            }
        });
        
        socket.on('dejoDeEscribir', () => {
            if (currentUser) {
                socket.broadcast.emit('usuarioDejoDeEscribir', {
                    alias: currentUser.alias
                });
            }
        });
        
        // Handler para desconexión
        socket.on('disconnect', async () => {
            try {
                if (currentUserId) {
                    await Promise.all([
                        MessageModel.closeSession(socket.id),
                        UserModel.updateLastSeen(currentUserId)
                    ]);
                    userMessageCounts.delete(currentUserId);
                    
                    logInfo('Usuario desconectado', {
                        alias: currentUser?.alias,
                        userId: currentUserId,
                        socketId: socket.id
                    });
                }
            } catch (error) {
                logError('Error al manejar desconexión', error);
            }
        });
    });
}
