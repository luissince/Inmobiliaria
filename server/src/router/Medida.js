const express = require('express');
const router = express.Router();
const tools = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion();


router.get('/listcombo', async function (req, res) {
    try {
        let result = await conec.query(`SELECT idMedida,nombre,preferida FROM medida`);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});


module.exports = router;