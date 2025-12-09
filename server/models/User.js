import { getDatabase } from '../config/database.js';
import crypto from 'crypto';

/**
 * Convierte un callback a promesa
 */
function promisify(fn) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn(...args, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };
}

/**
 * Modelo para gestión de usuarios
 */
class UserModel {
    /**
     * Crea o obtiene un usuario por su alias
     * @param {string} alias - Alias del usuario
     * @returns {Promise<Object>} Usuario creado o existente
     */
    static createOrGet(alias) {
        const db = getDatabase();
        
        // Generar avatar URL basado en hash del alias
        const hash = crypto.createHash('md5').update(alias).digest('hex');
        const avatarURL = `https://robohash.org/${hash}.png`;
        
        return new Promise((resolve, reject) => {
            // Intentar obtener usuario existente
            db.get('SELECT * FROM usuarios WHERE alias = ?', [alias], (err, user) => {
                if (err) {
                    console.error('Error en createOrGet usuario:', err);
                    reject(err);
                    return;
                }
                
                if (!user) {
                    // Crear nuevo usuario
                    db.run(
                        'INSERT INTO usuarios (alias, avatar_url) VALUES (?, ?)',
                        [alias, avatarURL],
                        function(err) {
                            if (err) {
                                console.error('Error al crear usuario:', err);
                                reject(err);
                                return;
                            }
                            
                            // Obtener el usuario creado
                            db.get('SELECT * FROM usuarios WHERE id = ?', [this.lastID], (err, newUser) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(newUser);
                                }
                            });
                        }
                    );
                } else {
                    // Actualizar last_seen
                    db.run(
                        'UPDATE usuarios SET last_seen = datetime("now") WHERE id = ?',
                        [user.id],
                        (err) => {
                            if (err) {
                                console.error('Error al actualizar last_seen:', err);
                            }
                            resolve(user);
                        }
                    );
                }
            });
        });
    }
    
    /**
     * Obtiene un usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario o null si no existe
     */
    static getById(id) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [id], (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user || null);
                }
            });
        });
    }
    
    /**
     * Obtiene un usuario por alias
     * @param {string} alias - Alias del usuario
     * @returns {Promise<Object|null>} Usuario o null si no existe
     */
    static getByAlias(alias) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM usuarios WHERE alias = ?', [alias], (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user || null);
                }
            });
        });
    }
    
    /**
     * Actualiza el last_seen de un usuario
     * @param {number} id - ID del usuario
     * @returns {Promise<void>}
     */
    static updateLastSeen(id) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE usuarios SET last_seen = datetime("now") WHERE id = ?',
                [id],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
}

export default UserModel;
