# CHAK - Chat en Tiempo Real

Aplicación de chat en tiempo real moderna construida con Vue 3, Node.js, Socket.IO y SQLite.

## Características

- 💬 Chat en tiempo real con Socket.IO
- 👤 Sistema de usuarios con alias y avatares generados automáticamente
- 🖼️ Compartir imágenes pegándolas directamente
- 😊 Selector de emojis integrado
- ✍️ Indicador de "escribiendo..."
- 💾 Persistencia de mensajes en SQLite
- 📱 Diseño responsive (mobile-first)
- 🎨 Interfaz moderna tipo WhatsApp
- 🔒 Validación y sanitización de datos
- ⚡ Rate limiting para prevenir spam

## Requisitos

- Node.js 24 o superior
- npm o yarn

## Instalación

1. Clonar o descargar el repositorio
2. Instalar dependencias:

```bash
npm install
```

3. Iniciar el servidor:

```bash
npm start
```

Para desarrollo con auto-reload:

```bash
npm run dev
```

4. Abrir el navegador en `http://localhost:3000`

## Estructura del Proyecto

```
chak/
├── server/                 # Backend
│   ├── config/            # Configuración (base de datos)
│   ├── handlers/          # Handlers de Socket.IO
│   ├── models/            # Modelos de datos (User, Message)
│   ├── utils/             # Utilidades (validators, sanitizers, logger)
│   ├── middleware/        # Middleware (error handling)
│   └── index.js           # Servidor principal
├── public/                # Frontend
│   ├── css/               # Estilos
│   ├── js/                # JavaScript
│   │   ├── composables/   # Composables Vue (useSocket, useChat)
│   │   └── app.js         # Aplicación Vue principal
│   └── index.html         # HTML principal
├── database/              # Base de datos SQLite
│   └── init.sql           # Script de inicialización
└── package.json           # Dependencias y scripts
```

## Base de Datos

La aplicación utiliza SQLite con las siguientes tablas:

- **usuarios**: Almacena información de usuarios (alias, avatar, timestamps)
- **mensajes**: Almacena todos los mensajes (texto e imágenes)
- **sesiones**: Registra las conexiones de usuarios

La base de datos se crea automáticamente al iniciar el servidor en `database/chak.db`.

## Uso

1. Al abrir la aplicación, ingresa tu alias (2-20 caracteres, solo letras, números y guiones bajos)
2. El alias se guarda en localStorage para futuras sesiones
3. Escribe mensajes y presiona Enter o haz clic en "Enviar"
4. Para compartir imágenes, simplemente pégala en el campo de texto (Ctrl+V / Cmd+V)
5. Usa el botón de emoji (😊) para insertar emojis en tus mensajes
6. Los mensajes se sincronizan en tiempo real entre todos los usuarios conectados

## Tecnologías

- **Backend**: Node.js 24, Express, Socket.IO
- **Base de Datos**: SQLite (better-sqlite3)
- **Frontend**: Vue 3 (Composition API), Bootstrap 5
- **Seguridad**: sanitize-html, validaciones personalizadas

## Seguridad

- Sanitización de HTML para prevenir XSS
- Validación de inputs (alias, mensajes, imágenes)
- Rate limiting (10 mensajes por minuto por usuario)
- Límite de tamaño de imágenes (5MB máximo)
- Escape de caracteres especiales

## Desarrollo

### Estructura de Código

El código sigue las mejores prácticas:
- Separación de responsabilidades
- Funciones pequeñas y reutilizables
- Manejo de errores robusto
- Código limpio y mantenible

### Agregar Nuevas Funcionalidades

1. **Backend**: Agregar handlers en `server/handlers/socketHandlers.js`
2. **Frontend**: Modificar `public/js/app.js` o crear nuevos composables
3. **Estilos**: Agregar CSS en `public/css/style.css`

## Licencia

Este proyecto es de código abierto y está disponible para uso personal.

## Notas

- La aplicación está diseñada para uso entre 2 personas
- Los mensajes se almacenan permanentemente en la base de datos
- Los avatares se generan automáticamente usando RoboHash basado en el alias del usuario
