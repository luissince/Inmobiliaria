const Conexion = require('../database/Conexion');
const { sendSuccess, sendError, sendClient, sendSave } = require('../tools/Message');
const { currentDate, currentTime } = require('../tools/Tools');
const conec = new Conexion();

class Lote {

    async list(req) {
        try {
            const lista = await conec.query(`SELECT 
                l.idLote,
                l.descripcion,
                m.nombre as manzana,
                l.precio,
                l.estado,
                l.medidaFrontal,
                l.costadoDerecho,
                l.costadoIzquierdo,
                l.medidaFondo,
                l.areaLote
                FROM lote AS l INNER JOIN manzana AS m 
                ON l.idManzana = m.idManzana 
                WHERE
                ? = 0 AND m.idProyecto = ?
                OR
                ? = 1 AND m.idProyecto = ? AND l.descripcion LIKE CONCAT(?,'%') AND m.nombre LIKE CONCAT('%', ?,'%')
                OR
                ? = 1 AND m.idProyecto = ? AND m.nombre LIKE CONCAT(?,'%') AND m.nombre LIKE CONCAT('%', ?,'%')

                LIMIT ?,?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                req.query.manzana,

                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
                req.query.manzana,

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
                FROM lote AS l INNER JOIN manzana AS m 
                ON l.idManzana = m.idManzana 
                WHERE
                ? = 0 AND m.idProyecto = ?
                OR
                ? = 1 AND m.idProyecto = ? AND l.descripcion LIKE CONCAT(?,'%')
                OR
                ? = 1 AND m.idProyecto = ? AND m.nombre LIKE CONCAT(?,'%')`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
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

            if (req.body.estado === '3') {
                await conec.rollback(connection);
                return "No se puede usar el estado vendido al insertar un lote, cambie los datos e intente nuevamente.";
            }

            let result = await conec.execute(connection, 'SELECT idLote FROM lote');
            let idLote = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idLote.replace("LT", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'LT000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'LT00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'LT0' + incremental;
                } else {
                    codigoGenerado = 'LT' + incremental;
                }

                idLote = codigoGenerado;
            } else {
                idLote = "LT0001";
            }

            await conec.execute(connection, `INSERT INTO lote(
                idLote, 
                idManzana,
                idConcepto,
                descripcion,
                costo,
                precio,
                idMedida,
                estado,
                medidaFrontal,
                costadoDerecho,
                costadoIzquierdo,
                medidaFondo,
                areaLote,
                numeroPartida,
                limiteFrontal,
                limiteDerecho,
                limiteIzquierdo,
                limitePosterior,
                ubicacionLote,
                fecha,
                hora,
                fupdate,
                hupdate,
                idUsuario
                ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)        
                `, [
                idLote,
                req.body.idManzana,
                req.body.idConcepto,
                req.body.descripcion,
                req.body.costo,
                req.body.precio,
                req.body.idMedida,
                req.body.estado,
                req.body.medidaFrontal,
                req.body.costadoDerecho,
                req.body.costadoIzquierdo,
                req.body.medidaFondo,
                req.body.areaLote,
                req.body.numeroPartida,
                req.body.limiteFrontal,
                req.body.limiteDerecho,
                req.body.limiteIzquierdo,
                req.body.limitePosterior,
                req.body.ubicacionLote,
                currentDate(),
                currentTime(),
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ])

            await conec.commit(connection);
            return "insert";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async socio(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();
            const asociados = await conec.query(`SELECT * FROM asociado 
                WHERE idCliente = ?`, [
                req.body.idCliente
            ]);

            if (asociados.length != 0) {
                await conec.rollback(connection);
                return "cliente";
            }

            await conec.execute(connection, `UPDATE asociado SET estado = 0 
                WHERE idVenta = ?`, [
                req.body.idVenta
            ]);

            await conec.execute(connection, `INSERT INTO asociado(
                idVenta ,
                idCliente,
                estado,
                fecha,
                hora,
                idUsuario) 
                VALUES(?,?,?,?,?,?)`, [
                req.body.idVenta,
                req.body.idCliente,
                1,
                currentDate(),
                currentTime(),
                req.body.idUsuario
            ]);


            // await conec.execute(connection, `DELETE FROM asociado WHERE idVenta = ? AND idCliente = ?`, [
            //     req.query.idVenta,
            //     req.query.idClienteOld,
            // ]);

            let result = await conec.execute(connection, 'SELECT idTraspado FROM traspaso');
            let idTraspado = "";
            if (result.length != 0) {
                let quitarValor = result.map(function (item) {
                    return parseInt(item.idTraspado.replace("TR", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'TR000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'TR00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'TR0' + incremental;
                } else {
                    codigoGenerado = 'TR' + incremental;
                }

                idTraspado = codigoGenerado;
            } else {
                idTraspado = "TR0001";
            }

            await conec.execute(connection, `INSERT INTO traspaso(
                idTraspado,
                idVenta,
                idClienteNuevo,
                idClienteAntiguo,
                fecha,
                hora,
                idUsuario) 
                VALUES(?,?,?,?,?,?,?)`, [
                idTraspado,
                req.body.idVenta,
                req.body.idCliente,
                req.body.idClienteOld,
                currentDate(),
                currentTime(),
                req.body.idUsuario
            ]);

            const alta = await conec.execute(connection, `SELECT * FROM alta
                WHERE idCliente = ?`, [
                req.body.idCliente
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

            await conec.execute(connection, `UPDATE venta 
                SET idCliente = ?
                WHERE idVenta = ?`, [
                req.body.idCliente,
                req.body.idVenta
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
                idTraspado,
                `TRASPASO`,
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

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async restablecer(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            await conec.execute(connection, `UPDATE asociado SET estado = 0 
            WHERE idVenta = ?`, [
                req.body.idVenta
            ]);

            await conec.execute(connection, `UPDATE asociado 
            SET estado = 1 
            WHERE idVenta = ? AND idCliente = ?`, [
                req.body.idVenta,
                req.body.idCliente,
            ]);

            let result = await conec.execute(connection, 'SELECT idTraspado FROM traspaso');
            let idTraspado = "";
            if (result.length != 0) {
                let quitarValor = result.map(function (item) {
                    return parseInt(item.idTraspado.replace("TR", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'TR000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'TR00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'TR0' + incremental;
                } else {
                    codigoGenerado = 'TR' + incremental;
                }

                idTraspado = codigoGenerado;
            } else {
                idTraspado = "TR0001";
            }

            await conec.execute(connection, `INSERT INTO traspaso(
                idTraspado,
                idVenta,
                idClienteNuevo,
                idClienteAntiguo,
                fecha,
                hora,
                idUsuario) 
                VALUES(?,?,?,?,?,?,?)`, [
                idTraspado,
                req.body.idVenta,
                req.body.idCliente,
                req.body.idCliente,
                currentDate(),
                currentTime(),
                req.body.idUsuario
            ]);

            await conec.execute(connection, `UPDATE venta 
            SET idCliente = ?
            WHERE idVenta = ?`, [
                req.body.idCliente,
                req.body.idVenta
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
                idTraspado,
                `RESTABLECER TRASPADO`,
                currentDate(),
                currentTime(),
                req.body.idUsuario
            ]);

            await conec.commit(connection);
            return "insert";
        } catch (ex) {
            console.log(ex)
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }


    async liberar(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            await conec.execute(connection, `UPDATE lote SET estado = 1 
            WHERE idLote = ?`, [
                req.body.idLote
            ]);

            await conec.execute(connection, `UPDATE venta SET estado = 4 
            WHERE idVenta = ?`, [
                req.body.idVenta
            ]);

            await conec.commit(connection);
            return sendSuccess(res, "El proceso se liberación del lote se completo correctamente.");
        } catch (error) {
            console.log(error)
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async id(req) {
        try {
            let result = await conec.query('SELECT * FROM lote WHERE idLote = ?', [
                req.query.idLote,
            ]);

            if (result.length > 0) {
                return result[0]
            } else {
                return "Datos no encontrados";
            }

        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async update(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let lote = await conec.execute(connection, `SELECT estado FROM lote
            WHERE idLote = ? `, [
                req.body.idLote
            ]);

            if (lote.length === 0) {
                await conec.rollback(connection);
                return "noid";
            }

            if (lote[0].estado === 3) {
                await conec.execute(connection, `UPDATE lote SET        
                    descripcion = ?,
                    idMedida = ?,
                    medidaFrontal =?,
                    costadoDerecho = ?,
                    costadoIzquierdo = ?,
                    medidaFondo = ?,
                    areaLote = ?,
                    numeroPartida = ?,
                    limiteFrontal = ?,
                    limiteDerecho = ?,
                    limiteIzquierdo = ?,
                    limitePosterior = ?,
                    ubicacionLote = ?,
                    fupdate = ?,
                    hupdate = ?,
                    idUsuario = ?
                    WHERE idLote = ?
                    `, [
                    req.body.descripcion,
                    req.body.idMedida,
                    req.body.medidaFrontal,
                    req.body.costadoDerecho,
                    req.body.costadoIzquierdo,
                    req.body.medidaFondo,
                    req.body.areaLote,
                    req.body.numeroPartida,
                    req.body.limiteFrontal,
                    req.body.limiteDerecho,
                    req.body.limiteIzquierdo,
                    req.body.limitePosterior,
                    req.body.ubicacionLote,
                    currentDate(),
                    currentTime(),
                    req.body.idUsuario,
                    req.body.idLote
                ]);

                await conec.commit(connection);
                return "update";
            } else {
                await conec.execute(connection, `UPDATE lote SET        
                    idManzana = ?,
                    idConcepto = ?,
                    descripcion = ?,
                    costo = ?,
                    precio = ?,
                    idMedida = ?,
                    estado = ?,
                    medidaFrontal =?,
                    costadoDerecho = ?,
                    costadoIzquierdo = ?,
                    medidaFondo = ?,
                    areaLote = ?,
                    numeroPartida = ?,
                    limiteFrontal = ?,
                    limiteDerecho = ?,
                    limiteIzquierdo = ?,
                    limitePosterior = ?,
                    ubicacionLote = ?,
                    fupdate = ?,
                    hupdate = ?,
                    idUsuario = ?
                    WHERE idLote = ?
                    `, [
                    req.body.idManzana,
                    req.body.idConcepto,
                    req.body.descripcion,
                    req.body.costo,
                    req.body.precio,
                    req.body.idMedida,
                    req.body.estado,
                    req.body.medidaFrontal,
                    req.body.costadoDerecho,
                    req.body.costadoIzquierdo,
                    req.body.medidaFondo,
                    req.body.areaLote,
                    req.body.numeroPartida,
                    req.body.limiteFrontal,
                    req.body.limiteDerecho,
                    req.body.limiteIzquierdo,
                    req.body.limitePosterior,
                    req.body.ubicacionLote,
                    currentDate(),
                    currentTime(),
                    req.body.idUsuario,
                    req.body.idLote,
                ])

                await conec.commit(connection);
                return "update";
            }
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async delete(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let lote = await conec.execute(connection, `SELECT * FROM ventaDetalle WHERE idLote  = ?`, [
                req.query.idLote
            ]);

            if (lote.length > 0) {
                await conec.rollback(connection);
                return "No se puede eliminar el lote ya que esta ligado a una venta.";
            }

            await conec.execute(connection, `DELETE FROM lote WHERE idLote  = ?`, [
                req.query.idLote
            ]);

            await conec.commit(connection)
            return "delete";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async detalle(req) {
        try {

            const cabecera = await conec.query(`SELECT 
                l.idLote,
                m.nombre as manzana,
                l.descripcion as lote,
                l.costo,
                l.precio,
                CASE
                WHEN l.estado = 1 THEN 'Disponible'
                WHEN l.estado = 2 THEN 'Reservado'
                WHEN l.estado = 3 THEN 'Vendido'
                ELSE 'Inactivo' END AS lotestado,

                l.medidaFrontal,
                l.costadoDerecho,
                l.costadoIzquierdo,
                l.medidaFondo,
                l.areaLote,
                l.numeroPartida,

                IFNULL(l.limiteFrontal,'') AS limiteFrontal,
                IFNULL(l.limiteDerecho,'') AS limiteDerecho,
                IFNULL(l.limiteIzquierdo,'') AS limiteIzquierdo,
                IFNULL(l.limitePosterior,'') AS limitePosterior,
                IFNULL(l.ubicacionLote,'') AS ubicacionLote

                FROM lote AS l
                INNER JOIN manzana AS m  ON l.idManzana = m.idManzana
                WHERE l.idLote = ?`, [
                req.query.idLote,
            ]);

            const venta = await conec.query(`SELECT 
            v.idVenta,
            v.idCliente
            FROM venta AS v 
            INNER JOIN ventaDetalle AS vd ON v.idVenta = vd.idVenta
            WHERE vd.idLote = ? AND v.estado IN (1,2)`, [
                req.query.idLote,
            ])

            if (venta.length > 0) {
                const socios = await conec.query(`SELECT 
                    c.idCliente ,
                    c.documento,
                    c.informacion,
                    a.estado
                    FROM asociado AS a
                    INNER JOIN cliente AS c ON a.idCliente = c.idCliente
                    WHERE a.idVenta = ?`, [
                    venta[0].idVenta
                ]);

                const detalle = await conec.query(`SELECT 
                    c.idCobro,
                    co.nombre as comprobante,
                    c.serie,
                    c.numeracion,
                    cl.documento,
                    cl.informacion,
                    CASE 
                    WHEN cn.idConcepto IS NOT NULL THEN cn.nombre
                    ELSE CASE WHEN cv.idPlazo = 0 THEN 'CUOTA INICIAL' ELSE 'CUOTA' END END AS detalle,
                    IFNULL(CONCAT(cp.nombre,' ',v.serie,'-',v.numeracion),'') AS comprobanteRef,
                    m.simbolo,
                    m.codiso,
                    b.nombre as banco,  
                    c.observacion, 
                    DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
                    c.hora,
                    IFNULL(SUM(cd.precio*cd.cantidad),SUM(cv.precio)) AS monto
                    FROM cobro AS c
                    INNER JOIN cliente AS cl ON c.idCliente = cl.idCliente
                    INNER JOIN banco AS b ON c.idBanco = b.idBanco
                    INNER JOIN moneda AS m ON c.idMoneda = m.idMoneda 
                    INNER JOIN comprobante AS co ON co.idComprobante = c.idComprobante
                    LEFT JOIN cobroDetalle AS cd ON c.idCobro = cd.idCobro
                    LEFT JOIN concepto AS cn ON cd.idConcepto = cn.idConcepto 
                    LEFT JOIN cobroVenta AS cv ON cv.idCobro = c.idCobro 
                    LEFT JOIN venta AS v ON cv.idVenta = v.idVenta 
                    LEFT JOIN comprobante AS cp ON v.idComprobante = cp.idComprobante
                    LEFT JOIN notaCredito AS nc ON c.idCobro = nc.idCobro AND nc.estado = 1

                    WHERE 
                    c.idProcedencia = ? AND c.estado = 1 AND nc.idNotaCredito IS NULL
                    OR 
                    c.idProcedencia = ? AND c.estado = 1 AND nc.idNotaCredito IS NULL
                    GROUP BY c.idCobro`, [
                    venta[0].idVenta,
                    req.query.idLote,
                ]);

                return {
                    "lote": cabecera[0],
                    "venta": venta[0],
                    "socios": socios,
                    "detalle": detalle
                }
            } else {
                return "No hay información para mostrar.";
            }
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listarCombo(req) {
        try {
            let result = await conec.query(`SELECT 
            l.idLote, 
            l.descripcion AS nombreLote, 
            l.precio,
            m.nombre AS nombreManzana 
            FROM lote AS l INNER JOIN manzana AS m 
            ON l.idManzana = m.idManzana
            WHERE m.idProyecto = ? AND l.estado = 1`, [
                req.query.idProyecto
            ]);
            return result

        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listarFilter(req) {
        try {
            let result = await conec.query(`SELECT 
            l.idLote, 
            l.descripcion AS nombreLote, 
            l.precio,
            m.nombre AS nombreManzana 
            FROM lote AS l INNER JOIN manzana AS m 
            ON l.idManzana = m.idManzana
            WHERE 
            m.idProyecto = ? AND l.estado = 1 AND l.descripcion LIKE CONCAT(?,'%')
            OR
            m.idProyecto = ? AND l.estado = 1 AND m.nombre LIKE CONCAT(?,'%')`, [
                req.query.idProyecto,
                req.query.filtrar,

                req.query.idProyecto,
                req.query.filtrar,
            ]);
            return result

        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listarComboLoteCliente(req) {
        try {
            let result = await conec.query(`SELECT 
                v.idVenta, 
                l.descripcion AS lote, 
                m.nombre AS manzana
                FROM venta AS v
                INNER JOIN asociado AS a ON a.idVenta = v.idVenta
                INNER JOIN cliente AS c ON a.idCliente = c.idCliente
                INNER JOIN ventaDetalle AS vd ON v.idVenta = vd.idVenta
                INNER JOIN lote AS l ON l.idLote = vd.idLote
                INNER JOIN manzana AS m ON m.idManzana = l.idManzana
                WHERE c.idCliente = ? AND v.estado IN(1,2)`, [
                req.query.idCliente
            ]);
            return result;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listaEstadoLote(req) {
        try {

            const proyecto = await conec.query(`SELECT 
            nombre,
            ubicacion,
            area 
            FROM proyecto WHERE idProyecto = ?`, [
                req.query.idProyecto,
            ]);

            const lista = await conec.query(`SELECT 
                l.idLote,
                l.descripcion AS lote,
                m.nombre AS manzana,
                l.costo,
                l.precio,
                l.estado,
                l.medidaFrontal,
                l.costadoDerecho,
                l.costadoIzquierdo,
                l.medidaFondo,
                l.areaLote
                FROM lote AS l INNER JOIN manzana AS m 
                ON l.idManzana = m.idManzana 
                WHERE
                ? = 0 AND m.idProyecto = ?
                OR
                (? <> 0 AND l.estado = ? AND m.idProyecto = ?)`, [
                req.query.estadoLote,
                req.query.idProyecto,

                req.query.estadoLote,
                req.query.estadoLote,
                req.query.idProyecto,
            ])

            return { "proyecto": proyecto[0], "lista": lista };
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async cambiar(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            await conec.execute(connection, `UPDATE ventaDetalle 
            SET idLote = ?
            WHERE idLote = ?`, [
                req.body.idLoteDestino,
                req.body.idLoteOrigen
            ]);

            // await conec.execute(connection, `UPDATE cobro 
            // SET idProcedencia = ?
            // WHERE idProcedencia = ?`, [
            //     req.body.idLoteDestino,
            //     req.body.idLoteOrigen
            // ]);

            await conec.execute(connection, `UPDATE lote
            SET estado = 1
            WHERE idLote = ?`, [
                req.body.idLoteOrigen
            ]);

            await conec.execute(connection, `UPDATE lote
            SET estado = 3
            WHERE idLote = ?`, [
                req.body.idLoteDestino
            ]);

            await conec.commit(connection);
            return "update";
        } catch (error) {
            console.log(error)
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listardeudaslote(req) {
        try {
            const result = await conec.query(`SELECT 
            v.idVenta, 
            cl.idCliente,
            cl.documento, 
            cl.informacion, 
            lo.descripcion AS lote,
            ma.nombre AS manzana,
            cm.nombre AS comprobante, 
            v.serie, 
            v.numeracion, 
            (SELECT IFNULL(DATE_FORMAT(MIN(co.fecha),'%d/%m/%Y'),'') FROM cobro AS co WHERE co.idProcedencia = v.idVenta ) AS primerPago,
            (SELECT IFNULL(p.monto,0) FROM plazo AS p WHERE p.idVenta = v.idVenta LIMIT 1) AS cuotaMensual,
            (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.idVenta = v.idVenta) AS cuoTotal,
            (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) AS numCuota,
            CASE WHEN v.frecuencia = 30 THEN 'FIN DE MES' ELSE 'CADA QUINCENA' END AS frecuenciaName, 
            CASE 
            WHEN v.credito = 1 THEN DATE_ADD(v.fecha,interval v.frecuencia day)
            ELSE (SELECT IFNULL(MIN(p.fecha),'') FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) END AS fechaPago,
            v.fecha, 
            v.hora, 
            v.estado,
            v.credito,
            v.frecuencia,
            m.idMoneda,
            m.simbolo,
            IFNULL(SUM(vd.precio*vd.cantidad),0) AS total,
            (
             SELECT IFNULL(SUM(cv.precio),0) 
             FROM cobro AS c 
             LEFT JOIN notaCredito AS nc ON c.idCobro = nc.idCobro AND nc.estado = 1
             LEFT JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro 
             WHERE c.idProcedencia = v.idVenta AND c.estado = 1 AND nc.idNotaCredito IS NULL
            ) AS cobrado 
            FROM venta AS v 
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            INNER JOIN comprobante AS cm ON v.idComprobante = cm.idComprobante 
            INNER JOIN cliente AS cl ON v.idCliente = cl.idCliente 
            INNER JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            INNER JOIN lote AS lo ON vd.idLote = lo.idLote 
            INNER JOIN manzana AS ma ON lo.idManzana = ma.idManzana 
            WHERE  
            ? = 0 AND v.estado = 2 AND v.idProyecto = ? 
            OR
            ? = 1 AND v.estado = 2            
            GROUP BY v.idVenta
            ORDER BY v.fecha DESC, v.hora DESC`, [
                parseInt(req.query.porProyecto),
                req.query.idProyecto,

                parseInt(req.query.porProyecto),
            ]);

            return result;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

}

module.exports = Lote;