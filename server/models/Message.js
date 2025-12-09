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
     * @returns {Promise<Object>} Mensaje creado
     */
    static create(usuarioId, contenido, tipo = 'texto') {
        const db = getDatabase();
        
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO mensajes (usuario_id, contenido, tipo) VALUES (?, ?, ?)',
                [usuarioId, contenido, tipo],
                function(err) {
                    if (err) {
                        console.error('Error al crear mensaje:', err);
                        reject(err);
                        return;
                    }
                    
                    // Obtener el mensaje creado
                    db.get('SELECT * FROM mensajes WHERE id = ?', [this.lastID], (err, message) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(message);
                        }
                    });
                }
            );
        });
    }
    
    /**
     * Obtiene los últimos N mensajes
     * @param {number} limit - Número de mensajes a obtener (default: 50)
     * @returns {Promise<Array>} Array de mensajes con información del usuario
     */
    static getRecent(limit = 50) {
        const db = getDatabase();
        
        return new Promise((resolve, reject) => {
            db.all(`
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
            `, [limit], (err, messages) => {
                if (err) {
                    console.error('Error al obtener mensajes recientes:', err);
                    reject(err);
                    return;
                }
                
                // Invertir para mostrar del más antiguo al más reciente
                resolve(messages.reverse());
            });
        });
    }
    
    /**
     * Obtiene mensajes desde una fecha específica
     * @param {string} desdeFecha - Fecha desde la cual obtener mensajes (ISO string)
     * @returns {Promise<Array>} Array de mensajes
     */
    static getSince(desdeFecha) {
        const db = getDatabase();
        
        return new Promise((resolve, reject) => {
            db.all(`
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
            `, [desdeFecha], (err, messages) => {
                if (err) {
                    console.error('Error al obtener mensajes desde fecha:', err);
                    reject(err);
                } else {
                    resolve(messages);
                }
            });
        });
    }
    
    /**
     * Crea una sesión de conexión
     * @param {number} usuarioId - ID del usuario
     * @param {string} socketId - ID del socket
     * @returns {Promise<Object>} Sesión creada
     */
    static createSession(usuarioId, socketId) {
        const db = getDatabase();
        
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO sesiones (usuario_id, socket_id) VALUES (?, ?)',
                [usuarioId, socketId],
                function(err) {
                    if (err) {
                        console.error('Error al crear sesión:', err);
                        reject(err);
                        return;
                    }
                    
                    // Obtener la sesión creada
                    db.get('SELECT * FROM sesiones WHERE id = ?', [this.lastID], (err, session) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(session);
                        }
                    });
                }
            );
        });
    }
    
    /**
     * Cierra una sesión
     * @param {string} socketId - ID del socket
     * @returns {Promise<void>}
     */
    static closeSession(socketId) {
        const db = getDatabase();
        
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE sesiones SET disconnected_at = datetime("now") WHERE socket_id = ? AND disconnected_at IS NULL',
                [socketId],
                (err) => {
                    if (err) {
                        console.error('Error al cerrar sesión:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
}

export default MessageModel;
