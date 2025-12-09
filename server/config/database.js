import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../database/chak.db');
const INIT_SQL_PATH = join(__dirname, '../../database/init.sql');

let db = null;

/**
 * Inicializa la conexión a la base de datos SQLite
 * @returns {Promise<sqlite3.Database>} Instancia de la base de datos
 */
export function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error al conectar con la base de datos:', err);
                reject(err);
                return;
            }
            
            // Habilitar foreign keys
            db.run('PRAGMA foreign_keys = ON');
            
            // Ejecutar script de inicialización
            try {
                const initSQL = readFileSync(INIT_SQL_PATH, 'utf8');
                db.exec(initSQL, (err) => {
                    if (err) {
                        console.error('Error al ejecutar script de inicialización:', err);
                        reject(err);
                        return;
                    }
                    console.log('Base de datos SQLite inicializada correctamente');
                    resolve(db);
                });
            } catch (error) {
                console.error('Error al leer script de inicialización:', error);
                reject(error);
            }
        });
    });
}

/**
 * Obtiene la instancia de la base de datos
 * @returns {sqlite3.Database} Instancia de la base de datos
 */
export function getDatabase() {
    if (!db) {
        throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
    }
    return db;
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
    return new Promise((resolve) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error al cerrar la base de datos:', err);
                } else {
                    console.log('Conexión a la base de datos cerrada');
                }
                db = null;
                resolve();
            });
        } else {
            resolve();
        }
    });
}

