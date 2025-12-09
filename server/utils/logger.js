/**
 * Utilidades de logging estructurado
 */

/**
 * Formatea un mensaje de log con timestamp
 * @param {string} level - Nivel de log (info, error, warn, debug)
 * @param {string} message - Mensaje a loguear
 * @param {Object} data - Datos adicionales opcionales
 * @returns {string} Mensaje formateado
 */
function formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...data
    };
    
    return JSON.stringify(logEntry);
}

/**
 * Log de información
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export function logInfo(message, data = {}) {
    console.log(formatLog('info', message, data));
}

/**
 * Log de error
 * @param {string} message - Mensaje
 * @param {Error|Object} error - Error o datos adicionales
 */
export function logError(message, error = {}) {
    const errorData = error instanceof Error 
        ? { error: error.message, stack: error.stack }
        : error;
    
    console.error(formatLog('error', message, errorData));
}

/**
 * Log de advertencia
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export function logWarn(message, data = {}) {
    console.warn(formatLog('warn', message, data));
}

/**
 * Log de debug
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export function logDebug(message, data = {}) {
    console.debug(formatLog('debug', message, data));
}

