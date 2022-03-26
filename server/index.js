const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const cors = require('cors');

//cors para peticiones fuera del servidor
/**
 setHeader('Access-Control-Allow-Origin', '*')
 setHeader('Access-Control-Allow-Headers', 'X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method')
 setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
*/
app.use(cors());

app.set('port', process.env.PORT || 5000);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "..", "app/build")));
// app.get("/", function (req, res) {
//     res.send("server running inmobiliaria...");
// })

//api rest
// app.use('/api/usuario', require('./router/Usuario'));
// app.use('/api/facultad', require('./router/Facultad'));
app.use('/api/comprobante', require('./src/router/Comprobante'));
app.use('/api/moneda', require('./src/router/Moneda'));
app.use('/api/banco', require('./src/router/Banco'));
app.use('/api/sede', require('./src/router/Sede'));

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "app/build", "index.html"));
});

app.listen(app.get("port"), () => {
    console.log(`El servidor está corriendo en el puerto ${app.get("port")}`);
});