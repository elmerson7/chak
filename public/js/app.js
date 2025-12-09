// Importar composables (nota: en producción usar build tools)
// Por ahora los definimos aquí directamente o los cargamos como módulos

const { useSocket } = window.useSocket || {};
const { useChat } = window.useChat || {};

const { createApp } = Vue;

createApp({
    data() {
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
            commonEmojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
        };
    },
    
    mounted() {
        // Inicializar Socket.IO
        this.socketComposable = useSocket();
        this.socketComposable.connect();
        
        // Inicializar Chat
        this.chatComposable = useChat(this.socketComposable);
        
        // Cargar alias guardado
        const savedAlias = this.chatComposable.loadAliasFromStorage();
        if (savedAlias) {
            this.aliasInput = savedAlias;
            this.currentUser = this.chatComposable.currentUser;
            this.showUserModal = false;
            this.socketComposable.emit('setAlias', savedAlias);
        }
        
        // Configurar listeners
        this.setupListeners();
        
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
        }
    },
    
    beforeUnmount() {
        if (this.socketComposable) {
            this.socketComposable.disconnect();
        }
    }
}).mount('#app');
