const express = require('express');
const router = express.Router();
const medida = require('../services/Medida');

router.get('/listcombo', async function (req, res) {
    return await medida.listcombo(req, res);
});

module.exports = router;