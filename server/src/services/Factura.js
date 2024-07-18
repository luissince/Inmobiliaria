const { currentDate, currentTime, frecuenciaPago } = require('../tools/Tools');
const { sendSuccess, sendError, sendClient, sendSave } = require('../tools/Message');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Factura {

    /**
     * Metodo usado en el modulo facturación/ventas.
     * @param {*} req 
     * @param {*} res 
     * @returns object | string
     */
    async list(req, res) {
        try {
            const lista = await conec.query(`SELECT 
                v.idVenta,
                c.idCliente,
                c.documento, 
                c.informacion,             
                v.idComprobante,  
                co.nombre as comprobante,
                v.serie,
                v.numeracion,
                DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha, 
                v.hora, 
                v.tipo, 
                v.estado,
                m.idMoneda,
                m.simbolo,
                IFNULL(SUM(vd.precio*vd.cantidad),0) AS total
                FROM venta AS v 
                INNER JOIN cliente AS c ON v.idCliente = c.idCliente
                INNER JOIN comprobante AS co ON v.idComprobante = co.idComprobante
                INNER JOIN moneda AS m ON v.idMoneda = m.idMoneda
                LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta
                WHERE 
                ? = 0 AND v.idProyecto = ?
                OR
                ? = 1 and c.informacion like concat(?,'%') AND v.idProyecto = ?
                OR
                ? = 1 and c.documento like concat(?,'%') AND v.idProyecto = ?
                OR
                ? = 1 and v.serie = ? AND v.idProyecto = ?
                OR
                ? = 1 and v.numeracion = ? AND v.idProyecto = ?
                OR
                ? = 1 and concat(v.serie,'-',v.numeracion) = ? AND v.idProyecto = ?

                GROUP BY v.idVenta
                ORDER BY v.fecha DESC, v.hora DESC
                LIMIT ?,?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ])

            const resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            const total = await conec.query(`SELECT COUNT(*) AS Total 
                FROM venta AS v 
                INNER JOIN cliente AS c ON v.idCliente = c.idCliente
                INNER JOIN comprobante as co ON v.idComprobante = co.idComprobante
                INNER JOIN moneda AS m ON v.idMoneda = m.idMoneda
                WHERE 
                ? = 0 AND v.idProyecto = ?
                OR
                ? = 1 and c.informacion like concat(?,'%') AND v.idProyecto = ?
                OR
                ? = 1 and c.documento like concat(?,'%') AND v.idProyecto = ?
                OR
                ? = 1 and v.serie = ? AND v.idProyecto = ?
                OR
                ? = 1 and v.numeracion = ? AND v.idProyecto = ?
                OR
                ? = 1 and concat(v.serie,'-',v.numeracion) = ? AND v.idProyecto = ?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,
            ]);

            return sendSuccess(res, { "result": resultLista, "total": total[0].Total });
        } catch (error) {
            console.log(error)
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async add(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let countLote = 0;

            /**
             * Validar si un lote esta vendido.
             */
            for (const item of req.body.detalleVenta) {
                const lote = await conec.execute(connection, `SELECT idLote FROM lote 
                    WHERE idLote = ? AND estado = 3`, [
                    item.idDetalle
                ]);
                if (lote.length > 0) {
                    countLote++;
                }
            }

            /**
             * si el lote esta vendido cancelar la proceso.
             * estado = 3 vendido
             */
            if (countLote > 0) {
                await conec.rollback(connection);
                return sendClient(res, "Hay un lote que se esta tratando de vender, no se puede continuar ya que está asociado a una factura.");
            }


            /**
             * Generar un código unico para la venta. 
             */
            let result = await conec.execute(connection, 'SELECT idVenta  FROM venta');
            let idVenta = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idVenta.replace("VT", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'VT000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'VT00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'VT0' + incremental;
                } else {
                    codigoGenerado = 'VT' + incremental;
                }

                idVenta = codigoGenerado;
            } else {
                idVenta = "VT0001";
            }


            /**
             * Obtener la serie y numeración del comprobante.
             */
            let comprobante = await conec.execute(connection, `SELECT 
                serie,
                numeracion 
                FROM comprobante 
                WHERE idComprobante  = ?
                `, [
                req.body.idComprobante
            ]);

            let numeracion = 0;

            let ventas = await conec.execute(connection, 'SELECT numeracion  FROM venta WHERE idComprobante = ?', [
                req.body.idComprobante
            ]);

            if (ventas.length > 0) {
                let quitarValor = ventas.map(function (item) {
                    return parseInt(item.numeracion);
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                numeracion = incremental;
            } else {
                numeracion = comprobante[0].numeracion;
            }

            /**
             * Proceso para ingresar una venta.
             */
            await conec.execute(connection, `INSERT INTO venta(
                idVenta, 
                idCliente, 
                idUsuario, 
                idComprobante, 
                idProyecto,
                serie,
                numeracion,
                idMoneda,
                tipo, 
                numCuota,
                credito,
                frecuencia,
                estado, 
                fecha, 
                hora)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                idVenta,
                req.body.idCliente,
                req.body.idUsuario,
                req.body.idComprobante,
                req.body.idProyecto,
                comprobante[0].serie,
                numeracion,
                req.body.idMoneda,
                req.body.tipo,
                req.body.numCuota,
                req.body.selectTipoPago == 3 ? 1 : 0,
                req.body.frecuenciaPago,
                req.body.estado,
                currentDate(),
                currentTime()
            ]);

            /**
             * Proceso para ingresar el detalle de la venta.
             */
            let montoTotal = 0;

            for (let item of req.body.detalleVenta) {
                await conec.execute(connection, `INSERT INTO ventaDetalle(
                    idVenta, 
                    idLote, 
                    precio, 
                    cantidad, 
                    idImpuesto,
                    idMedida)
                    VALUES(?,?,?,?,?,?)`, [
                    idVenta,
                    item.idDetalle,
                    parseFloat(item.precioContado),
                    item.cantidad,
                    item.idImpuesto,
                    item.idMedida
                ]);

                await conec.execute(connection, `UPDATE lote SET estado = 3 WHERE idLote = ?`, [
                    item.idDetalle,
                ]);

                montoTotal += parseFloat(item.precioContado) * item.cantidad;
            }

            /**
             * Proceso para ingresar un asociado a la venta.
             */
            await conec.execute(connection, `INSERT asociado(idVenta ,idCliente , estado, fecha, hora, idUsuario) VALUES(?,?,?,?,?,?)`, [
                idVenta,
                req.body.idCliente,
                1,
                currentDate(),
                currentTime(),
                req.body.idUsuario
            ]);

            /**
             * 
             */
            if (req.body.selectTipoPago === 1) {
                let cobro = await conec.execute(connection, 'SELECT idCobro FROM cobro');
                let idCobro = "";
                if (cobro.length != 0) {

                    let quitarValor = cobro.map(function (item) {
                        return parseInt(item.idCobro.replace("CB", ''));
                    });

                    let valorActual = Math.max(...quitarValor);
                    let incremental = valorActual + 1;
                    let codigoGenerado = "";
                    if (incremental <= 9) {
                        codigoGenerado = 'CB000' + incremental;
                    } else if (incremental >= 10 && incremental <= 99) {
                        codigoGenerado = 'CB00' + incremental;
                    } else if (incremental >= 100 && incremental <= 999) {
                        codigoGenerado = 'CB0' + incremental;
                    } else {
                        codigoGenerado = 'CB' + incremental;
                    }

                    idCobro = codigoGenerado;
                } else {
                    idCobro = "CB0001";
                }

                let comprobanteCobro = await conec.execute(connection, `SELECT 
                serie,
                numeracion 
                FROM comprobante 
                WHERE idComprobante  = ?
                `, [
                    req.body.idComprobanteCobro
                ]);

                let numeracionCobro = 0;

                let cobros = await conec.execute(connection, 'SELECT numeracion  FROM cobro WHERE idComprobante = ?', [
                    req.body.idComprobanteCobro
                ]);

                if (cobros.length > 0) {
                    let quitarValor = cobros.map(function (item) {
                        return parseInt(item.numeracion);
                    });

                    let valorActual = Math.max(...quitarValor);
                    let incremental = valorActual + 1;
                    numeracionCobro = incremental;
                } else {
                    numeracionCobro = comprobanteCobro[0].numeracion;
                }

                await conec.execute(connection, `INSERT INTO cobro(
                idCobro, 
                idCliente, 
                idUsuario, 
                idMoneda, 
                idBanco, 
                idProcedencia,
                idProyecto,
                idComprobante,
                serie,
                numeracion,
                metodoPago, 
                estado, 
                observacion, 
                fecha, 
                hora) 
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                    idCobro,
                    req.body.idCliente,
                    req.body.idUsuario,
                    req.body.idMoneda,
                    req.body.idBanco,
                    idVenta,
                    req.body.idProyecto,
                    req.body.idComprobanteCobro,
                    comprobanteCobro[0].serie,
                    numeracionCobro,
                    req.body.metodoPago,
                    1,
                    'COBRO AL CONTADO',
                    currentDate(),
                    currentTime()
                ]);

                await conec.execute(connection, `INSERT INTO cobroVenta(
                idCobro,
                idVenta,
                idPlazo,
                precio,
                idImpuesto,
                idMedida) 
                VALUES (?,?,?,?,?,?)`, [
                    idCobro,
                    idVenta,
                    0,
                    montoTotal,
                    req.body.idImpuesto,
                    req.body.idMedida
                ]);

                await conec.execute(connection, `INSERT INTO bancoDetalle(
                idBanco,
                idProcedencia,
                tipo,
                monto,
                fecha,
                hora,
                idUsuario)
                VALUES(?,?,?,?,?,?,?)`, [
                    req.body.idBanco,
                    idCobro,
                    1,
                    montoTotal,
                    currentDate(),
                    currentTime(),
                    req.body.idUsuario,
                ]);

            }

            /**
             * 
             */
            if (req.body.selectTipoPago === 2) {

                if (req.body.montoInicialCheck) {
                    let cobro = await conec.execute(connection, 'SELECT idCobro FROM cobro');
                    let idCobro = "";
                    if (cobro.length != 0) {

                        let quitarValor = cobro.map(function (item) {
                            return parseInt(item.idCobro.replace("CB", ''));
                        });

                        let valorActual = Math.max(...quitarValor);
                        let incremental = valorActual + 1;
                        let codigoGenerado = "";
                        if (incremental <= 9) {
                            codigoGenerado = 'CB000' + incremental;
                        } else if (incremental >= 10 && incremental <= 99) {
                            codigoGenerado = 'CB00' + incremental;
                        } else if (incremental >= 100 && incremental <= 999) {
                            codigoGenerado = 'CB0' + incremental;
                        } else {
                            codigoGenerado = 'CB' + incremental;
                        }

                        idCobro = codigoGenerado;
                    } else {
                        idCobro = "CB0001";
                    }


                    let comprobanteCobro = await conec.execute(connection, `SELECT 
                    serie,
                    numeracion 
                    FROM comprobante 
                    WHERE idComprobante  = ?
                    `, [
                        req.body.idComprobanteCobro
                    ]);

                    let numeracionCobro = 0;

                    let cobros = await conec.execute(connection, 'SELECT numeracion  FROM cobro WHERE idComprobante = ?', [
                        req.body.idComprobanteCobro
                    ]);

                    if (cobros.length > 0) {
                        let quitarValor = cobros.map(function (item) {
                            return parseInt(item.numeracion);
                        });

                        let valorActual = Math.max(...quitarValor);
                        let incremental = valorActual + 1;
                        numeracionCobro = incremental;
                    } else {
                        numeracionCobro = comprobanteCobro[0].numeracion;
                    }

                    await conec.execute(connection, `INSERT INTO cobro(
                        idCobro, 
                        idCliente, 
                        idUsuario, 
                        idMoneda, 
                        idBanco, 
                        idProcedencia,
                        idProyecto,
                        idComprobante,
                        serie,
                        numeracion,
                        metodoPago, 
                        estado, 
                        observacion, 
                        fecha, 
                        hora) 
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                        idCobro,
                        req.body.idCliente,
                        req.body.idUsuario,
                        req.body.idMoneda,
                        req.body.idBanco,
                        idVenta,
                        req.body.idProyecto,
                        req.body.idComprobanteCobro,
                        comprobanteCobro[0].serie,
                        numeracionCobro,
                        req.body.metodoPago,
                        1,
                        'INICIAL',
                        currentDate(),
                        currentTime()
                    ]);

                    await conec.execute(connection, `INSERT INTO cobroVenta(
                        idCobro,
                        idVenta,
                        idPlazo,
                        precio,
                        idImpuesto,
                        idMedida) 
                        VALUES (?,?,?,?,?,?)`, [
                        idCobro,
                        idVenta,
                        0,
                        req.body.inicial,
                        req.body.idImpuesto,
                        req.body.idMedida
                    ]);

                    await conec.execute(connection, `INSERT INTO bancoDetalle(
                        idBanco,
                        idProcedencia,
                        tipo,
                        monto,
                        fecha,
                        hora,
                        idUsuario)
                        VALUES(?,?,?,?,?,?,?)`, [
                        req.body.idBanco,
                        idCobro,
                        1,
                        req.body.inicial,
                        currentDate(),
                        currentTime(),
                        req.body.idUsuario,
                    ]);
                }

                let plazo = await conec.execute(connection, 'SELECT idPlazo FROM plazo');
                let idPlazo = 0;
                if (plazo.length != 0) {

                    let quitarValor = plazo.map(function (item) {
                        return parseInt(item.idPlazo);
                    });

                    let valorActual = Math.max(...quitarValor);
                    let incremental = valorActual + 1;
                    idPlazo = incremental;
                } else {
                    idPlazo = 1;
                }

                let inicioDate = new Date(req.body.fechaPago[0], req.body.fechaPago[1] - 1, 1);

                let cuotaMes = (montoTotal - req.body.inicial) / req.body.numCuota;

                let i = 0;
                let frecuenciaPago = req.body.frecuenciaPago;
                let cuota = 0;
                // while (inicioDate < ultimoDate) {                   
                while (i < req.body.numCuota) {

                    let now = new Date();

                    if (frecuenciaPago > 15) {
                        now = new Date(inicioDate.getFullYear(), inicioDate.getMonth() + 1, 0);
                    } else {
                        now = new Date(inicioDate.getFullYear(), inicioDate.getMonth(), 15);
                    }

                    i++;
                    cuota++;

                    await conec.execute(connection, `INSERT INTO plazo(
                        idPlazo,
                        idVenta,
                        cuota,
                        fecha,
                        hora,
                        monto,
                        estado) 
                        VALUES(?,?,?,?,?,?,?)`, [
                        idPlazo,
                        idVenta,
                        cuota,
                        now.getFullYear() + "-" + ((now.getMonth() + 1) < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1)) + "-" + now.getDate(),
                        currentTime(),
                        cuotaMes.toFixed(2),
                        0
                    ]);
                    idPlazo++;

                    inicioDate.setMonth(inicioDate.getMonth() + 1);
                }
            }


            /**
             * 
             */
            if (req.body.selectTipoPago === 3) {
                if (req.body.montoInicialCheck) {
                    let cobro = await conec.execute(connection, 'SELECT idCobro FROM cobro');
                    let idCobro = "";
                    if (cobro.length != 0) {

                        let quitarValor = cobro.map(function (item) {
                            return parseInt(item.idCobro.replace("CB", ''));
                        });

                        let valorActual = Math.max(...quitarValor);
                        let incremental = valorActual + 1;
                        let codigoGenerado = "";
                        if (incremental <= 9) {
                            codigoGenerado = 'CB000' + incremental;
                        } else if (incremental >= 10 && incremental <= 99) {
                            codigoGenerado = 'CB00' + incremental;
                        } else if (incremental >= 100 && incremental <= 999) {
                            codigoGenerado = 'CB0' + incremental;
                        } else {
                            codigoGenerado = 'CB' + incremental;
                        }

                        idCobro = codigoGenerado;
                    } else {
                        idCobro = "CB0001";
                    }


                    let comprobanteCobro = await conec.execute(connection, `SELECT 
                    serie,
                    numeracion 
                    FROM comprobante 
                    WHERE idComprobante  = ?
                    `, [
                        req.body.idComprobanteCobro
                    ]);

                    let numeracionCobro = 0;

                    let cobros = await conec.execute(connection, 'SELECT numeracion  FROM cobro WHERE idComprobante = ?', [
                        req.body.idComprobanteCobro
                    ]);

                    if (cobros.length > 0) {
                        let quitarValor = cobros.map(function (item) {
                            return parseInt(item.numeracion);
                        });

                        let valorActual = Math.max(...quitarValor);
                        let incremental = valorActual + 1;
                        numeracionCobro = incremental;
                    } else {
                        numeracionCobro = comprobanteCobro[0].numeracion;
                    }

                    await conec.execute(connection, `INSERT INTO cobro(
                        idCobro, 
                        idCliente, 
                        idUsuario, 
                        idMoneda, 
                        idBanco, 
                        idProcedencia,
                        idProyecto,
                        idComprobante,
                        serie,
                        numeracion,
                        metodoPago, 
                        estado, 
                        observacion, 
                        fecha, 
                        hora) 
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                        idCobro,
                        req.body.idCliente,
                        req.body.idUsuario,
                        req.body.idMoneda,
                        req.body.idBanco,
                        idVenta,
                        req.body.idProyecto,
                        req.body.idComprobanteCobro,
                        comprobanteCobro[0].serie,
                        numeracionCobro,
                        req.body.metodoPago,
                        1,
                        'INICIAL',
                        currentDate(),
                        currentTime()
                    ]);

                    await conec.execute(connection, `INSERT INTO cobroVenta(
                        idCobro,
                        idVenta,
                        idPlazo,
                        precio,
                        idImpuesto,
                        idMedida) 
                        VALUES (?,?,?,?,?,?)`, [
                        idCobro,
                        idVenta,
                        0,
                        req.body.inicial,
                        req.body.idImpuesto,
                        req.body.idMedida
                    ]);

                    await conec.execute(connection, `INSERT INTO bancoDetalle(
                        idBanco,
                        idProcedencia,
                        tipo,
                        monto,
                        fecha,
                        hora,
                        idUsuario)
                        VALUES(?,?,?,?,?,?,?)`, [
                        req.body.idBanco,
                        idCobro,
                        1,
                        req.body.inicial,
                        currentDate(),
                        currentTime(),
                        req.body.idUsuario,
                    ]);
                }
            }

            /**
             * Procesao de registro para dar de alta al un proyecto
             */

            const alta = await conec.execute(connection, `SELECT idAlta FROM alta WHERE idCliente = ? AND idProyecto = ?`, [
                req.body.idCliente,
                req.body.idProyecto,
            ]);

            if (alta.length === 0) {
                let resultAlta = await conec.execute(connection, 'SELECT idAlta FROM alta');
                let idAlta = 0;
                if (resultAlta.length != 0) {
                    let quitarValor = resultAlta.map(function (item) {
                        return parseInt(item.idAlta);
                    });

                    let valorActual = Math.max(...quitarValor);
                    let incremental = valorActual + 1;

                    idAlta = incremental;
                } else {
                    idAlta = 1;
                }

                await conec.execute(connection, `INSERT INTO alta(
                    idAlta ,
                    idCliente,
                    idProyecto,
                    fecha,
                    hora,
                    idUsuario
                ) VALUES(?,?,?,?,?,?)`, [
                    idAlta,
                    req.body.idCliente,
                    req.body.idProyecto,
                    currentDate(),
                    currentTime(),
                    req.body.idUsuario,
                ]);
            }

            /**
            * Generar un código unico para la tabla auditoria. 
            */
            let resultAuditoria = await conec.execute(connection, 'SELECT idAuditoria FROM auditoria');
            let idAuditoria = 0;
            if (resultAuditoria.length != 0) {
                let quitarValor = resultAuditoria.map(function (item) {
                    return parseInt(item.idAuditoria);
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;

                idAuditoria = incremental;
            } else {
                idAuditoria = 1;
            }

            /**
            * Proceso de registrar datos en la tabla auditoria para tener un control de los movimientos echos.
            */
            await conec.execute(connection, `INSERT INTO auditoria(
                idAuditoria,
                idProcedencia,
                descripcion,
                fecha,
                hora,
                idUsuario) 
                VALUES(?,?,?,?,?,?)`, [
                idAuditoria,
                idVenta,
                `REGISTRO DEL COMPROBANTE ${comprobante[0].serie}-${numeracion}`,
                currentDate(),
                currentTime(),
                req.body.idUsuario
            ]);

            await conec.commit(connection);
            return sendSave(res, "Se completo el proceso correctamente.");
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async anular(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            const validar = await conec.execute(connection, `SELECT 
            idVenta,
            serie,
            numeracion 
            FROM venta 
            WHERE idVenta = ? AND estado = 3`, [
                req.query.idVenta
            ]);
            if (validar.length !== 0) {
                await conec.rollback(connection);
                return sendClient(res, "La venta ya se encuentra anulada.");
            }


            const plazos = await conec.execute(connection, `SELECT * FROM
                    cobroVenta WHERE idVenta = ?`, [
                req.query.idVenta
            ]);

            let validate = 0;

            for (const item of plazos) {
                if (item.idPlazo !== 0) {
                    validate++;
                }
            }

            if (validate > 0) {
                await conec.rollback(connection);
                return sendClient(res, "No se puede eliminar la venta porque tiene cuotas asociadas.");
            }

            await conec.execute(connection, `UPDATE venta SET estado = 3 
                    WHERE idVenta = ?`, [
                req.query.idVenta
            ]);

            const cobro = await conec.execute(connection, `SELECT idCobro FROM cobro WHERE idProcedencia = ?`, [
                req.query.idVenta
            ])

            if (cobro.length > 0) {
                await conec.execute(connection, `DELETE FROM cobro WHERE idCobro = ?`, [
                    cobro[0].idCobro
                ]);

                await conec.execute(connection, `DELETE FROM cobroDetalle WHERE idCobro = ?`, [
                    cobro[0].idCobro
                ]);

                await conec.execute(connection, `DELETE FROM cobroVenta WHERE idCobro = ?`, [
                    cobro[0].idCobro
                ]);

                await conec.execute(connection, `DELETE FROM bancoDetalle WHERE idProcedencia  = ?`, [
                    cobro[0].idCobro
                ]);
            }

            const lote = await conec.execute(connection, `SELECT vd.idLote FROM
                    venta AS v 
                    INNER JOIN ventaDetalle AS vd ON v.idVenta = vd.idVenta
                    WHERE v.idVenta  = ?`, [
                req.query.idVenta
            ]);

            for (const item of lote) {
                await conec.execute(connection, `UPDATE lote SET estado = 1 
                        WHERE idLote = ?`, [
                    item.idLote
                ]);
            }

            await conec.execute(connection, `DELETE FROM plazo WHERE idVenta = ?`, [
                req.query.idVenta
            ]);

            await conec.execute(connection, `DELETE FROM asociado WHERE idVenta = ?`, [
                req.query.idVenta
            ]);

            const venta = await conec.execute(connection, `SELECT 
                idVenta,
                serie,
                numeracion 
                FROM venta 
                WHERE idVenta = ?`, [
                req.query.idVenta
            ]);

            /**
             * Proceso de registro de auditoria 
             */
            const resultAuditoria = await conec.execute(connection, 'SELECT idAuditoria FROM auditoria');
            let idAuditoria = 0;
            if (resultAuditoria.length != 0) {
                let quitarValor = resultAuditoria.map(function (item) {
                    return parseInt(item.idAuditoria);
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;

                idAuditoria = incremental;
            } else {
                idAuditoria = 1;
            }

            await conec.execute(connection, `INSERT INTO auditoria(
                    idAuditoria,
                    idProcedencia,
                    descripcion,
                    fecha,
                    hora,
                    idUsuario) 
                    VALUES(?,?,?,?,?,?)`, [
                idAuditoria,
                req.query.idVenta,
                `ANULACIÓN DEL COMPROBANTE ${venta[0].serie}-${venta[0].numeracion}`,
                currentDate(),
                currentTime(),
                req.query.idUsuario
            ]);

            await conec.commit(connection);
            return sendSave(res, "Se anuló correctamente la venta.");

        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    /**
     * Metodo usado en el modulo facturación/ventas/detalle.
     * @param {*} req 
     * @param {*} res 
     * @returns object | string
     */
    async id(req, res) {
        try {

            let result = await conec.query(`SELECT
            v.idVenta, 
            com.nombre AS comprobante,
            com.codigo as codigoVenta,
            v.serie,
            v.numeracion,
            
            td.nombre AS tipoDoc,      
            td.codigo AS codigoCliente,      
            c.documento,
            c.informacion,
            c.direccion,

            CONCAT(us.nombres,' ',us.apellidos) AS usuario,
    
            DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha,
            v.hora, 
            v.tipo, 
            v.estado, 
            m.simbolo,
            m.codiso,
            m.nombre as moneda,

            IFNULL(SUM(vd.precio*vd.cantidad),0) AS monto
            FROM venta AS v 
            INNER JOIN cliente AS c ON v.idCliente = c.idCliente
            INNER JOIN usuario AS us ON us.idUsuario = v.idUsuario 
            INNER JOIN tipoDocumento AS td ON td.idTipoDocumento = c.idTipoDocumento 
            INNER JOIN comprobante AS com ON v.idComprobante = com.idComprobante
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE v.idVenta = ?`, [
                req.query.idVenta
            ]);

            if (result.length > 0) {

                let detalle = await conec.query(`SELECT 
                l.descripcion AS lote,
                md.codigo AS medida, 
                m.nombre AS manzana, 
                p.nombre AS proyecto,
                vd.precio,
                vd.cantidad,
                vd.idImpuesto,
                imp.nombre AS impuesto,
                imp.porcentaje
                FROM ventaDetalle AS vd 
                INNER JOIN lote AS l ON vd.idLote = l.idLote 
                INNER JOIN medida AS md ON md.idMedida = l.idMedida 
                INNER JOIN manzana AS m ON l.idManzana = m.idManzana 
                INNER JOIN proyecto AS p ON m.idProyecto = p.idProyecto
                INNER JOIN impuesto AS imp ON vd.idImpuesto  = imp.idImpuesto 
                WHERE vd.idVenta = ? `, [
                    req.query.idVenta
                ]);

                return sendSuccess(res, { "cabecera": result[0], "detalle": detalle });
            } else {
                return sendClient(res, "Datos no encontrados");
            }
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    /**
     * Metodo usado en el modulo facturación/créditos.
     * @param {*} req 
     * @param {*} res 
     * @returns object | string
     */
    async credito(req, res) {
        try {
            let lista = await conec.procedure(`CALL Listar_Creditos(?,?,?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                parseInt(req.query.todos),
                parseInt(req.query.cada),
                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ]);

            let newLista = []

            for (let value of lista) {
                let detalle = await conec.query(`SELECT 
                l.descripcion AS lote,
                m.nombre AS manzana
                FROM ventaDetalle AS vd 
                INNER JOIN lote AS l ON vd.idLote = l.idLote 
                INNER JOIN manzana AS m ON l.idManzana = m.idManzana 
                WHERE vd.idVenta = ? `, [
                    value.idVenta
                ]);

                newLista.push({
                    ...value,
                    detalle
                });
            }

            let resultLista = newLista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina),
                    frecuencia: item.credito === 0 ? "" : frecuenciaPago(item.frecuencia)
                }
            });

            let total = await conec.procedure(`CALL Listar_Creditos_Count(?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                parseInt(req.query.todos),
                parseInt(req.query.cada),
            ]);

            return sendSuccess(res, { "result": resultLista, "total": total[0].Total });
        } catch (error) {
            console.log(error);
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    /**
    * Metodo usado en el modulo facturación/ventas/detalle.
    * @param {*} req 
    * @returns object | string
    */
    async ventaCobro(req, res) {
        try {
            const result = await conec.procedure(`CALL Listar_Cobros_Detalle_ByIdVenta(?)`, [
                req.query.idVenta
            ]);

            return sendSuccess(res, result);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    /**
     * 
     */
    async cpesunat(req, res) {
        try {
            const lista = await conec.procedure(`CALL Listar_CpeSunat(?,?,?,?,?,?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                req.query.fechaInicio,
                req.query.fechaFinal,
                req.query.idComprobante,
                parseInt(req.query.idEstado),
                req.query.fill,
                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ]);

            const resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            const total = await conec.procedure(`CALL Listar_CpeSunat_Count(?,?,?,?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                req.query.fechaInicio,
                req.query.fechaFinal,
                req.query.idComprobante,
                parseInt(req.query.idEstado),
                req.query.fill,
            ]);

            const resultTotal = await total.map(item => item.Total).reduce((previousValue, currentValue) => previousValue + currentValue, 0);

            return sendSuccess(res, { "result": resultLista, "total": resultTotal });
        } catch (error) {
            console.log(error)
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async idReport(req) {
        try {

            let result = await conec.query(`SELECT
            v.idVenta, 
            com.nombre AS comprobante,
            com.codigo as codigoVenta,
            v.serie,
            v.numeracion,
            
            td.nombre AS tipoDoc,      
            td.codigo AS codigoCliente,      
            c.documento,
            c.informacion,
            c.direccion,
    
            DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha,
            v.hora, 
            v.tipo, 
            v.estado, 
            m.simbolo,
            m.codiso,
            m.nombre as moneda,

            IFNULL(SUM(vd.precio*vd.cantidad),0) AS monto
            FROM venta AS v 
            INNER JOIN cliente AS c ON v.idCliente = c.idCliente
            INNER JOIN tipoDocumento AS td ON td.idTipoDocumento = c.idTipoDocumento 
            INNER JOIN comprobante AS com ON v.idComprobante = com.idComprobante
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE v.idVenta = ?
            GROUP BY v.idVenta`, [
                req.query.idVenta
            ]);

            if (result.length > 0) {

                let detalle = await conec.query(`SELECT 
                l.descripcion AS lote,
                md.codigo AS medida, 
                m.nombre AS manzana, 
                p.nombre AS proyecto,
                vd.precio,
                vd.cantidad,
                vd.idImpuesto,
                imp.nombre as impuesto,
                imp.porcentaje
                FROM ventaDetalle AS vd 
                INNER JOIN lote AS l ON vd.idLote = l.idLote 
                INNER JOIN medida AS md ON md.idMedida = l.idMedida 
                INNER JOIN manzana AS m ON l.idManzana = m.idManzana 
                INNER JOIN proyecto AS p ON m.idProyecto = p.idProyecto
                INNER JOIN impuesto AS imp ON vd.idImpuesto  = imp.idImpuesto 
                WHERE vd.idVenta = ? `, [
                    req.query.idVenta
                ]);

                return { "cabecera": result[0], "detalle": detalle };
            } else {
                return "Datos no encontrados";
            }
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    /**
     * Metodo usado en el modulo facturación/créditos/proceso.
     * @param {*} req 
     * @param {*} res 
     * @returns object | string
     */
    async detalleCredito(req, res) {
        try {
            const venta = await conec.query(`
            SELECT 
            v.idVenta, 
            cl.idCliente,
            cl.documento, 
            cl.informacion, 
            cl.celular,
            cl.telefono,
            cl.email,
            cl.direccion,        
            cm.nombre, 
            v.serie, 
            v.numeracion, 
            v.numCuota, 
            (SELECT IFNULL(MIN(fecha),'') FROM plazo WHERE estado = 0) AS fechaPago,
            DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha, 
            v.hora, 
            v.estado,
            v.credito,
            v.frecuencia,
            m.idMoneda,
            m.codiso,
            IFNULL(SUM(vd.precio*vd.cantidad),0) AS total,
            (
                SELECT IFNULL(ROUND(SUM(cv.precio), 2),0) 
                FROM cobro AS c 
                LEFT JOIN notaCredito AS nc ON c.idCobro = nc.idCobro AND nc.estado = 1
                LEFT JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro 
                WHERE c.idProcedencia = v.idVenta AND c.estado = 1 AND nc.idNotaCredito IS NULL
            ) AS cobrado 
            FROM venta AS v 
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            INNER JOIN comprobante AS cm ON v.idComprobante = cm.idComprobante 
            INNER JOIN cliente AS cl ON v.idCliente = cl.idCliente 
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE  
            v.idVenta = ?
            GROUP BY v.idVenta
            `, [
                req.query.idVenta
            ]);

            const detalle = await conec.query(`SELECT 
            l.idLote,
            l.descripcion AS lote,
            md.idMedida,
            md.codigo AS medida, 
            m.nombre AS manzana, 
            p.nombre AS proyecto,
            vd.precio,
            vd.cantidad,
            vd.idImpuesto,
            imp.nombre as impuesto,
            imp.porcentaje
            FROM ventaDetalle AS vd 
            INNER JOIN lote AS l ON vd.idLote = l.idLote 
            INNER JOIN medida AS md ON md.idMedida = l.idMedida 
            INNER JOIN manzana AS m ON l.idManzana = m.idManzana 
            INNER JOIN proyecto AS p ON m.idProyecto = p.idProyecto
            INNER JOIN impuesto AS imp ON vd.idImpuesto  = imp.idImpuesto 
            WHERE vd.idVenta = ? `, [
                req.query.idVenta
            ]);

            const plazos = await conec.query(`SELECT 
            idPlazo,      
            cuota,  
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            monto,
            estado
            FROM plazo WHERE idVenta = ?
            `, [
                req.query.idVenta
            ]);

            const cobros = await conec.query(`SELECT c.idCobro 
            FROM cobro AS c 
            LEFT JOIN notaCredito AS nc ON nc.idCobro = c.idCobro AND nc.estado = 1
            WHERE c.idProcedencia = ? AND c.estado = 1 AND nc.idNotaCredito IS NULL`, [
                req.query.idVenta
            ]);

            let newPlazos = [];

            for (const item of plazos) {

                let newCobros = [];
                for (const cobro of cobros) {

                    const cobroPlazo = await conec.query(`SELECT 
                    cv.idPlazo,
                    cp.nombre,
                    c.serie,
                    c.numeracion,
                    DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
                    c.hora,
                    c.observacion,
                    bc.nombre as banco,
                    mo.codiso,
                    cv.precio
                    FROM cobro AS c 
                    INNER JOIN banco AS bc ON bc.idBanco = c.idBanco
                    INNER JOIN moneda AS mo ON mo.idMoneda = c.idMoneda
                    INNER JOIN comprobante AS cp ON cp.idComprobante = c.idComprobante
                    INNER JOIN cobroVenta AS cv ON cv.idCobro = c.idCobro
                    WHERE cv.idPlazo = ? AND cv.idVenta = ? AND c.idCobro = ?`, [
                        parseInt(item.idPlazo),
                        req.query.idVenta,
                        cobro.idCobro
                    ]);

                    if (cobroPlazo.length > 0) {
                        newCobros.push(cobroPlazo[0]);
                    }
                }
                newPlazos.push({
                    ...item,
                    "cobros": newCobros
                });
            }

            const inicial = await conec.query(`
            SELECT  
            co.nombre AS comprobante,
            c.serie,
            c.numeracion,
            bn.nombre AS banco,
            DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
            c.hora,
            c.observacion,
            mo.codiso,
            ROUND(sum(cv.precio), 2) AS monto
            FROM cobro AS c          
            INNER JOIN banco AS bn ON bn.idBanco = c.idBanco
            INNER JOIN moneda AS mo ON mo.idMoneda = c.idMoneda
            INNER JOIN comprobante AS co ON co.idComprobante = c.idComprobante
            INNER JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro AND cv.idPlazo = 0
            WHERE c.idProcedencia = ?
            GROUP BY c.idCobro`, [
                req.query.idVenta
            ]);

            return sendSuccess(res, {
                "venta": venta[0],
                "detalle": detalle,
                "plazos": newPlazos,
                "inicial": inicial
            });

        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async detalleCreditoReport(req, res) {
        try {
            const venta = await conec.query(`
            SELECT 
            v.idVenta, 
            cl.idCliente,
            cl.documento, 
            cl.informacion, 
            cl.celular,
            cl.telefono,
            cl.email,
            cl.direccion,        
            cm.nombre, 
            v.serie, 
            v.numeracion, 
            v.numCuota, 
            (SELECT IFNULL(MIN(fecha),'') FROM plazo WHERE estado = 0) AS fechaPago,
            DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha, 
            v.hora, 
            v.estado,
            v.credito,
            v.frecuencia,
            m.idMoneda,
            m.codiso,
            IFNULL(SUM(vd.precio*vd.cantidad),0) AS total,
            (
                SELECT IFNULL(ROUND(SUM(cv.precio), 2),0) 
                FROM cobro AS c 
                LEFT JOIN notaCredito AS nc ON c.idCobro = nc.idCobro AND nc.estado = 1
                LEFT JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro 
                WHERE c.idProcedencia = v.idVenta AND c.estado = 1 AND nc.idNotaCredito IS NULL
            ) AS cobrado 
            FROM venta AS v 
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            INNER JOIN comprobante AS cm ON v.idComprobante = cm.idComprobante 
            INNER JOIN cliente AS cl ON v.idCliente = cl.idCliente 
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE  
            v.idVenta = ?
            GROUP BY v.idVenta
            `, [
                req.query.idVenta
            ]);

            const detalle = await conec.query(`SELECT 
            l.descripcion AS lote,
            md.idMedida,
            md.codigo AS medida, 
            m.nombre AS manzana, 
            p.nombre AS proyecto,
            vd.precio,
            vd.cantidad,
            vd.idImpuesto,
            imp.nombre as impuesto,
            imp.porcentaje
            FROM ventaDetalle AS vd 
            INNER JOIN lote AS l ON vd.idLote = l.idLote 
            INNER JOIN medida AS md ON md.idMedida = l.idMedida 
            INNER JOIN manzana AS m ON l.idManzana = m.idManzana 
            INNER JOIN proyecto AS p ON m.idProyecto = p.idProyecto
            INNER JOIN impuesto AS imp ON vd.idImpuesto  = imp.idImpuesto 
            WHERE vd.idVenta = ? `, [
                req.query.idVenta
            ]);

            const plazos = await conec.query(`SELECT 
                p.idPlazo,        
                p.cuota,
                DATE_FORMAT(p.fecha,'%d/%m/%Y') as fecha,
                CASE 
                WHEN p.fecha < CURRENT_DATE then 1 
                WHEN YEAR(p.fecha) = YEAR(CURRENT_DATE) AND MONTH(p.fecha) = MONTH(CURRENT_DATE) AND v.frecuencia = 15 AND DAY(p.fecha) < 15 then 2
                WHEN YEAR(p.fecha) = YEAR(CURRENT_DATE) AND MONTH(p.fecha) = MONTH(CURRENT_DATE) AND v.frecuencia = 15 AND DAY(p.fecha) >= 15 then 1
    
                WHEN YEAR(p.fecha) = YEAR(CURRENT_DATE) AND MONTH(p.fecha) = MONTH(CURRENT_DATE) AND DAY(CURRENT_DATE) < DAY(p.fecha)   then 2
                WHEN YEAR(p.fecha) = YEAR(CURRENT_DATE) AND MONTH(p.fecha) = MONTH(CURRENT_DATE) AND DAY(CURRENT_DATE) >= DAY(p.fecha)  then 1
                ELSE 0 end AS vencido,
                p.monto,
                COALESCE(cv.precio,0) AS cobrado,
                p.estado
                FROM plazo AS p 
                INNER JOIN venta AS v ON p.idVenta = v.idVenta
                LEFT JOIN (
                    SELECT 
                        ROUND(SUM(cv.precio), 2) AS precio, c.idCobro, cv.idPlazo
                        FROM cobro AS c
                        LEFT JOIN notaCredito AS nc ON nc.idCobro = c.idCobro AND nc.estado = 1
                        INNER JOIN cobroVenta AS cv ON cv.idCobro = c.idCobro                    
                        AND c.estado = 1 AND nc.idNotaCredito IS NULL
                        GROUP BY cv.idPlazo
                ) AS cv ON cv.idPlazo = p.idPlazo  
                WHERE p.idVenta = ?`, [
                req.query.idVenta
            ]
            );

            const lotes = await conec.query(`SELECT
                l.descripcion AS lote,
                l.precio, 
                l.areaLote, 
                m.nombre AS manzana
                FROM venta AS v 
                INNER JOIN ventaDetalle AS vd ON v.idVenta = vd.idVenta
                INNER JOIN lote AS l ON vd.idLote = l.idLote
                INNER JOIN manzana AS m ON l.idManzana = m.idManzana
                WHERE v.idVenta = ?`, [
                req.query.idVenta
            ]);

            const cobrosEchos = await conec.procedure(`CALL Listar_Cobros_Detalle_ByIdVenta(?)`, [
                req.query.idVenta
            ]);

            const inicial = await conec.query(`
            SELECT  
            co.nombre AS comprobante,
            c.serie,
            c.numeracion,
            bn.nombre AS banco,
            DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
            c.hora,
            c.observacion,
            mo.codiso,
            ROUND(sum(cv.precio), 2) AS monto
            FROM cobro AS c          
            INNER JOIN banco AS bn ON bn.idBanco = c.idBanco
            INNER JOIN moneda AS mo ON mo.idMoneda = c.idMoneda
            INNER JOIN comprobante AS co ON co.idComprobante = c.idComprobante
            INNER JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro AND cv.idPlazo = 0
            WHERE c.idProcedencia = ?
            GROUP BY c.idCobro`, [
                req.query.idVenta
            ]);

            return {
                "venta": venta[0],
                "detalle": detalle,
                "plazos": plazos,
                "lotes": lotes,
                "cobros": cobrosEchos,
                "inicial": inicial
            };

        } catch (error) {
            console.error(error);
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    /**
     * Metodo usado para generar el pdf [services: factura]/repgeneralventas
     * @param {*} req 
     * @returns object | string
     */
    async detalleVenta(req) {
        try {
            let ventas = await conec.procedure(`CALL Listar_Ventas(?,?,?,?,?,?)`, [
                req.query.fechaIni,
                req.query.fechaFin,

                req.query.idComprobante,
                req.query.idCliente,
                req.query.idUsuario,
                req.query.tipoVenta,
            ]);

            return ventas;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }
}

module.exports = new Factura();