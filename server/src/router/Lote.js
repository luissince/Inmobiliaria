const express = require('express');
const router = express.Router();
const Lote = require('../services/Lote');
const sede = require('../services/Sede');
const RepLote = require('../report/RepLote');
const { generateLoteDeuda } = require('../excel/FileLote');
const { decrypt } = require('../tools/CryptoJS');
const { currentDate } = require('../tools/Tools');
const { sendError } = require('../tools/Message');

const lote = new Lote();

const repLote = new RepLote();

router.get('/list', async function (req, res) {
    const result = await lote.list(req)
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
})

router.post('/', async function (req, res) {
    const result = await lote.add(req)
    if (result === "insert") {
        res.status(200).send("Datos registrados correctamente.")
    } else {
        res.status(500).send(result)
    }
});

router.post('/socio', async function (req, res) {
    const result = await lote.socio(req)
    if (result === "insert") {
        res.status(201).send("Datos registrados correctamente.")
    } else if (result === "cliente") {
        res.status(400).send("El cliente ya está registrado como asociado.")
    } else {
        res.status(500).send(result)
    }
});

router.post('/restablecer', async function (req, res) {
    const result = await lote.restablecer(req)
    if (result === "insert") {
        res.status(201).send("Socio restablecido.")
    } else {
        res.status(500).send(result)
    }
});

router.post("/liberar",async function (req, res) {
    return await lote.liberar(req,res);
});

router.get('/id', async function (req, res) {
    const result = await lote.id(req)
    if (typeof result === "object") {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.put('/', async function (req, res) {
    const result = await lote.update(req)
    if (result === "update") {
        res.status(200).send("Los datos se actualizarón correctamente.");
    } else if (result === "noid") {
        res.status(400).send("Se genero un problema al tratar de obtener los datos.")
    } else {
        res.status(500).send(result)
    }
});

router.delete('/', async function (req, res) {
    const result = await lote.delete(req);
    if (result === "delete") {
        res.status(200).send("Se eliminó correctamente el lote.");
    } else {
        res.status(500).send(result)
    }
});

router.get('/detalle', async function (req, res) {
    const result = await lote.detalle(req)
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.get('/listcombo', async function (req, res) {
    const result = await lote.listarCombo(req)
    if (Array.isArray(result)) {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.get('/listfilter', async function (req, res) {
    const result = await lote.listarFilter(req)
    if (Array.isArray(result)) {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.get('/lotecliente', async function (req, res) {
    const result = await lote.listarComboLoteCliente(req)
    if (Array.isArray(result)) {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.put('/cambiar', async function (req, res) {
    const result = await lote.cambiar(req);
    if (result == "update") {
        res.status(200).send("Se actualizó correctamente el cambio del lote.");
    } else {
        res.status(500).send(result);
    }
});

router.get('/replotedetalle', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idLote = decryptedData.idLote;
    req.query.idSede = decryptedData.idSede;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await lote.detalle(req)

    if (typeof detalle === 'object') {

        let data = await repLote.repDetalleLote(sedeInfo, detalle)

        if (typeof data === 'string') {
            res.status(500).send(data)
        } else {
            res.setHeader('Content-disposition', 'inline; filename=Detalle del Lote.pdf');
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle)
    }
})

router.get('/reptipolotes', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    // req.query.idLote = decryptedData.idLote;
    req.query.estadoLote = decryptedData.estadoLote;
    req.query.idSede = decryptedData.idSede;
    req.query.idProyecto = decryptedData.idProyecto;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await lote.listaEstadoLote(req)

    if (typeof detalle === 'object') {

        let data = await repLote.repTipoLote(req, sedeInfo, detalle)

        if (typeof data === 'string') {
            res.status(500).send(data)
        } else {
            res.setHeader('Content-disposition', `inline; filename=DETALLE DE LOTES AL ${currentDate()}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle);
    }
})

router.get('/replistardeudaslote', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idProyecto = decryptedData.idProyecto;
    req.query.nombreProyecto = decryptedData.nombreProyecto;
    req.query.porProyecto = decryptedData.porProyecto;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await lote.listardeudaslote(req)

    if (typeof detalle === 'object') {

        let data = await repLote.repLoteDeuda(req, sedeInfo, detalle)

        if (typeof data === 'string') {
            res.status(500).send(data)
        } else {
            res.setHeader('Content-disposition', 'inline; filename=Lista de Lotes con Deuda.pdf');
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle)
    }
})

router.get('/exacellistardeudaslote', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idProyecto = decryptedData.idProyecto;
    req.query.nombreProyecto = decryptedData.nombreProyecto;
    req.query.porProyecto = decryptedData.porProyecto;

    const sedeInfo = await sede.infoSedeReporte(req);

    if (typeof sedeInfo !== 'object') {
        return sendError(res, sedeInfo);
    }

    const detalle = await lote.listardeudaslote(req);

    if (Array.isArray(detalle)) {

        const data = await generateLoteDeuda(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            return sendError(res, data);
        } else {
            res.end(data);
        }
    } else {
        return sendError(res, detalle);
    }
})

module.exports = router;