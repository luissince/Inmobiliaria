const express = require('express');
const router = express.Router();
const metodoPago = require('../services/MetodoPago');

router.get('/list', async function (req, res) {
    return await metodoPago.list(req, res);
});

router.post('/add', async function (req, res) {
    return await metodoPago.add(req, res);
});

router.get('/id', async function (req, res) {
    return await metodoPago.id(req, res);
});

router.get('/codigo', async function (req, res) {
    return await metodoPago.codigo(req, res);
});

router.post('/edit', async function (req, res) {
    return await metodoPago.edit(req, res);
});

router.delete('/', async function (req, res) {
    return await metodoPago.delete(req, res);
});

router.get('/listcombo', async function (req, res) {
    return await metodoPago.listcombo(req, res);
 });

module.exports = router;