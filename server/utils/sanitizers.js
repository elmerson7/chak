import sanitizeHtml from 'sanitize-html';

/**
 * Utilidades de sanitización para prevenir XSS
 */

/**
 * Sanitiza un mensaje de texto HTML
 * @param {string} html - HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
export function sanitizeMessage(html) {
    return sanitizeHtml(html, {
        allowedTags: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
        allowedAttributes: {},
        allowedSchemes: []
    });
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitiza un alias de usuario
 * @param {string} alias - Alias a sanitizar
 * @returns {string} Alias sanitizado
 */
export function sanitizeAlias(alias) {
    if (!alias || typeof alias !== 'string') {
        return 'Anónimo';
    }
    
    return alias.trim().substring(0, 20);
}

