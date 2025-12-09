const { createApp } = Vue;

// Composable para gestión de Socket.IO
function useSocket() {
    let socket = null;
    let isConnected = false;
    
    function connect() {
        if (socket && isConnected) {
            return socket;
        }
        
        socket = io();
        isConnected = true;
        
        socket.on('connect', () => {
            console.log('Conectado al servidor');
            isConnected = true;
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
    
    function disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
            isConnected = false;
        }
    }
    
    function emit(event, data) {
        if (socket && isConnected) {
            socket.emit(event, data);
        }
    }
    
    function on(event, callback) {
        if (socket) {
            socket.on(event, callback);
        }
    }
    
    function off(event, callback) {
        if (socket) {
            if (callback) {
                socket.off(event, callback);
            } else {
                socket.off(event);
            }
        }
    }
    
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

createApp({
    data() {
        // Obtener tema actual del themeManager
        const currentTheme = window.themeManager ? window.themeManager.getCurrentTheme() : { theme: 'actual', mode: 'light' };
        
        return {
            messages: [],
            currentUser: null,
            newMessage: '',
            showUserModal: true,
            aliasInput: '',
            typingUsers: [],
            isConnected: false,
            errorMessage: null,
            typingTimeout: null,
            showEmojiPicker: false,
            onlineUsers: [], // Lista de usuarios en línea
            showConfigModal: false,
            selectedTheme: currentTheme.theme,
            selectedMode: currentTheme.mode,
            commonEmojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
        };
    },
    
    mounted() {
        // Inicializar Socket.IO
        this.socketComposable = useSocket();
        this.socketComposable.connect();
        
        // Cargar alias guardado
        const savedAlias = localStorage.getItem('chak_alias');
        const savedAvatar = localStorage.getItem('chak_avatar');
        
        if (savedAlias && savedAvatar) {
            this.aliasInput = savedAlias;
            this.currentUser = {
                alias: savedAlias,
                avatar_url: savedAvatar
            };
            this.showUserModal = false;
            this.socketComposable.emit('setAlias', savedAlias);
        }
        
        // Configurar listeners
        this.setupListeners();
        
        // Cargar tema guardado
        if (window.themeManager) {
            const currentTheme = window.themeManager.getCurrentTheme();
            this.selectedTheme = currentTheme.theme;
            this.selectedMode = currentTheme.mode;
        }
        
        // Focus en el input de mensaje
        this.$nextTick(() => {
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.focus();
            }
        });
        
        // Cerrar emoji picker al hacer click fuera
        document.addEventListener('click', (e) => {
            if (this.showEmojiPicker && !e.target.closest('.emoji-picker-container') && !e.target.closest('.btn-emoji')) {
                this.showEmojiPicker = false;
            }
        });
    },
    
    methods: {
        setupListeners() {
            // Alias establecido
            this.socketComposable.on('aliasEstablecido', (data) => {
                this.currentUser = {
                    alias: data.alias,
                    avatar_url: data.avatar_url
                };
                this.showUserModal = false;
                this.errorMessage = null;
                
                // Guardar en localStorage
                localStorage.setItem('chak_alias', data.alias);
                localStorage.setItem('chak_avatar', data.avatar_url);
            });
            
            // Mensajes previos
            this.socketComposable.on('mensajesPrevios', (mensajesPrevios) => {
                this.messages = mensajesPrevios;
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            });
            
            // Nuevo mensaje
            this.socketComposable.on('mensaje', (data) => {
                this.messages.push(data);
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            });
            
            // Nueva imagen
            this.socketComposable.on('imagen', (data) => {
                this.messages.push(data);
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            });
            
            // Usuario escribiendo
            this.socketComposable.on('usuarioEscribiendo', (data) => {
                if (data.alias !== this.currentUser?.alias) {
                    if (!this.typingUsers.includes(data.alias)) {
                        this.typingUsers.push(data.alias);
                    }
                }
            });
            
            // Usuario dejó de escribir
            this.socketComposable.on('usuarioDejoDeEscribir', (data) => {
                this.typingUsers = this.typingUsers.filter(alias => alias !== data.alias);
            });
            
            // Errores
            this.socketComposable.on('error', (error) => {
                this.errorMessage = error.message || 'Ocurrió un error';
                setTimeout(() => {
                    this.errorMessage = null;
                }, 5000);
            });
            
            // Estado de conexión
            this.socketComposable.on('connect', () => {
                this.isConnected = true;
            });
            
            this.socketComposable.on('disconnect', () => {
                this.isConnected = false;
            });
            
            // Usuarios en línea
            this.socketComposable.on('usuariosEnLinea', (usuarios) => {
                this.onlineUsers = usuarios;
            });
            
            this.socketComposable.on('usuarioConectado', (data) => {
                if (!this.onlineUsers.includes(data.alias)) {
                    this.onlineUsers.push(data.alias);
                }
            });
            
            this.socketComposable.on('usuarioDesconectado', (data) => {
                this.onlineUsers = this.onlineUsers.filter(alias => alias !== data.alias);
            });
        },
        
        isUserOnline(alias) {
            return this.onlineUsers.includes(alias);
        },
        
        handleSetAlias() {
            if (!this.aliasInput || !this.aliasInput.trim()) {
                this.errorMessage = 'El alias es requerido';
                return;
            }
            
            this.socketComposable.emit('setAlias', this.aliasInput.trim());
        },
        
        sendMessage() {
            if (!this.newMessage || !this.newMessage.trim()) {
                return;
            }
            
            this.socketComposable.emit('mensaje', this.newMessage.trim());
            this.newMessage = '';
        },
        
        handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        },
        
        handlePaste(event) {
            const items = (event.clipboardData || event.originalEvent.clipboardData).items;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    event.preventDefault();
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        this.sendImage(e.target.result);
                    };
                    
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        },
        
        sendImage(imagenData) {
            this.socketComposable.emit('imagen', imagenData);
        },
        
        isImage(mensaje) {
            const contenido = typeof mensaje === 'string' 
                ? mensaje 
                : mensaje?.contenido || mensaje?.mensaje || '';
            return contenido.startsWith('data:image');
        },
        
        getMessageTime(createdAt) {
            if (!createdAt) return '';
            const date = new Date(createdAt);
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const minutesStr = minutes < 10 ? '0' + minutes : minutes;
            return `${hours}:${minutesStr} ${ampm}`;
        },
        
        getTerminalTime(createdAt) {
            if (!createdAt) return '';
            const date = new Date(createdAt);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            const hoursStr = hours < 10 ? '0' + hours : hours;
            const minutesStr = minutes < 10 ? '0' + minutes : minutes;
            const secondsStr = seconds < 10 ? '0' + seconds : seconds;
            return `[${hoursStr}:${minutesStr}:${secondsStr}]`;
        },
        
        scrollToBottom() {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        },
        
        handleTyping() {
            this.socketComposable.emit('escribiendo');
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                this.socketComposable.emit('dejoDeEscribir');
            }, 1000);
        },
        
        insertEmoji(emoji) {
            const input = document.getElementById('message-input');
            if (input) {
                const start = input.selectionStart;
                const end = input.selectionEnd;
                this.newMessage = this.newMessage.substring(0, start) + emoji + this.newMessage.substring(end);
                this.$nextTick(() => {
                    input.focus();
                    input.setSelectionRange(start + emoji.length, start + emoji.length);
                });
            }
            this.showEmojiPicker = false;
        },
        
        applyTheme() {
            if (window.themeManager) {
                window.themeManager.setTheme(this.selectedTheme);
                // Si es terminal, forzar modo oscuro (aunque no se use)
                if (this.selectedTheme === 'terminal') {
                    this.selectedMode = 'dark';
                }
                window.themeManager.setMode(this.selectedMode);
            }
            this.showConfigModal = false;
        }
    },
    
    beforeUnmount() {
        if (this.socketComposable) {
            this.socketComposable.disconnect();
        }
    }
}).mount('#app');
