/**
 * Utilidades de validación
 */

/**
 * Valida un alias de usuario
 * @param {string} alias - Alias a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateAlias(alias) {
    if (!alias || typeof alias !== 'string') {
        return { valid: false, error: 'El alias es requerido' };
    }
    
    const trimmedAlias = alias.trim();
    
    if (trimmedAlias.length < 2) {
        return { valid: false, error: 'El alias debe tener al menos 2 caracteres' };
    }
    
    if (trimmedAlias.length > 20) {
        return { valid: false, error: 'El alias no puede tener más de 20 caracteres' };
    }
    
    // Solo letras, números y guiones bajos
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedAlias)) {
        return { valid: false, error: 'El alias solo puede contener letras, números y guiones bajos' };
    }
    
    return { valid: true };
}

/**
 * Valida un mensaje de texto
 * @param {string} mensaje - Mensaje a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateMessage(mensaje) {
    if (!mensaje || typeof mensaje !== 'string') {
        return { valid: false, error: 'El mensaje es requerido' };
    }
    
    const trimmedMensaje = mensaje.trim();
    
    if (trimmedMensaje.length === 0) {
        return { valid: false, error: 'El mensaje no puede estar vacío' };
    }
    
    if (trimmedMensaje.length > 1000) {
        return { valid: false, error: 'El mensaje no puede tener más de 1000 caracteres' };
    }
    
    return { valid: true };
}

/**
 * Valida una imagen en formato base64
 * @param {string} imagenData - Datos de la imagen en base64
 * @param {number} maxSizeMB - Tamaño máximo en MB (default: 5)
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateImage(imagenData, maxSizeMB = 5) {
    if (!imagenData || typeof imagenData !== 'string') {
        return { valid: false, error: 'Los datos de la imagen son requeridos' };
    }
    
    if (!imagenData.startsWith('data:image')) {
        return { valid: false, error: 'El formato de imagen no es válido' };
    }
    
    // Calcular tamaño aproximado (base64 es ~33% más grande que el binario)
    const sizeInMB = (imagenData.length * 3 / 4) / (1024 * 1024);
    
    if (sizeInMB > maxSizeMB) {
        return { valid: false, error: `La imagen es demasiado grande (máximo ${maxSizeMB}MB)` };
    }
    
    // Validar formato de imagen permitido
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const formatMatch = imagenData.match(/data:image\/([^;]+)/);
    
    if (!formatMatch || !allowedFormats.includes(`image/${formatMatch[1]}`)) {
        return { valid: false, error: 'Formato de imagen no permitido. Use JPEG, PNG, GIF o WebP' };
    }
    
    return { valid: true };
}

/**
 * Valida rate limiting básico
 * @param {Map} userMessageCounts - Map con conteos de mensajes por usuario
 * @param {string} userId - ID del usuario
 * @param {number} maxMessages - Máximo de mensajes permitidos
 * @param {number} timeWindow - Ventana de tiempo en segundos
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateRateLimit(userMessageCounts, userId, maxMessages = 10, timeWindow = 60) {
    const now = Date.now();
    const userData = userMessageCounts.get(userId);
    
    if (!userData) {
        return { valid: true };
    }
    
    // Limpiar mensajes fuera de la ventana de tiempo
    const validMessages = userData.messages.filter(
        timestamp => now - timestamp < timeWindow * 1000
    );
    
    if (validMessages.length >= maxMessages) {
        return { 
            valid: false, 
            error: `Has enviado demasiados mensajes. Espera ${timeWindow} segundos.` 
        };
    }
    
    // Actualizar el conteo
    userData.messages = validMessages;
    userData.messages.push(now);
    
    return { valid: true };
}

