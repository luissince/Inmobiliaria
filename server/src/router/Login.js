const express = require('express');
const router = express.Router();
const login = require('../services/Login');
const { token, verify } = require('../tools/Jwt');

router.get('/createsession', async function (req, res) {
    return await login.createsession(req, res);
});

router.get('/validtoken', token, verify,async function (req, res) {
    return await login.validtoken(req, res);
});

module.exports = router;