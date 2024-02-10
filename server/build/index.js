"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// const bodyParser = require('body-parser');
const path = require('path');
const app = (0, express_1.default)();
const cors = require('cors');
require('dotenv').config();
//cors para peticiones fuera del servidor
/**
 setHeader('Access-Control-Allow-Origin', '*')
 setHeader('Access-Control-Allow-Headers', 'X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method')
 setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
*/
app.use(cors());
app.set('port', process.env.PORT || 5000);
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: false }));
app.use(express_1.default.static(path.join(__dirname, "..", "app/build")));
// app.get("/", function (req, res) {
//     res.send("server running inmobiliaria...");
// })
//api rest
// app.use('/api/usuario', require('./router/Usuario'));
// app.use('/api/facultad', require('./router/Facultad'));
app.use('/api/comprobante', require('./src/router/Comprobante'));
app.use('/api/metodopago', require('./src/router/MetodoPago'));
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
app.use('/api/ubigeo', require('./src/router/Ubigeo'));
app.use('/api/tipodocumento', require('./src/router/TipoDocumento'));
app.use('/api/medida', require('./src/router/Medida'));
app.use('/api/dashboard', require('./src/router/Dashboard'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "app/build", "index.html"));
});
app.listen(app.get("port"), () => {
    console.log(`El servidor está corriendo en el puerto ${app.get("port")}`);
});
