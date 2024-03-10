const { currentDate, currentTime } = require('../tools/Tools');
const { sendSuccess, sendError, sendClient } = require('../tools/Message');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Comprobante {

    async list(req, res) {
        try {

            let lista = await conec.query(`SELECT 
                idComprobante,
                CASE
                WHEN tipo = 1 THEN 'Facturación'
                WHEN tipo = 2 THEN 'Venta Libre'
                WHEN tipo = 3 THEN 'Nota de Crédito'
                WHEN tipo = 4 THEN 'Nota de Debito'
                WHEN tipo = 5 THEN 'Comprobante de Ingreso'
                WHEN tipo = 6 THEN 'Comprobante de Egreso'
                WHEN tipo = 7 THEN 'Cotización'
                ELSE 'Guía de Remisión' END AS 'tipo',
                nombre,
                serie, 
                numeracion,
                impresion,
                estado, 
                preferida,
                DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
                hora
                FROM comprobante
                WHERE 
                ? = 0
                OR
                ? = 1 AND nombre LIKE CONCAT(?,'%')
                OR
                ? = 1 AND serie LIKE CONCAT(?,'%')
                OR
                ? = 1 AND numeracion LIKE CONCAT(?,'%')
                LIMIT ?,?`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ]);


            let resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina),
                };
            });

            let total = await conec.query(`SELECT COUNT(*) AS Total FROM comprobante
            WHERE 
            ? = 0
            OR
            ? = 1 AND nombre LIKE CONCAT(?,'%')
            OR
            ? = 1 AND serie LIKE CONCAT(?,'%')
            OR
            ? = 1 AND numeracion LIKE CONCAT(?,'%')`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.buscar,
            ]);

            return sendSuccess(res, { "result": resultLista, "total": total[0].Total })
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.")
        }
    }

    async add(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let result = await conec.execute(connection, 'SELECT idComprobante FROM comprobante');
            let idComprobante = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idComprobante.replace("CB", ''));
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

                idComprobante = codigoGenerado;
            } else {
                idComprobante = "CB0001";
            }

            await conec.execute(connection, `INSERT INTO comprobante(
            idComprobante,
            tipo,
            nombre,
            serie,
            numeracion,
            codigo,
            impresion,
            estado,
            preferida,
            numeroCampo,
            fecha,
            hora,
            fupdate,
            hupdate,
            idUsuario) 
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                idComprobante,
                req.body.tipo,
                req.body.nombre,
                req.body.serie,
                req.body.numeracion,
                req.body.codigo,
                req.body.impresion,
                req.body.estado,
                req.body.preferida,
                req.body.numeroCampo,
                currentDate(),
                currentTime(),
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ]);

            let comprobante = await conec.execute(connection, `SELECT * FROM comprobante WHERE tipo = ?`, [
                req.body.tipo,
            ]);

            if (comprobante.length === 0) {
                await conec.execute(connection, `UPDATE comprobante SET preferida = 1 WHERE idComprobante = ?`, [
                    idComprobante
                ]);
            }

            await conec.commit(connection);
            return sendSuccess(res, "Se inserto correctamente el comprobante.")
        } catch (error) {
            console.error(error)
            if (connection != null) {
                await conec.rollback(connection);
            }
            sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async id(req, res) {
        try {
            let result = await conec.query(`SELECT * FROM comprobante WHERE idComprobante = ?`, [
                req.query.idComprobante
            ]);
            if (result.length > 0) {
                return sendSuccess(res, result[0])
            } else {
                return sendClient(res, "Datos incorrectos, intente nuevamente.");
            }
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async edit(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let venta = await conec.execute(connection, `SELECT  * FROM venta WHERE idComprobante = ?`, [
                req.body.idComprobante
            ]);

            if (venta.length > 0) {
                await conec.execute(connection, `UPDATE comprobante SET 
                tipo = ?,
                nombre = ?,
                impresion = ?,
                codigo = ?,
                estado = ?,
                preferida = ?,
                numeroCampo = ?,
                fupdate = ?,
                hupdate = ?,
                idUsuario = ?
                WHERE idComprobante = ?`, [
                    req.body.tipo,
                    req.body.nombre,
                    req.body.impresion,
                    req.body.codigo,
                    req.body.estado,
                    req.body.preferida,
                    req.body.numeroCampo,
                    currentDate(),
                    currentTime(),
                    req.body.idUsuario,
                    req.body.idComprobante
                ]);

                await conec.commit(connection);
                sendSuccess(res, "Se actualizó correctamente el comprobante. !Hay campos que no se van editar ya que el comprobante esta ligado a un venta¡");
            } else {
                await conec.execute(connection, `UPDATE comprobante SET 
                tipo = ?,
                nombre = ?,
                serie = ?,
                numeracion = ?,
                impresion = ?,
                estado = ?,
                preferida = ?,
                numeroCampo = ?,
                fupdate = ?,
                hupdate = ?,
                idUsuario = ?
                WHERE idComprobante = ?`, [
                    req.body.tipo,
                    req.body.nombre,
                    req.body.serie,
                    req.body.numeracion,
                    req.body.impresion,
                    req.body.estado,
                    req.body.preferida,
                    req.body.numeroCampo,
                    currentDate(),
                    currentTime(),
                    req.body.idUsuario,
                    req.body.idComprobante
                ]);

                await conec.commit(connection);
                return sendSuccess(res, "Se actualizó correctamente el comprobante.");
            }
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async delete(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let venta = await conec.execute(connection, `SELECT * FROM venta WHERE idComprobante = ?`, [
                req.query.idComprobante
            ]);

            if (venta.length > 0) {
                await conec.rollback(connection);
                sendClient(res, 'No se puede eliminar el comprobante ya que esta ligada a un venta.');
            }

            await conec.execute(connection, `DELETE FROM comprobante WHERE idComprobante = ?`, [
                req.query.idComprobante
            ]);

            await conec.commit(connection)
            return sendSuccess(res, 'Se eliminó correctamente el comprobante.');
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async listcombo(req, res) {
        try {

            let estado = req.query.estado == undefined ? "" : req.query.estado;

            let result = await conec.query(`SELECT 
            idComprobante, 
            nombre, 
            serie,
            estado, 
            preferida,
            numeroCampo
            FROM comprobante
            WHERE 
            tipo = ? AND estado = 1 AND ? = ''
            OR
            tipo = ? AND ? = 'all'
            `, [
                req.query.tipo,
                estado,

                req.query.tipo,
                estado,
            ]);
            return sendSuccess(res, result);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.")
        }
    }

}

module.exports = new Comprobante();