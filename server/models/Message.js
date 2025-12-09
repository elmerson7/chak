import { getDatabase } from '../config/database.js';

/**
 * Modelo para gestión de mensajes
 */
class MessageModel {
    /**
     * Crea un nuevo mensaje
     * @param {number} usuarioId - ID del usuario que envía el mensaje
     * @param {string} contenido - Contenido del mensaje
     * @param {string} tipo - Tipo de mensaje ('texto' o 'imagen')
     * @returns {Object} Mensaje creado
     */
    static create(usuarioId, contenido, tipo = 'texto') {
        const db = getDatabase();
        
        try {
            const result = db.prepare(
                'INSERT INTO mensajes (usuario_id, contenido, tipo) VALUES (?, ?, ?)'
            ).run(usuarioId, contenido, tipo);
            
            return db.prepare('SELECT * FROM mensajes WHERE id = ?').get(result.lastInsertRowid);
        } catch (error) {
            console.error('Error al crear mensaje:', error);
            throw error;
        }
    }
    
    /**
     * Obtiene los últimos N mensajes
     * @param {number} limit - Número de mensajes a obtener (default: 50)
     * @returns {Array} Array de mensajes con información del usuario
     */
    static getRecent(limit = 50) {
        const db = getDatabase();
        
        try {
            const messages = db.prepare(`
                SELECT 
                    m.id,
                    m.contenido,
                    m.tipo,
                    m.created_at,
                    u.id as usuario_id,
                    u.alias,
                    u.avatar_url
                FROM mensajes m
                INNER JOIN usuarios u ON m.usuario_id = u.id
                ORDER BY m.created_at DESC
                LIMIT ?
            `).all(limit);
            
            // Invertir para mostrar del más antiguo al más reciente
            return messages.reverse();
        } catch (error) {
            console.error('Error al obtener mensajes recientes:', error);
            throw error;
        }
    }
    
    /**
     * Obtiene mensajes desde una fecha específica
     * @param {string} desdeFecha - Fecha desde la cual obtener mensajes (ISO string)
     * @returns {Array} Array de mensajes
     */
    static getSince(desdeFecha) {
        const db = getDatabase();
        
        try {
            const messages = db.prepare(`
                SELECT 
                    m.id,
                    m.contenido,
                    m.tipo,
                    m.created_at,
                    u.id as usuario_id,
                    u.alias,
                    u.avatar_url
                FROM mensajes m
                INNER JOIN usuarios u ON m.usuario_id = u.id
                WHERE m.created_at >= ?
                ORDER BY m.created_at ASC
            `).all(desdeFecha);
            
            return messages;
        } catch (error) {
            console.error('Error al obtener mensajes desde fecha:', error);
            throw error;
        }
    }
    
    /**
     * Crea una sesión de conexión
     * @param {number} usuarioId - ID del usuario
     * @param {string} socketId - ID del socket
     * @returns {Object} Sesión creada
     */
    static createSession(usuarioId, socketId) {
        const db = getDatabase();
        
        try {
            const result = db.prepare(
                'INSERT INTO sesiones (usuario_id, socket_id) VALUES (?, ?)'
            ).run(usuarioId, socketId);
            
            return db.prepare('SELECT * FROM sesiones WHERE id = ?').get(result.lastInsertRowid);
        } catch (error) {
            console.error('Error al crear sesión:', error);
            throw error;
        }
    }
    
    /**
     * Cierra una sesión
     * @param {string} socketId - ID del socket
     */
    static closeSession(socketId) {
        const db = getDatabase();
        
        try {
            db.prepare(
                'UPDATE sesiones SET disconnected_at = CURRENT_TIMESTAMP WHERE socket_id = ? AND disconnected_at IS NULL'
            ).run(socketId);
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw error;
        }
    }
}

export default MessageModel;

