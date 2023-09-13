const { currentDate, currentTime } = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Cliente {
    /**
     * Metodo usado en el modulo facturación/clientes.
     * @param {*} req 
     * @returns object | string
     */
    async list(req) {
        try {
            const lista = await conec.query(`SELECT 
                c.idCliente ,
                a.idProyecto,
                td.nombre as tipodocumento,
                c.documento,
                c.informacion,
                c.celular,
                c.telefono,
                c.direccion,
                c.estado
                FROM cliente AS c
                INNER JOIN tipoDocumento AS td ON td.idTipoDocumento = c.idTipoDocumento
                INNER JOIN alta AS a ON a.idCliente = c.idCliente
                WHERE 
                ? = 0 AND (a.idProyecto = ? AND ? = 'any' OR ? = 'all')
                OR
                ? = 1 and c.documento like concat(?,'%') AND (a.idProyecto = ? AND ? = 'any' OR ? = 'all')
                OR
                ? = 1 and c.informacion like concat(?,'%') AND (a.idProyecto = ? AND ? = 'any' OR ? = 'all')
                ORDER BY c.fecha ASC, c.hora ASC
                LIMIT ?,?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.fill,
                req.query.fill,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,
                req.query.fill,
                req.query.fill,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,
                req.query.fill,
                req.query.fill,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ])

            let newLista = []

            for (const value of lista) {
                const detalle = await conec.query(`select 
                    l.descripcion,
                    m.nombre as manzana
                    from venta as v
                    inner join ventaDetalle as vd on vd.idVenta = v.idVenta
                    inner join lote as l on l.idLote = vd.idLote
                    inner join manzana as m on m.idManzana = l.idManzana
                    where v.idCliente = ? and v.idProyecto = ? AND v.estado in(1,2)`, [
                    value.idCliente,
                    value.idProyecto
                ]);

                newLista.push({
                    ...value,
                    detalle
                });
            }

            let resultLista = newLista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            const total = await conec.query(`SELECT COUNT(*) AS Total 
                FROM cliente AS c
                INNER JOIN tipoDocumento AS td ON td.idTipoDocumento = c.idTipoDocumento
                INNER JOIN alta AS a ON a.idCliente = c.idCliente
                WHERE 
                ? = 0 AND (a.idProyecto = ? AND ? = 'any' OR ? = 'all')
                OR
                ? = 1 and c.documento like concat(?,'%') AND (a.idProyecto = ? AND ? = 'any' OR ? = 'all')
                OR
                ? = 1 and c.informacion like concat(?,'%') AND (a.idProyecto = ? AND ? = 'any' OR ? = 'all')`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.fill,
                req.query.fill,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,
                req.query.fill,
                req.query.fill,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,
                req.query.fill,
                req.query.fill,
            ]);

            return { "result": resultLista, "total": total[0].Total };
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listsocios(req) {
        try {
            let lista = await conec.procedure(`CALL Listar_Socios(?,?,?,?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.fechaInicio,
                req.query.fechaFinal,
                req.query.idConcepto,
                req.query.idProyecto,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ]);

            let newLista = [];

            for (let value of lista) {
                let detalle = await conec.query(`SELECT 
                    l.descripcion,
                    m.nombre AS manzana
                    FROM venta AS v
                    INNER JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta
                    INNER JOIN lote AS l ON l.idLote = vd.idLote
                    INNER JOIN manzana AS m ON m.idManzana = l.idManzana
                    WHERE v.idVenta = ?`, [
                    value.idVenta
                ]);

                newLista.push({
                    ...value,
                    detalle
                });
            }

            const resultLista = newLista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            const total = await conec.procedure(`CALL Listar_Socios_Count(?,?,?,?,?,?)`, [
                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.fechaInicio,
                req.query.fechaFinal,
                req.query.idConcepto,
                req.query.idProyecto
            ]);

            return { "result": resultLista, "total": total[0].Total };
        } catch (error) {
            console.error(error);
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async add(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let validate = await conec.execute(connection, `SELECT * FROM cliente WHERE documento = ?`, [
                req.body.documento,
            ]);

            if (validate.length > 0) {
                await conec.rollback(connection);
                return `El número de documento a ingresar ya se encuentre registrado con los datos de ${validate[0].informacion}`;
            }

            let result = await conec.execute(connection, 'SELECT idCliente FROM cliente');
            let idCliente = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idCliente.replace("CL", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'CL000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'CL00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'CL0' + incremental;
                } else {
                    codigoGenerado = 'CL' + incremental;
                }

                idCliente = codigoGenerado;
            } else {
                idCliente = "CL0001";
            }

            await conec.execute(connection, `INSERT INTO cliente(
            idCliente, 
            idTipoDocumento,
            documento,
            informacion,
            celular,
            telefono,
            fechaNacimiento,
            email, 
            genero, 
            direccion,
            idUbigeo, 
            estadoCivil,
            estado, 
            observacion,
            fecha,
            hora,
            fupdate,
            hupdate,
            idUsuario)
            VALUES(?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                idCliente,
                req.body.idTipoDocumento,
                req.body.documento,
                req.body.informacion,
                req.body.celular,
                req.body.telefono,
                req.body.fechaNacimiento,
                req.body.email,
                req.body.genero,
                req.body.direccion,
                req.body.idUbigeo,
                req.body.estadoCivil,
                req.body.estado,
                req.body.observacion,
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

    async id(req) {
        try {
            let result = await conec.query(`SELECT 
            cl.idCliente,
            cl.idTipoDocumento,
            cl.documento,
            cl.informacion,
            cl.celular,
            cl.telefono, 
            DATE_FORMAT(cl.fechaNacimiento,'%Y-%m-%d') as fechaNacimiento,
            cl.email, 
            cl.genero,  
            cl.direccion,
            IFNULL(cl.idUbigeo,0) AS idUbigeo,
            IFNULL(u.ubigeo, '') AS ubigeo,
            IFNULL(u.departamento, '') AS departamento,
            IFNULL(u.provincia, '') AS provincia,
            IFNULL(u.distrito, '') AS distrito,
            cl.estadoCivil,
            cl.estado, 
            cl.observacion
            FROM cliente AS cl 
            LEFT JOIN ubigeo AS u ON u.idUbigeo = cl.idUbigeo
            WHERE 
            cl.idCliente = ?`, [
                req.query.idCliente,
            ]);

            if (result.length > 0) {
                return result[0];
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

            let validate = await conec.execute(connection, `SELECT * FROM cliente WHERE idCliente <> ? AND documento = ?`, [
                req.body.idCliente,
                req.body.documento,
            ]);

            if (validate.length > 0) {
                await conec.rollback(connection);
                return `El número de documento a ingresar ya se encuentre registrado con los datos de ${validate[0].informacion}`;
            }

            await conec.execute(connection, `UPDATE cliente SET
                idTipoDocumento=?, 
                documento=?,
                informacion=?, 
                celular=?,
                telefono=?,
                fechaNacimiento=?,
                email=?,
                genero=?, 
                direccion=?, 
                idUbigeo=?,
                estadoCivil=?, 
                estado=?,
                observacion=?,
                fupdate=?,
                hupdate=?,
                idUsuario=?
                WHERE idCliente=?`, [
                req.body.idTipoDocumento,
                req.body.documento,
                req.body.informacion,
                req.body.celular,
                req.body.telefono,
                req.body.fechaNacimiento,
                req.body.email,
                req.body.genero,
                req.body.direccion,
                req.body.idUbigeo,
                req.body.estadoCivil,
                req.body.estado,
                req.body.observacion,
                currentDate(),
                currentTime(),
                req.body.idUsuario,
                req.body.idCliente
            ]);

            // global.io.emit('message', `Cliente actualizado :D`);

            await conec.commit(connection)
            return "update";
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

            let cobro = await conec.execute(connection, `SELECT * FROM cobro WHERE idCliente = ?`, [
                req.query.idCliente
            ]);

            if (cobro.length > 0) {
                await conec.rollback(connection);
                return 'No se puede eliminar el cliente ya que esta ligada a un cobro.';
            }

            let gasto = await conec.execute(connection, `SELECT * FROM gasto WHERE idCliente = ?`, [
                req.query.idCliente
            ]);

            if (gasto.length > 0) {
                await conec.rollback(connection);
                return 'No se puede eliminar el cliente ya que esta ligada a un gasto.';
            }

            let venta = await conec.execute(connection, `SELECT * FROM venta WHERE idCliente = ?`, [
                req.query.idCliente
            ]);

            if (venta.length > 0) {
                await conec.rollback(connection);
                return 'No se puede eliminar el cliente ya que esta ligada a una venta.';
            }

            await conec.execute(connection, `DELETE FROM cliente WHERE idCliente  = ?`, [
                req.query.idCliente
            ]);

            await conec.commit(connection);
            return "delete";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listcombo(req) {
        try {
            let result = await conec.query('SELECT idCliente, documento, informacion FROM cliente');
            return result;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listsearch(req) {
        try {
            let result = await conec.query(`
            SELECT 
            idCliente, 
            documento, 
            informacion 
            FROM cliente
            WHERE 
            documento LIKE CONCAT('%',?,'%')
            OR 
            informacion LIKE CONCAT('%',?,'%')`, [
                req.query.filtrar,
                req.query.filtrar,
            ]);
            return result;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listadeudas(req) {
        try {
            const lista = await conec.query(`SELECT 
            v.idVenta, 
            cl.idCliente,
            cl.documento, 
            cl.informacion, 
            cm.nombre, 
            v.serie, 
            v.numeracion, 
            (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) AS numCuota,
            (SELECT IFNULL(p.monto,0) FROM plazo AS p WHERE p.idVenta = v.idVenta LIMIT 1) AS cuotaMensual,
            CASE 
            WHEN v.credito = 1 THEN DATE_ADD(v.fecha,interval v.frecuencia day)
            ELSE (SELECT IFNULL(MIN(p.fecha),'') FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) END AS fechaPago,
            v.fecha, 
            v.hora, 
            v.estado,
            v.credito,
            v.frecuencia,
            m.codiso,
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
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE  
            ? = 1 AND v.estado = 2 AND v.idProyecto = ?
            OR
            ? = 0 AND v.estado = 2 AND v.frecuencia = ? AND v.idProyecto = ?

            GROUP BY v.idVenta
            ORDER BY cl.informacion ASC`, [
                req.query.seleccionado,
                req.query.idProyecto,

                req.query.seleccionado,
                req.query.frecuencia,
                req.query.idProyecto
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

                const lote = detalle.map(item => {
                    return item.lote + "\n" + item.manzana
                });

                newLista.push({
                    ...value,
                    lote: lote.join(", ")
                });
            }

            return newLista;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listaClientesTotal(req) {
        try {

            if (req.query.idCliente !== "") {
                let lista = await conec.query(`SELECT c.idCliente, c.idTipoDocumento, 
                td.nombre AS nameDocument,
                c.documento,
                c.informacion,
                p.idProyecto,
                p.nombre AS nameProject,
                v.idVenta,                
                vd.idLote,
                l.descripcion as nameLote,
                m.nombre nameManzana,
                vd.precio,
                (SELECT IFNULL(p.monto,0) FROM plazo AS p WHERE p.idVenta = v.idVenta LIMIT 1) AS cuotaMensual,
                (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.idVenta = v.idVenta) AS cuoTotal,
                CASE WHEN v.frecuencia = 30 THEN 'FIN DE MES' ELSE 'CADA QUINCENA' END AS frecuenciaName
                from cliente AS c
                inner join venta as v on v.idCliente = c.idCliente
                INNER join ventadetalle AS vd on vd.idVenta = v.idVenta 
                inner join lote as l on l.idLote= vd.idLote
                inner join manzana as m on m.idManzana = l.idManzana
                INNER join proyecto as p on p.idProyecto = v.idProyecto
                INNER JOIN tipodocumento as td on td.idTipoDocumento = c.idTipoDocumento
                where v.idProyecto = ? AND c.idCliente = ?
                ORDER BY v.idVenta ASC`, [
                    req.query.idProyecto,
                    req.query.idCliente,
                ]);

                let newLista = []

                for (let value of lista) {
                    let detalle = await conec.query(`SELECT 
                    cl.idCliente,
                    c.idCobro, 
                    co.nombre as comprobante,
                    c.serie,
                    c.numeracion,
                    cl.documento,
                    cl.informacion,  
                    CASE 
                    WHEN cn.idConcepto IS NOT NULL THEN cn.nombre
                    ELSE 
                        CASE 
                            WHEN cv.idPlazo = 0 THEN 'CUOTA INICIAL' 
                            WHEN pl.cuota IS NOT NULL THEN CONCAT('CUOTA',' ',pl.cuota) 
                            ELSE '-'
                        END 
                    END AS detalle,    
                    IFNULL(v.idVenta,'') AS idVentaRef,
                    IFNULL(CONCAT(cp.nombre,' ',v.serie,'-',v.numeracion),'') AS comprobanteRef,
                    IFNULL(CONCAT(lo.descripcion,' - ',ma.nombre),'') AS loteRef, 
                    IFNULL(v.estado,0) AS estadoRef,
                    m.simbolo,
                    m.codiso,
                    b.nombre as banco,  
                    c.observacion, 
                    DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
                    c.hora,
                    c.estado,    
                    nc.idNotaCredito,    
                    IFNULL(SUM(cd.precio*cd.cantidad),SUM(cv.precio)) AS monto
                    FROM cobro AS c
                    INNER JOIN cliente AS cl ON c.idCliente = cl.idCliente
                    INNER JOIN banco AS b ON c.idBanco = b.idBanco
                    INNER JOIN moneda AS m ON c.idMoneda = m.idMoneda 
                    INNER JOIN comprobante AS co ON co.idComprobante = c.idComprobante
                    LEFT JOIN cobroDetalle AS cd ON c.idCobro = cd.idCobro
                    LEFT JOIN concepto AS cn ON cd.idConcepto = cn.idConcepto 
                    LEFT JOIN cobroVenta AS cv ON cv.idCobro = c.idCobro 
                    LEFT JOIN plazo AS pl ON pl.idPlazo = cv.idPlazo    
                    LEFT JOIN venta AS v ON c.idProcedencia = v.idVenta 
                    LEFT JOIN comprobante AS cp ON v.idComprobante = cp.idComprobante
                    LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
                    LEFT JOIN lote AS lo ON lo.idLote = vd.idLote
                    LEFT JOIN manzana AS ma ON ma.idManzana = lo.idManzana     
                    LEFT JOIN notaCredito AS nc ON nc.idCobro = c.idCobro AND nc.estado = 1
                    WHERE v.idVenta = ?    
                    GROUP BY c.idCobro
                    ORDER BY v.idVenta ASC`,[
                        value.idVenta
                    ]);

                    newLista.push({
                        ...value,
                        "detail": detalle
                    });
                }

                return newLista;
            } else {
                let lista = await conec.query(`SELECT c.idCliente, c.idTipoDocumento, 
                td.nombre AS nameDocument,
                c.documento,
                c.informacion,
                p.idProyecto,
                p.nombre AS nameProject,
                v.idVenta,                
                vd.idLote,
                l.descripcion as nameLote,
                m.nombre nameManzana,
                vd.precio,
                (SELECT IFNULL(p.monto,0) FROM plazo AS p WHERE p.idVenta = v.idVenta LIMIT 1) AS cuotaMensual,
                (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.idVenta = v.idVenta) AS cuoTotal,
                CASE WHEN v.frecuencia = 30 THEN 'FIN DE MES' ELSE 'CADA QUINCENA' END AS frecuenciaName
                from cliente AS c
                inner join venta as v on v.idCliente = c.idCliente
                INNER join ventadetalle AS vd on vd.idVenta = v.idVenta 
                inner join lote as l on l.idLote= vd.idLote
                inner join manzana as m on m.idManzana = l.idManzana
                INNER join proyecto as p on p.idProyecto = v.idProyecto
                INNER JOIN tipodocumento as td on td.idTipoDocumento = c.idTipoDocumento
                where v.idProyecto = ? AND c.fecha BETWEEN ? AND ?`, [
                    req.query.idProyecto,
                    req.query.fechaIni,
                    req.query.fechaFin
                ]);

                return lista;
            }
        } catch (error) {
            console.error(error);
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    /**
     * Metodo usado en el modulo facturación/clientes/detalle.
     * @param {*} req 
     * @returns object | string
     */
    async listventasasociadas(req) {
        try {
            const cliente = await conec.query(`select
                tp.nombre as tipoDocumento,
                c.documento,
                c.informacion,
                c.celular,
                c.telefono,
                c.email,
                c.direccion
                from 
                cliente as c 
                inner join tipoDocumento as tp on tp.idTipoDocumento = c.idTipoDocumento
                where c.idCliente = ?`, [
                req.query.idCliente,
            ]);

            if (cliente.length > 0) {
                const ventas = await conec.query(`select 
                    v.idVenta,
                    co.nombre as comprobante,
                    v.serie,
                    v.numeracion,
                    DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha, 
                    v.hora,
                    sum(vd.cantidad * vd.precio) as total
                    from venta as v
                    inner join ventaDetalle as vd on vd.idVenta = v.idVenta
                    inner join comprobante as co on co.idComprobante = v.idComprobante
                    where v.idCliente = ? and v.estado in (1,2)
                    group by v.idVenta
                    order by v.fecha desc, v.hora desc`, [
                    req.query.idCliente,
                ]);

                let newVentas = [];

                for (const venta of ventas) {
                    const detalle = await conec.query(`select 
                        l.descripcion,
                        m.nombre as manzana,
                        p.nombre as proyecto,
                        im.porcentaje,
                        im.nombre as impuesto,
                        vd.cantidad,
                        vd.precio
                        from ventaDetalle as vd
                        inner join impuesto as im on im.idImpuesto = vd.idImpuesto
                        inner join lote as l on l.idLote = vd.idLote
                        inner join manzana as m on m.idManzana = l.idManzana
                        inner join proyecto as p on p.idProyecto = m.idProyecto
                        where vd.idVenta = ?`, [
                        venta.idVenta
                    ]);

                    newVentas.push({
                        ...venta,
                        "detalle": detalle
                    });
                }

                return { "cliente": cliente[0], "venta": newVentas };
            } else {
                return "Datos no encontrados";
            }
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listcobrosasociados(req) {
        try {
            let detalle = await conec.query(`SELECT 
            c.idCobro,
            DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
            c.hora,
            com.nombre as comprobante,
            c.serie,
            c.numeracion,

            co.nombre as concepto,
            m.codiso,
            cd.precio,
            cd.cantidad

            FROM cobroDetalle AS cd 
            INNER JOIN cobro AS c ON cd.idCobro = c.idCobro
            INNER JOIN moneda AS m ON c.idMoneda = m.idMoneda
            INNER JOIN comprobante as com on com.idComprobante = c.idComprobante
            INNER JOIN cliente AS cl ON c.idCliente = cl.idCliente
            INNER JOIN concepto AS co ON cd.idConcepto = co.idConcepto
            WHERE cl.idCliente = ? AND co.idConcepto = ?
            ORDER BY c.fecha DESC, c.hora DESC`, [
                req.query.idCliente,
                req.query.idConcepto,
            ]);

            return detalle;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async updatealta(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            const venta = await conec.execute(connection, `SELECT * FROM venta WHERE idProyecto = ?`, [
                req.query.idProyecto
            ]);
            for (let value of venta) {
                const alta = await conec.execute(connection, `SELECT * FROM alta WHERE idCliente = ? AND idProyecto = ?`, [
                    value.idCliente,
                    value.idProyecto
                ]);
                if (alta.length == 0) {
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
                        idAlta,
                        idCliente,
                        idProyecto,
                        fecha,
                        hora,
                        idUsuario
                    ) VALUES(?,?,?,?,?,?)`, [
                        idAlta,
                        value.idCliente,
                        value.idProyecto,
                        currentDate(),
                        currentTime(),
                        'US0001'
                    ]);
                }
            }

            await conec.commit(connection);
            return "ok";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listarsociosporfecha(req) {
        try {

            const clientes = await conec.query(`SELECT 
                cl.idCliente,
                cl.documento,
                cl.informacion,
                cl.celular,
                cl.telefono,
                cl.email,
                v.serie,
                v.numeracion,
                DATE_FORMAT(v.fecha,'%d/%m/%Y') AS fecha,
                CASE WHEN v.frecuencia = 30 THEN 'CADA FIN DE MES'
                ELSE 'CADA QUINCENA DE CADA MES' END AS frecuencia, 
                lo.descripcion AS lote,
                ma.nombre AS manzana,
                mo.codiso,
                SUM(vd.cantidad * vd.precio) AS monto
                FROM venta AS v 
                INNER JOIN cliente AS cl ON cl.idCliente = v.idCliente
                INNER JOIN moneda AS mo ON mo.idMoneda = v.idMoneda
                INNER JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta
                INNER JOIN lote AS lo ON vd.idLote = lo.idLote
                INNER JOIN manzana AS ma ON ma.idManzana = lo.idManzana
                WHERE 
                YEAR(v.fecha) = ? AND v.idProyecto = ? AND ? = 0 AND v.estado IN (1,2)
                OR
                YEAR(v.fecha) = ? AND ? = 1 AND v.estado IN (1,2)
                GROUP BY v.idVenta`, [
                parseInt(req.query.yearPago),
                req.query.idProyecto,
                parseInt(req.query.porProyecto),

                parseInt(req.query.yearPago),
                parseInt(req.query.porProyecto),
            ]);

            let newClientes = [];

            for (const cliente of clientes) {
                if (!this.duplicate(newClientes, cliente.idCliente)) {
                    newClientes.push({
                        "idCliente": cliente.idCliente,
                        "documento": cliente.documento,
                        "informacion": cliente.informacion,
                        "celular": cliente.celular,
                        "telefono": cliente.telefono,
                        "email": cliente.email,
                        "detalle": []
                    });
                }
            }

            for (const cliente of newClientes) {
                let count = 0;
                for (const venta of clientes) {
                    if (venta.idCliente == cliente.idCliente) {
                        count++;
                        cliente.detalle.push({
                            "id": count,
                            "serie": venta.serie,
                            "numeracion": venta.numeracion,
                            "fecha": venta.fecha,
                            "frecuencia": venta.frecuencia,
                            "lote": venta.lote,
                            "manzana": venta.manzana,
                            "codiso": venta.codiso,
                            "monto": venta.monto,
                        });
                    }
                }
            }

            return newClientes;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    duplicate(clientes, idCliente) {
        let value = false;
        for (const item of clientes) {
            if (item.idCliente == idCliente) {
                value = true;
                break;
            }
        }
        return value;
    }

}


module.exports = Cliente;