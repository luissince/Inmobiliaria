const Conexion = require('../database/Conexion');
const { currentDate, currentTime } = require('../tools/Tools');
const { sendSuccess, sendClient, sendError } = require('../tools/Message');
const conec = new Conexion();

class Impuesto {

    async list(req, res) {
        try {
            let lista = await conec.query(`SELECT 
            idImpuesto,
            nombre,
            porcentaje,
            codigo,
            estado,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha, 
            hora
            FROM impuesto
            WHERE 
            ? = 0
            OR
            ? = 1 and nombre like concat(?,'%')
            LIMIT ?,?`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ])

            let resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            let total = await conec.query(`SELECT COUNT(*) AS Total FROM impuesto
            WHERE 
            ? = 0
            OR
            ? = 1 and nombre like concat(?,'%')`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar
            ]);

            return sendSuccess(res, { "result": resultLista, "total": total[0].Total });
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async add(req, res) {
        let connection = null;
        try {

            connection = await conec.beginTransaction();

            let result = await conec.execute(connection, 'SELECT idImpuesto FROM impuesto');
            let idImpuesto = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idImpuesto.replace("IM", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'IM000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'IM00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'IM0' + incremental;
                } else {
                    codigoGenerado = 'IM' + incremental;
                }

                idImpuesto = codigoGenerado;
            } else {
                idImpuesto = "IM0001";
            }

            await conec.execute(connection, `INSERT INTO impuesto(
                idImpuesto, 
                nombre,
                porcentaje,
                codigo,
                estado,
                fecha,
                hora,
                fupdate,
                hupdate,
                idUsuario) 
                VALUES(?,?,?,?,?,?,?,?,?,?)`, [
                idImpuesto,
                req.body.nombre,
                req.body.porcentaje,
                req.body.codigo,
                req.body.estado,
                currentDate(),
                currentTime(),
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ])

            await conec.commit(connection);
            return sendSave(res, "Los datos se registraron correctamente.");
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async id(req, res) {
        try {
            let result = await conec.query('SELECT * FROM impuesto WHERE idImpuesto  = ?', [
                req.query.idImpuesto
            ]);

            if (result.length > 0) {
                return sendSuccess(res, result[0]);
            } else {
                return sendClient(res, "Datos no encontrados");
            }

        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async edit(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            await conec.execute(connection, `UPDATE impuesto 
            SET 
            nombre=?,
            porcentaje=?,
            codigo=?,
            estado=?,
            idUsuario=?
            WHERE idImpuesto=?`, [
                req.body.nombre,
                req.body.porcentaje,
                req.body.codigo,
                req.body.estado,
                req.body.idUsuario,
                req.body.idImpuesto
            ])

            await conec.commit(connection)
            return sendSave(res, 'Los datos se actualizarón correctamente.');
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(error, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async delete(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let cobroDetalle = await conec.execute(connection, `SELECT * FROM cobroDetalle WHERE idImpuesto = ?`, [
                req.query.idImpuesto
            ]);

            if (cobroDetalle.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el impuesto ya que esta ligada a un detalle de cobro.');
            }

            let gastoDetalle = await conec.execute(connection, `SELECT * FROM gastoDetalle WHERE idImpuesto = ?`, [
                req.query.idImpuesto
            ]);

            if (gastoDetalle.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el impuesto ya que esta ligada a un detalle de gasto.');
            }

            let ventaDetalle = await conec.execute(connection, `SELECT * FROM ventaDetalle WHERE idImpuesto = ?`, [
                req.query.idImpuesto
            ]);

            if (ventaDetalle.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el impuesto ya que esta ligada a un detalle de venta.');
            }

            await conec.execute(connection, `DELETE FROM impuesto WHERE idImpuesto   = ?`, [
                req.query.idImpuesto
            ]);

            await conec.commit(connection)
            return sendSave(res, 'Se eliminó correctamente el impuesto.');
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async listcombo(req, res) {
        try {
            let result = await conec.query('SELECT idImpuesto,nombre,porcentaje,preferida FROM impuesto');
            return sendSuccess(res, result);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }
}

module.exports = new Impuesto();