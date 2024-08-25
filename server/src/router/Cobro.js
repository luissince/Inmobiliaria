const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
const smtpTransport = require('nodemailer-smtp-transport');
const { decrypt } = require('../tools/CryptoJS');
const { generateExcel, cpeSunat } = require('../excel/FileFinanza')
const Cobro = require('../services/Cobro');
const sede = require('../services/Sede');
const RepFinanciero = require('../report/RepFinanciero');
const RepFactura = require('../report/RepFactura');
const { isEmail } = require('../tools/Tools');

const cobro = new Cobro();
const repFinanciero = new RepFinanciero();
const repFactura = new RepFactura();

/**
 * Api usado en los modulos
 * [facturación: cobros]
 */
router.get('/list', async function (req, res) {
    const result = await cobro.list(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.post('/add', async function (req, res) {
    const result = await cobro.add(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el cobro.");
    } else {
        res.status(500).send(result);
    }
});

router.post('/plazo', async function (req, res) {
    const result = await cobro.plazo(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el cobro.");
    } else {
        res.status(500).send(result);
    }
});

router.post('/cuota', async function (req, res) {
    const result = await cobro.cuota(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el cobro.");
    } else {
        res.status(500).send(result);
    }
});

router.post('/adelanto', async function (req, res) {
    const result = await cobro.adelanto(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el cobro.");
    } else if (result === 'server') {
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    } else {
        res.status(400).send(result);
    }
});

router.post('/inicial', async function (req, res) {
    const result = await cobro.inicial(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el inicial.");
    } else if (result === 'server') {
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    } else {
        res.status(400).send(result);
    }
});

/**
 * Api usado en los modulos
 * [facturación: cobros/detalle]
 */
router.get('/id', async function (req, res) {
    const result = await cobro.id(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.delete('/anular', async function (req, res) {
    const result = await cobro.delete(req, res)
    if (result === 'delete') {
        res.status(201).send("Se eliminó correctamente el cobro.");
    } else {
        res.status(500).send(result);
    }
});

router.get('/email', async function (req, res) {
    try {

        const sedeInfo = await sede.infoSedeReporte(req)

        if (typeof sedeInfo !== 'object') {
            res.status(500).send(sedeInfo)
            return;
        }

        const detalle = await cobro.id(req)

        if (typeof detalle === 'object') {

            let pdf = await repFactura.repCobro(req, sedeInfo, detalle);

            if (typeof pdf === 'string') {
                res.status(500).send(pdf);
            } else {

                const xml = await cobro.xmlGenerate(req);

                if (typeof xml === 'string') {
                    res.status(500).send(xml);
                } else {
                    if (!isEmail(sedeInfo.usuarioEmail) && sedeInfo.claveEmail == "") {
                        res.status(400).send("Las credenciales del correo para el envío no pueden ser vacios.");
                    } else {
                        if (!isEmail(detalle.cabecera.email)) {
                            res.status(400).send("El correo del cliente no es valido.");
                        } else {
                            // create reusable transporter object using the default SMTP transport
                            let transporter = nodemailer.createTransport(smtpTransport({
                                // host: "smtp-mail.outlook.com.",
                                // port: 587,
                                service: 'gmail',
                                auth: {
                                    user: sedeInfo.usuarioEmail, // generated ethereal user
                                    pass: sedeInfo.claveEmail, // generated ethereal password
                                }
                            }));
                            // send mail with defined transport object
                            // Message object
                            let message = {
                                from: `"${sedeInfo.nombreEmpresa} 👻" ${sedeInfo.usuarioEmail}`,

                                // Comma separated list of recipients
                                to: detalle.cabecera.email,
                                // bcc: 'andris@ethereal.email',

                                // Subject of the message
                                subject: 'Comprobante Electrónico ✔',

                                // plaintext body
                                text: sedeInfo.ruc,

                                // HTML body
                                html:
                                    `<p>Estimado Cliente <b>${detalle.cabecera.informacion}</b>.</p>
                                    <p>Le envíamos la información de su comprobante electrónico.</p>
                                    <span>Tipo de Documento: <b>${detalle.cabecera.comprobante}</b></span><br/>
                                    <span>Número de Serie: <b>${detalle.cabecera.serie}</b></span><br/>
                                    <span>Número de Documento: <b>${detalle.cabecera.numeracion}</b></span><br/>
                                    <span>N° RUC del Emisor: <b>${sedeInfo.ruc}</b></span><br/>
                                    <span>N° RUC/DNI del Cliente: <b>${detalle.cabecera.documento}</b></span><br/>
                                    <span>Fecha de Emisión: <b>${detalle.cabecera.fecha}</b></span><br/>
                                    <p>Atentamente ,</p>`,

                                // An array of attachments
                                attachments: [
                                    {
                                        filename: `${sedeInfo.nombreEmpresa} ${detalle.cabecera.comprobante} ${detalle.cabecera.serie}-${detalle.cabecera.numeracion}.xml`,
                                        content: xml.xmlGenerado,
                                        contentType: 'text/plain'
                                    },

                                    {
                                        filename: `${sedeInfo.nombreEmpresa} ${detalle.cabecera.comprobante} ${detalle.cabecera.serie}-${detalle.cabecera.numeracion}.pdf`,
                                        content: pdf,
                                        contentType: 'application/pdf'
                                    },
                                ]
                            };

                            await transporter.sendMail(message);
                            res.status(200).send("Se envío correctamente el correo a " + detalle.cabecera.email);
                        }
                    }
                }
            }
        } else {
            res.status(500).send(detalle);
        }
    } catch (error) {
        res.status(500).send("Se produjo un error de servidor, intente nuevamente.");
    }
});

router.get('/repletramatricial', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idVenta = decryptedData.idVenta;
    req.query.idPlazo = decryptedData.idPlazo;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await cobro.idPlazo(req)

    if (typeof detalle === 'object') {

        let data = await repFactura.repLetraA5(req, sedeInfo, detalle);
        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=comprobantea5.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle);
    }
});

/**
 * Api usado en los modulos
 * [facturación: cobros/detalle]
 */
router.get('/repcomprobantematricial', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idCobro = decryptedData.idCobro;


    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await cobro.id(req)

    if (typeof detalle === 'object') {

        let data = await repFactura.repCobroA5(req, sedeInfo, detalle);
        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=${detalle.cabecera.comprobante + " " + detalle.cabecera.serie + "-" + detalle.cabecera.numeracion}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle);
    }
});

/**
 * Api usado en la creación del pdf
 * [facturación: cobros]
 */
router.get('/repcomprobante', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idCobro = decryptedData.idCobro;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await cobro.id(req)

    if (typeof detalle === 'object') {

        let data = await repFactura.repCobro(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=${detalle.cabecera.comprobante + " " + detalle.cabecera.serie + "-" + detalle.cabecera.numeracion}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle);
    }
});

/**
 * Api usado en la creación del pdf
 * [reportes: R.Financiero]
 */
router.get('/repgeneralcobros', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');

    req.query.idSede = decryptedData.idSede;
    req.query.fechaIni = decryptedData.fechaIni;
    req.query.fechaFin = decryptedData.fechaFin;
    req.query.isDetallado = decryptedData.isDetallado;
    req.query.includeLatePayments = decryptedData.includeLatePayments,
    req.query.idComprobante = decryptedData.idComprobante;
    req.query.idUsuario = decryptedData.idUsuario;
    req.query.idProyecto = decryptedData.idProyecto;
    req.query.idBanco = decryptedData.idBanco;

    const sedeInfo = await sede.infoSedeReporte(req);

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo);
        return;
    }

    const detalle = await cobro.cobroGeneral(req);

    if (typeof detalle === 'object') {
        let data = req.query.isDetallado ? await repFinanciero.repFiltroCobrosDetallados(req, sedeInfo, detalle) : await repFinanciero.repFiltroCobros(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=REPORTE DE COBROS Y GASTOS DEL ${req.query.fechaIni} AL ${req.query.fechaFin}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle)
    }
});

router.get('/excelgeneralcobros', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');

    req.query.idSede = decryptedData.idSede;
    req.query.fechaIni = decryptedData.fechaIni;
    req.query.fechaFin = decryptedData.fechaFin;
    req.query.isDetallado = decryptedData.isDetallado;
    req.query.includeLatePayments = decryptedData.includeLatePayments;
    req.query.idComprobante = decryptedData.idComprobante;
    req.query.idUsuario = decryptedData.idUsuario;
    req.query.idProyecto = decryptedData.idProyecto;
    req.query.idBanco = decryptedData.idBanco;

    const sedeInfo = await sede.infoSedeReporte(req);

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo);
        return;
    }

    const detalle = await cobro.cobroGeneral(req);
  
    if (typeof detalle === 'object') {

        const data = await generateExcel(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.end(data);
        }
    } else {
        res.status(500).send(detalle)
    }
});

router.get('/excelcpesunat', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');

    req.query.idSede = decryptedData.idSede;
    req.query.fechaIni = decryptedData.fechaIni;
    req.query.fechaFin = decryptedData.fechaFin;
    req.query.idComprobante = decryptedData.idComprobante;

    const sedeInfo = await sede.infoSedeReporte(req);

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo);
        return;
    }

    const detalle = await cobro.cpeSunat(req);

    if (Array.isArray(detalle)) {

        const data = await cpeSunat(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.end(data);
        }
    } else {
        res.status(500).send(detalle)
    }
});

router.get('/xmlsunat', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idCobro = decryptedData.idCobro;
    req.query.xmlSunat = decryptedData.xmlSunat;

    const sedeInfo = await sede.infoSedeReporte(req);

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo);
        return;
    }

    const detalle = await cobro.xmlGenerate(req);

    if (typeof detalle === 'object') {
        const object = {
            "name": `${sedeInfo.nombreEmpresa} ${detalle.comprobante} ${detalle.serie}-${detalle.numeracion}.xml`,
            "data": detalle.xmlGenerado
        };
        const buffXmlSunat = Buffer.from(JSON.stringify(object), "utf-8");
        res.end(buffXmlSunat);
    } else {
        res.status(500).send(detalle);
    }
});

router.get('/notificaciones', async function (req, res) {
    const result = await cobro.notificaciones(req)
    if (Array.isArray(result)) {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.get('/detallenotificaciones', async function (req, res) {
    const result = await cobro.detalleNotificaciones(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.get('/searchComprobante', async function (req, res) {
    const result = await cobro.searchComprobante(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

module.exports = router;