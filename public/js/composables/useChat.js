/**
 * Composable para lógica del chat
 */
function useChat(socketComposable) {
    const messages = [];
    let currentUser = null;
    let typingUsers = new Set();
    
    /**
     * Establece el alias del usuario
     * @param {string} alias - Alias del usuario
     */
    function setAlias(alias) {
        socketComposable.emit('setAlias', alias);
        
        socketComposable.on('aliasEstablecido', (data) => {
            currentUser = {
                alias: data.alias,
                avatar_url: data.avatar_url
            };
            
            // Guardar en localStorage
            localStorage.setItem('chak_alias', data.alias);
            localStorage.setItem('chak_avatar', data.avatar_url);
        });
    }
    
    /**
     * Carga el alias desde localStorage
     * @returns {string|null} Alias guardado o null
     */
    function loadAliasFromStorage() {
        const savedAlias = localStorage.getItem('chak_alias');
        const savedAvatar = localStorage.getItem('chak_avatar');
        
        if (savedAlias && savedAvatar) {
            currentUser = {
                alias: savedAlias,
                avatar_url: savedAvatar
            };
            return savedAlias;
        }
        
        return null;
    }
    
    /**
     * Envía un mensaje de texto
     * @param {string} texto - Texto del mensaje
     */
    function sendMessage(texto) {
        if (!texto || !texto.trim()) {
            return;
        }
        
        socketComposable.emit('mensaje', texto.trim());
    }
    
    /**
     * Envía una imagen
     * @param {string} imagenData - Datos de la imagen en base64
     */
    function sendImage(imagenData) {
        socketComposable.emit('imagen', imagenData);
    }
    
    /**
     * Configura los listeners de mensajes
     */
    function setupMessageListeners() {
        // Mensajes previos al conectar
        socketComposable.on('mensajesPrevios', (mensajesPrevios) => {
            messages.length = 0;
            mensajesPrevios.forEach(msg => {
                messages.push(msg);
            });
        });
        
        // Nuevo mensaje de texto
        socketComposable.on('mensaje', (data) => {
            messages.push(data);
        });
        
        // Nueva imagen
        socketComposable.on('imagen', (data) => {
            messages.push(data);
        });
        
        // Usuario escribiendo
        socketComposable.on('usuarioEscribiendo', (data) => {
            if (data.alias !== currentUser?.alias) {
                typingUsers.add(data.alias);
            }
        });
        
        // Usuario dejó de escribir
        socketComposable.on('usuarioDejoDeEscribir', (data) => {
            typingUsers.delete(data.alias);
        });
        
        // Errores
        socketComposable.on('error', (error) => {
            console.error('Error del servidor:', error);
            // Aquí podrías mostrar una notificación al usuario
        });
    }
    
    /**
     * Indica que el usuario está escribiendo
     */
    function startTyping() {
        socketComposable.emit('escribiendo');
    }
    
    /**
     * Indica que el usuario dejó de escribir
     */
    function stopTyping() {
        socketComposable.emit('dejoDeEscribir');
    }
    
    /**
     * Verifica si un mensaje es una imagen
     * @param {string|Object} mensaje - Mensaje a verificar
     * @returns {boolean} True si es imagen
     */
    function isImage(mensaje) {
        const contenido = typeof mensaje === 'string' ? mensaje : mensaje?.contenido || mensaje?.mensaje || '';
        return contenido.startsWith('data:image');
    }
    
    /**
     * Obtiene los usuarios que están escribiendo
     * @returns {Array} Array de aliases
     */
    function getTypingUsers() {
        return Array.from(typingUsers);
    }
    
    return {
        messages,
        currentUser,
        setAlias,
        loadAliasFromStorage,
        sendMessage,
        sendImage,
        setupMessageListeners,
        startTyping,
        stopTyping,
        isImage,
        getTypingUsers
    };
}

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { useChat };
}

// Exportar para uso global en navegador
if (typeof window !== 'undefined') {
    window.useChat = useChat;
}

