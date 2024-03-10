const express = require('express');
const router = express.Router();
const proyecto = require('../services/Proyecto');

/**
 * endpoint
 * [/api/proyecto/*]
 */

router.get('/list', async function (req, res) {
    return await proyecto.list(req, res);
});


/**
 * @swagger
 * /api/proyecto/:
 *  post:
 *      summary: Registrar un nuevo proyecto
 *      tags: [Proyecto]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          nombre:
 *                              type: string
 *                          
 *      responses:
 *          201:
 *              description: Proyecto creado
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: string
 *          500:
 *              description: Error del servidor
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: string
 */
router.post('/', async function (req, res) {
    return await proyecto.add(req, res);
});

router.put('/', async function (req, res) {
    return await proyecto.edit(req, res);
});

router.get('/id', async function (req, res) {
    return await proyecto.id(req, res);
});

router.delete('/', async function (req, res) {
    return await proyecto.delete(req, res);
});

router.get('/inicio', async function (req, res) {
    return await proyecto.inicio(req, res);
});

router.get('/combo',async function (req, res){
    return await proyecto.combo(req, res);
});

module.exports = router;