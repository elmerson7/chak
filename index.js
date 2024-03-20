// index.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const today = new Date();
const logsFolder = 'logs';
const logFileName = `${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}.txt`;


// Crear la carpeta de logs si no existe
if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder);
}

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Escuchar conexiones de clientes
io.on('connection', (socket) => {

    const logFilePath = path.join(__dirname, logsFolder, logFileName);
    let mensajesDelDiaActual = [];
    
    // Leer los mensajes del archivo de registro
    if (fs.existsSync(logFilePath)) {
        const mensajesRaw = fs.readFileSync(logFilePath, 'utf8').split('\n');
        mensajesDelDiaActual = mensajesRaw.map(mensaje => mensaje.replace(/"/g, ''));
    }
    
    // Enviar los mensajes del día actual al cliente recién conectado
    socket.emit('mensajesPrevios', mensajesDelDiaActual);
    

    // Obtener alias del cliente
    let alias = 'Anónimo';

    var avatarURL = `https://robohash.org/${alias}.png`;
    
    socket.on('setAlias', (newAlias) => {
        alias = newAlias;

        // Genera un hash aleatorio a partir del alias del usuario
        const hash = crypto.createHash('md5').update(alias).digest('hex');
        // Construye la URL del avatar utilizando RoboHash
        avatarURL = `https://robohash.org/${hash}.png`;

        console.log('Nuevo cliente conectado:', {
            alias: alias,
            address: socket.handshake.address,
            headers: socket.handshake.headers
        });


    });

    socket.on('imagen', (imagenData) => {
        // Emitimos la imagen a todos los clientes conectados
        io.emit('imagen', {'mensaje':imagenData,'emisor': alias});
    });

    // Escuchar mensajes del cliente
    socket.on('mensaje', (mensaje) => {
        const mensaje_formateado = `<div class="message-container">`+
                `<div class="row">`+
                    `<div class="col-auto">`+
                        `<img src="${avatarURL}" class="avatar" width="50" alt="Avatar"></img>`+
                    `</div>`+
                    `<div class="col">`+
                        `<span style="color:#000;font-weight:bold"><u>${alias}:</u></span>`+
                        `<div class="message-content" style="display:flex;justify-content: space-between;">`+
                            `<span class="smessage">${mensaje}</span>`+
                            `<span class="stime"><i>${obtenerHoraActual()}</i></span>`+
                        `</div>`+
                    `</div>`+
                `</div>`+
            `</div>`;
        
        // Escribir el mensaje en el archivo de log
        fs.appendFileSync(logFilePath, '\n'+JSON.stringify(mensaje_formateado));


        // Emitir el mensaje a todos los clientes conectados
        io.emit('mensaje', {'mensaje': mensaje_formateado, 'emisor': alias});
    });

    // Manejar desconexiones de clientes
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', {
            id: socket.id,
            address: socket.handshake.address,
            headers: socket.handshake.headers
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

function obtenerHoraActual() {
    // Crear un nuevo objeto Date
    var fechaActual = new Date();

    // Obtener la hora, el minuto y el segundo
    var hora = fechaActual.getHours();
    var minuto = fechaActual.getMinutes();
    var segundo = fechaActual.getSeconds();

    // Determinar si es AM o PM
    var periodo = (hora < 12) ? "a.m." : "p.m.";

    // Convertir la hora al formato de 12 horas
    hora = (hora > 12) ? hora - 12 : hora;

    // Formatear los valores para que siempre tengan dos dígitos
    hora = (hora < 10) ? "0" + hora : hora;
    minuto = (minuto < 10) ? "0" + minuto : minuto;
    segundo = (segundo < 10) ? "0" + segundo : segundo;

    // Devolver la hora formateada
    return hora + ":" + minuto + ":" + segundo + " " + periodo;
}

