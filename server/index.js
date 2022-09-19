const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const socket = require('socket.io');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDocument = {
    failOnErrors: false,
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Node Mysql Api Inmobiliario',
            version: '1.0.0',
            description:
                'Esta API fue creada para la empresa GYMC INMOBILIARIA para sus procesos',

            license: {
                name: 'MIT',
                url: 'https://spdx.org/licenses/MIT.html',
            },
            contact: {
                name: 'Luis Lara',
                url: 'https://www.facebook.com/luisal.laras/',
            },
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "EndPoint de desarrollo"
            },
            {
                url: "https://www.inmobiliariagmyc.com",
                description: "EndPoint de producción"
            },
        ]
    },
    apis: ['./src/router/*.js'],
};

/**
 * Carga de variable de entorno
 */
require('dotenv').config();

/**
 * Inicializando el constructor
 */

const server = http.createServer(app);
const io = socket(server, {
    cors: { origin: "*" }
});
global.io = io;

io.on('connection', (socket) => {
    console.log('a user connected');

    // socket.on('message', (message) => {
    // console.log(message);
    // io.emit('message', `${socket.id.substr(0, 2)} said ${message}`);
    // });

    socket.on("disconnect", () => {
        console.log('desconnected ' + socket.id)
    });
});


/**
 * CORS para peticiones externas
 * setHeader('Access-Control-Allow-Origin', '*')
 * setHeader('Access-Control-Allow-Headers', 'X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method')
 * setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
 */
app.use(cors());

/**
 * 
 */
app.set('port', process.env.PORT || 5000);

app.use(express.json({ limit: '1024mb' }));
app.use(express.urlencoded({ limit: '1024mb', extended: false }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerDocument)));

/**
 * Cargar la app estatica compilada
 */
app.use(express.static(path.join(__dirname, "..", "app/build")));

/**
 * Mostar estaticanmente las imagenes del proyecto
 */
app.use(express.static(path.join(__dirname, "src/path/proyect")));

/**
 * Mostar estaticanmente las imagenes de la empresa
 */
app.use(express.static(path.join(__dirname, "src/path/company")));

/**
 * Cargar las rutas de la apis
 */
app.use('/api/comprobante', require('./src/router/Comprobante'));
app.use('/api/moneda', require('./src/router/Moneda'));
app.use('/api/banco', require('./src/router/Banco'));
app.use('/api/sede', require('./src/router/Sede'));
app.use('/api/impuesto', require('./src/router/Impuesto'));

app.use('/api/proyecto', require('./src/router/Proyecto'));
app.use('/api/manzana', require('./src/router/Manzana'));
app.use('/api/lote', require('./src/router/Lote'));

app.use('/api/cliente', require('./src/router/Cliente'));
app.use('/api/factura', require('./src/router/Factura'));
app.use('/api/login', require('./src/router/Login'));

app.use('/api/perfil', require('./src/router/Perfil'));
app.use('/api/usuario', require('./src/router/Usuario'));

app.use('/api/concepto', require('./src/router/Concepto'));
app.use('/api/gasto', require('./src/router/Gasto'));
app.use('/api/cobro', require('./src/router/Cobro'));
app.use('/api/acceso', require('./src/router/Acceso'));
app.use('/api/notacredito', require('./src/router/NotaCredito'));

app.use('/api/ubigeo', require('./src/router/Ubigeo'));
app.use('/api/tipodocumento', require('./src/router/TipoDocumento'));
app.use('/api/medida', require('./src/router/Medida'));
app.use('/api/motivo', require('./src/router/Motivo'));

app.use('/api/empresa', require('./src/router/Empresa'));
app.use('/api/dashboard', require('./src/router/Dashboard'));

/**
 * 
 */
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "app/build", "index.html"));
});

// // Se ejecuta cuando los clientes se conectan
// io.on("connection", (socket) => {
//     console.log(io.of("/").adapter);
//     socket.on("joinRoom", ({ username, room }) => {
//         const user = userJoin(socket.id, username, room);

//         socket.join(user.room);

//         // Mensaje de bienvenida
//         socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

//         // Se emite un mensaje cuando un cliente se conecta
//         socket.broadcast
//             .to(user.room)
//             .emit(
//                 "message",
//                 formatMessage(botName, `${user.username} has joined the chat`)
//             );

//         // Enviar información de usuarios y salas
//         io.to(user.room).emit("roomUsers", {
//             room: user.room,
//             users: getRoomUsers(user.room),
//         });
//     });

//     // Se listan los mensaje guardados
//     socket.on("chatMessage", (msg) => {
//         const user = getCurrentUser(socket.id);

//         io.to(user.room).emit("message", formatMessage(user.username, msg));
//     });

//     // Se ejecuta cuando un cliente se desconecta
//     socket.on("disconnect", () => {
//         const user = userLeave(socket.id);

//         if (user) {
//             io.to(user.room).emit(
//                 "message",
//                 formatMessage(botName, `${user.username} has left the chat`)
//             );

//             // Enviar información de usuarios y salas
//             io.to(user.room).emit("roomUsers", {
//                 room: user.room,
//                 users: getRoomUsers(user.room),
//             });
//         }
//     });
// });

/**
 * 
 */
server.listen(app.get("port"), () => {
    console.log(`El servidor está corriendo en el puerto ${app.get("port")}`);
});