import { getDatabase } from '../config/database.js';
import crypto from 'crypto';

/**
 * Modelo para gestión de usuarios
 */
class UserModel {
    /**
     * Crea o obtiene un usuario por su alias
     * @param {string} alias - Alias del usuario
     * @returns {Object} Usuario creado o existente
     */
    static createOrGet(alias) {
        const db = getDatabase();
        
        // Generar avatar URL basado en hash del alias
        const hash = crypto.createHash('md5').update(alias).digest('hex');
        const avatarURL = `https://robohash.org/${hash}.png`;
        
        try {
            // Intentar obtener usuario existente
            let user = db.prepare('SELECT * FROM usuarios WHERE alias = ?').get(alias);
            
            if (!user) {
                // Crear nuevo usuario
                const result = db.prepare(
                    'INSERT INTO usuarios (alias, avatar_url) VALUES (?, ?)'
                ).run(alias, avatarURL);
                
                user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
            } else {
                // Actualizar last_seen
                db.prepare('UPDATE usuarios SET last_seen = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(user.id);
            }
            
            return user;
        } catch (error) {
            console.error('Error en createOrGet usuario:', error);
            throw error;
        }
    }
    
    /**
     * Obtiene un usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Object|null} Usuario o null si no existe
     */
    static getById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    }
    
    /**
     * Obtiene un usuario por alias
     * @param {string} alias - Alias del usuario
     * @returns {Object|null} Usuario o null si no existe
     */
    static getByAlias(alias) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM usuarios WHERE alias = ?').get(alias);
    }
    
    /**
     * Actualiza el last_seen de un usuario
     * @param {number} id - ID del usuario
     */
    static updateLastSeen(id) {
        const db = getDatabase();
        db.prepare('UPDATE usuarios SET last_seen = CURRENT_TIMESTAMP WHERE id = ?')
            .run(id);
    }
}

export default UserModel;

