const { currentDate, currentTime, frecuenciaPago } = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Factura {

    async list(req) {
        try {
            let lista = await conec.query(`SELECT 
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

            let resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            let total = await conec.query(`SELECT COUNT(*) AS Total 
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

            return { "result": resultLista, "total": total[0].Total }

        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async add(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let countLote = 0;

            for (let item of req.body.detalleVenta) {
                let lote = await conec.execute(connection, `SELECT idLote FROM lote 
                    WHERE idLote = ? AND estado = 3`, [
                    item.idDetalle
                ]);
                if (lote.length > 0) {
                    countLote++;
                }
            }

            if (countLote > 0) {
                conec.rollback(connection);
                return "Hay un lote que se esta tratando de vender, no se puede continuar ya que está asociado a una factura."
            }

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

            let montoTotal = 0;

            for (let item of req.body.detalleVenta) {
                await conec.execute(connection, `INSERT INTO ventaDetalle(
                    idVenta, 
                    idLote, 
                    precio, 
                    cantidad, 
                    idImpuesto)
                    VALUES(?,?,?,?,?)`, [
                    idVenta,
                    item.idDetalle,
                    parseFloat(item.precioContado),
                    item.cantidad,
                    item.idImpuesto,
                ]);

                await conec.execute(connection, `UPDATE lote SET estado = 3 WHERE idLote = ?`, [
                    item.idDetalle,
                ]);

                montoTotal += parseFloat(item.precioContado) * item.cantidad;
            }

            await conec.execute(connection, `INSERT asociado(idVenta ,idCliente , estado, fecha, hora, idUsuario) VALUES(?,?,?,?,?,?)`, [
                idVenta,
                req.body.idCliente,
                1,
                currentDate(),
                currentTime(),
                req.body.idUsuario
            ]);

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
                precio) 
                VALUES (?,?,?,?)`, [
                    idCobro,
                    idVenta,
                    0,
                    montoTotal
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

            } else if (req.body.selectTipoPago === 2) {

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
                        precio) 
                        VALUES (?,?,?,?)`, [
                        idCobro,
                        idVenta,
                        0,
                        req.body.inicial
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

                let inicioDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

                let cuotaMes = (montoTotal - req.body.inicial) / req.body.numCuota;

                let i = 0;
                let frecuenciaPago = req.body.frecuenciaPago;

                // while (inicioDate < ultimoDate) {                   
                while (i < req.body.numCuota) {
                    inicioDate.setMonth(inicioDate.getMonth() + 1);
                    let now = new Date();

                    if (frecuenciaPago > 15) {
                        now = new Date(inicioDate.getFullYear(), inicioDate.getMonth() + 1, 0);
                    } else {
                        now = new Date(inicioDate.getFullYear(), inicioDate.getMonth(), 15);
                    }

                    i++;

                    await conec.execute(connection, `INSERT INTO plazo(
                        idPlazo,
                        idVenta,
                        fecha,
                        hora,
                        monto,
                        estado) 
                        VALUES(?,?,?,?,?,?)`, [
                        idPlazo,
                        idVenta,
                        now.getFullYear() + "-" + ((now.getMonth() + 1) < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1)) + "-" + now.getDate(),
                        currentTime(),
                        cuotaMes,
                        0
                    ]);
                    idPlazo++;
                }

            } else {
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
                        precio) 
                        VALUES (?,?,?,?)`, [
                        idCobro,
                        idVenta,
                        0,
                        req.body.inicial
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
            return "insert";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async anular(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let venta = await conec.execute(connection, `SELECT 
            idVenta,
            serie,
            numeracion 
            FROM venta 
            WHERE idVenta = ? AND estado = 3`, [
                req.query.idVenta
            ]);
            if (venta.length !== 0) {
                await conec.rollback(connection);
                return "La venta ya se encuentra anulada."
            } else {
                let plazos = await conec.execute(connection, `SELECT * FROM
                    cobroVenta WHERE idVenta = ?`, [
                    req.query.idVenta
                ]);

                let validate = 0;

                for (let item of plazos) {
                    if (item.idPlazo !== 0) {
                        validate++;
                    }
                }

                if (validate > 0) {
                    await conec.rollback(connection);
                    return "No se puede eliminar la venta porque tiene cuotas asociadas."
                }

                await conec.execute(connection, `UPDATE venta SET estado = 3 
                    WHERE idVenta = ?`, [
                    req.query.idVenta
                ]);

                let cobro = await conec.execute(connection, `SELECT idCobro FROM cobro WHERE idProcedencia = ?`, [
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

                let lote = await conec.execute(connection, `SELECT vd.idLote FROM
                    venta AS v 
                    INNER JOIN ventaDetalle AS vd ON v.idVenta = vd.idVenta
                    WHERE v.idVenta  = ?`, [
                    req.query.idVenta
                ]);

                for (let item of lote) {
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

                let venta = await conec.execute(connection, `SELECT 
                idVenta,
                serie,
                numeracion 
                FROM venta 
                WHERE idVenta = ?`, [
                    req.query.idVenta
                ]);


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
                return "anulado";
            }
        } catch (error) {
            console.log(error);
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async id(req) {
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

    async credito(req) {
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

            return { "result": resultLista, "total": total[0].Total }
        } catch (error) {
            console.error(error);
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async detalleCredito(req) {
        try {
            let venta = await conec.query(`
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
            (SELECT IFNULL(SUM(cv.precio),0) FROM cobro AS c LEFT JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro WHERE c.idProcedencia = v.idVenta ) AS cobrado 
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

            let plazos = await conec.query(`SELECT 
            idPlazo,        
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            monto,
            estado
            FROM plazo WHERE idVenta = ?
            `, [
                req.query.idVenta
            ]);

            let cobros = await conec.query(`SELECT idCobro FROM
            cobro WHERE idProcedencia = ?`, [
                req.query.idVenta
            ]);

            let newPlazos = [];

            for (let item of plazos) {

                let newCobros = [];
                for (let cobro of cobros) {

                    let cobroPlazo = await conec.query(`SELECT 
                    cv.idPlazo,
                    cp.nombre,
                    c.serie,
                    c.numeracion,
                    DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
                    c.hora,
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

            let lotes = await conec.query(`SELECT
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
            ])

            let inicial = await conec.query(`SELECT 
                IFNULL( cv.precio, 0) AS inicial 
                FROM venta AS v 
                LEFT JOIN cobroVenta AS cv ON cv.idVenta = v.idVenta AND cv.idPlazo = 0
                WHERE v.idVenta = ?
                `, [req.query.idVenta])

            return { "venta": venta[0], "detalle": detalle, "plazos": newPlazos, "lotes": lotes, "inicial": inicial[0].inicial }

        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

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

    async cpesunat(req) {
        try {
            let lista = await conec.procedure(`CALL Listar_CpeSunat(?,?,?,?,?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                req.query.fechaInicio,
                req.query.fechaFinal,
                req.query.idComprobante,
                parseInt(req.query.idEstado),
                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ]);

            let resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            let total = await conec.procedure(`CALL Listar_CpeSunat_Count(?,?,?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                req.query.fechaInicio,
                req.query.fechaFinal,
                req.query.idComprobante,
                parseInt(req.query.idEstado),
            ]);

            return { "result": resultLista, "total": total[0].Total }
        } catch (error) {
            console.log(error);
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }
}

module.exports = Factura;