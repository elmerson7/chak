import Database from 'better-sqlite3';
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
 * @returns {Database} Instancia de la base de datos
 */
export function initDatabase() {
    try {
        db = new Database(DB_PATH);
        
        // Habilitar foreign keys
        db.pragma('foreign_keys = ON');
        
        // Ejecutar script de inicialización
        const initSQL = readFileSync(INIT_SQL_PATH, 'utf8');
        db.exec(initSQL);
        
        console.log('Base de datos SQLite inicializada correctamente');
        
        return db;
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}

/**
 * Obtiene la instancia de la base de datos
 * @returns {Database} Instancia de la base de datos
 */
export function getDatabase() {
    if (!db) {
        return initDatabase();
    }
    return db;
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('Conexión a la base de datos cerrada');
    }
}

