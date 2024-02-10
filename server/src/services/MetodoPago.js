const Conexion = require('../database/Conexion');
const { currentDate, currentTime } = require('../tools/Tools');
const { sendSuccess, sendClient, sendError,sendSave } = require('../tools/Message');
const conec = new Conexion();

class MetodoPago {

    async list(req, res) {
        try {
            let lista = await conec.query(`SELECT 
            idMetodo,
            nombre,
            codigo,
            estado,
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha, 
            hora
            FROM metodoPago
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

            let total = await conec.query(`SELECT COUNT(*) AS Total FROM metodoPago
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

            let result = await conec.execute(connection, 'SELECT idMetodo FROM metodoPago');
            let idMetodo = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idMetodo.replace("MP", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'MP000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'MP00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'MP0' + incremental;
                } else {
                    codigoGenerado = 'MP' + incremental;
                }

                idMetodo = codigoGenerado;
            } else {
                idMetodo = "MP0001";
            }

            await conec.execute(connection, `INSERT INTO metodoPago(
                idMetodo, 
                nombre,
                codigo,
                estado,
                fecha,
                hora,
                fupdate,
                hupdate,
                idUsuario) 
                VALUES(?,?,?,?,?,?,?,?,?)`, [
                idMetodo,
                req.body.nombre,
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
            let result = await conec.query('SELECT * FROM metodoPago WHERE idMetodo  = ?', [
                req.query.idMetodo
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

    async codigo(req, res) {
        try {
            let result = await conec.query('SELECT max(codigo) as codigo FROM metodoPago');

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
        console.log(req)
        try {
            connection = await conec.beginTransaction();
            await conec.execute(connection, `UPDATE metodoPago 
            SET 
            nombre=?,
            codigo=?,
            estado=?,
            fupdate=?,
            hupdate=?,
            idUsuario=?
            WHERE idMetodo=?`, [
                req.body.nombre,
                req.body.codigo,
                req.body.estado,
                currentDate(),
                currentTime(),
                req.body.idUsuario,
                req.body.idMetodo
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

            let cobro = await conec.execute(connection, `SELECT * FROM cobro WHERE metodoPago = ?`, [
                req.query.codigo
            ]);

            if (cobro.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el metodo de pago ya que esta ligada a un cobro.');
            }

            let gastoDetalle = await conec.execute(connection, `SELECT * FROM gasto WHERE metodoPago = ?`, [
                req.query.codigo
            ]);

            if (gastoDetalle.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el metodo de pago ya que esta ligada a un gasto.');
            }

            await conec.execute(connection, `DELETE FROM metodoPago WHERE idMetodo = ?`, [
                req.query.idMetodo
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
            let result = await conec.query('SELECT idMetodo, nombre, codigo FROM metodoPago WHERE estado = 1');
            return sendSuccess(res, result);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

}

module.exports = new MetodoPago();