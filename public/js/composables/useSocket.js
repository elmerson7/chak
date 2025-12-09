/**
 * Composable para gestión de Socket.IO
 */
function useSocket() {
    let socket = null;
    let isConnected = false;
    const listeners = new Map();
    
    /**
     * Conecta al servidor Socket.IO
     * @returns {Object} Instancia del socket
     */
    function connect() {
        if (socket && isConnected) {
            return socket;
        }
        
        socket = io();
        isConnected = true;
        
        socket.on('connect', () => {
            console.log('Conectado al servidor');
        });
        
        socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
            isConnected = false;
        });
        
        socket.on('error', (error) => {
            console.error('Error de Socket.IO:', error);
        });
        
        return socket;
    }
    
    /**
     * Desconecta del servidor
     */
    function disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
            isConnected = false;
        }
    }
    
    /**
     * Emite un evento al servidor
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos a enviar
     */
    function emit(event, data) {
        if (socket && isConnected) {
            socket.emit(event, data);
        }
    }
    
    /**
     * Escucha un evento del servidor
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    function on(event, callback) {
        if (socket) {
            socket.on(event, callback);
            
            // Guardar listener para poder removerlo después
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
        }
    }
    
    /**
     * Deja de escuchar un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback (opcional)
     */
    function off(event, callback) {
        if (socket) {
            if (callback) {
                socket.off(event, callback);
            } else {
                socket.off(event);
            }
        }
    }
    
    /**
     * Obtiene el estado de conexión
     * @returns {boolean} Estado de conexión
     */
    function getConnectionStatus() {
        return isConnected && socket?.connected;
    }
    
    return {
        connect,
        disconnect,
        emit,
        on,
        off,
        getConnectionStatus,
        socket: () => socket
    };
}

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { useSocket };
}

// Exportar para uso global en navegador
if (typeof window !== 'undefined') {
    window.useSocket = useSocket;
}

