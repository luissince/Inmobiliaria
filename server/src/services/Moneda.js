const Conexion = require('../database/Conexion');
const { currentDate, currentTime } = require('../tools/Tools');
const { sendSuccess, sendClient, sendError } = require('../tools/Message');
const conec = new Conexion();

class Moneda {

    async list(req, res) {
        try {
            let lista = await conec.query(`SELECT idMoneda, nombre, codiso, simbolo, estado FROM moneda 
             WHERE 
             ? = 0
             OR
             ? = 1 and nombre like concat(?,'%')
             OR
             ? = 1 and codiso like concat(?,'%')
             LIMIT ?,?`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

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

            let total = await conec.query(`SELECT COUNT(*) AS Total 
            FROM moneda  
            WHERE 
            ? = 0
            OR
            ? = 1 and nombre like concat(?,'%')
            OR
            ? = 1 and codiso like concat(?,'%')`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.buscar,
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

            let result = await conec.execute(connection, 'SELECT idMoneda FROM moneda');
            let idMoneda = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idMoneda.replace("MN", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'MN000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'MN00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'MN0' + incremental;
                } else {
                    codigoGenerado = 'MN' + incremental;
                }

                idMoneda = codigoGenerado;
            } else {
                idMoneda = "MN0001";
            }

            await conec.execute(connection, `INSERT INTO moneda(
                idMoneda,
                nombre, 
                codiso, 
                simbolo,
                estado,
                predeterminado,
                fecha, 
                hora, 
                fupdate,
                hupdate,
                idUsuario) 
                values (?,?,?,?,?,?,?,?,?,?,?)`, [
                idMoneda,
                req.body.nombre,
                req.body.codiso,
                req.body.simbolo,
                req.body.estado,
                0,
                currentDate(),
                currentTime(),
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ])

            await conec.commit(connection);
            return sendSave(res, 'Datos insertados correctamente.');
        } catch (err) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async update(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            await conec.execute(connection, `UPDATE moneda SET 
            nombre=?, 
            codiso=?,
            simbolo=?, 
            estado=?,
            fecha=?,
            hora=?,
            idUsuario=? 
            where idMoneda=?`, [
                req.body.nombre,
                req.body.codiso,
                req.body.simbolo,
                req.body.estado,
                currentDate(),
                currentTime(),
                req.body.idUsuario,
                req.body.idMoneda,
            ])

            await conec.commit(connection);
            return sendSave(res, 'Se actualizó correctamente los datos.');
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(error, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async id(req, res) {
        try {
            let result = await conec.query('SELECT * FROM moneda WHERE idMoneda = ?', [
                req.query.idMoneda,
            ]);

            if (result.length > 0) {
                return sendSuccess(res, result[0]);
            } else {
                return sendClient(res, "Datos no encontrados");
            }

        } catch (error) {
            return sendError(error, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async delete(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let banco = await conec.execute(connection, `SELECT * FROM banco WHERE idMoneda = ?`, [
                req.query.idMoneda
            ]);

            if (banco.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar la moneda ya que esta ligada a un banco.');
            }

            let cobro = await conec.execute(connection, `SELECT * FROM  cobro WHERE idMoneda = ?`, [
                req.query.idMoneda
            ]);

            if (cobro.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar la moneda ya que esta ligada a un cobro.');
            }

            let gasto = await conec.execute(connection, `SELECT * FROM  gasto WHERE idMoneda = ?`, [
                req.query.idMoneda
            ]);

            if (gasto.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar la moneda ya que esta ligada a un gasto.');
            }

            let venta = await conec.execute(connection, `SELECT * FROM venta WHERE idMoneda = ?`, [
                req.query.idMoneda
            ]);

            if (venta.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar la moneda ya que esta ligada a un venta.');
            }

            await conec.execute(connection, `DELETE FROM moneda WHERE idMoneda  = ?`, [
                req.query.idMoneda
            ]);

            await conec.commit(connection)
            return sendSave(res, 'Se eliminó correctamente la moneda.');
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async listcombo(req, res) {
        try {
            let result = await conec.query('SELECT idMoneda,nombre, simbolo, codiso, predeterminado FROM moneda WHERE estado = 1');
            return sendSuccess(res, result);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

}

module.exports = new Moneda();