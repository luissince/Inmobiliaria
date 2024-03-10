const express = require('express');
const router = express.Router();
const sede = require('../services/Sede')

router.get('/list', async function (req, res) {
    return await sede.listar(req, res);
});

router.post('/add', async function (req, res) {
    return await sede.add(req, res);
});

router.get('/id', async function (req, res) {
    return await sede.id(req, res);
});

router.post('/update', async function (req, res) {
   return await sede.update(req,res);
});

router.get('/listcombo', async function (req, res) {
    return await sede.listarCombo(req , res);
});

module.exports = router;
