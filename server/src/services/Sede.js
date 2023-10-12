const Conexion = require('../database/Conexion');
const { sendSuccess, sendSave, sendClient, sendError } = require('../tools/Message');
const { currentDate, currentTime } = require('../tools/Tools');
const conec = new Conexion();

class Sede {

    async listar(req, res) {
        try {
            let lista = await conec.query(`SELECT 
                idSede, 
                nombreSede, 
                direccion, 
                celular, 
                telefono, 
                email, 
                web
                FROM sede 
                WHERE 
                ? = 0
                OR
                ? = 1 and nombreSede like concat(?,'%')
                LIMIT ?,?`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ]);

            let resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            let total = await conec.query(`SELECT COUNT(*) AS Total 
            FROM sede 
            WHERE
            ? = 0
            OR
            ? = 1 and nombreSede like concat(?,'%')`, [
                parseInt(req.query.opcion),

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

            let result = await conec.execute(connection, 'SELECT idSede FROM sede');
            let idSede = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idSede.replace("SD", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'SD000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'SD00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'SD0' + incremental;
                } else {
                    codigoGenerado = 'SD' + incremental;
                }

                idSede = codigoGenerado;
            } else {
                idSede = "SD0001";
            }

            await conec.execute(connection, `INSERT INTO sede (
            idSede,
            nombreSede,
            direccion,
            idUbigeo,

            celular,
            telefono,
            email,
            web,
            descripcion) 
            VALUES (?,?,?,?, ?,?,?,?,?)`, [
                idSede,
                req.body.nombreSede,
                req.body.direccion,
                req.body.idUbigeo,

                req.body.celular,
                req.body.telefono,
                req.body.email,
                req.body.web,
                req.body.descripcion
            ]);

            await conec.commit(connection);
            return sendSave(res, "Datos registrados correctamente.");
        } catch (err) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async id(req, res) {
        try {
            let result = await conec.query(`SELECT 
                s.idSede,
                s.nombreSede,
                s.direccion,
    
                s.idUbigeo,
                u.ubigeo,
                u.departamento,
                u.provincia,
                u.distrito,
    
                s.celular,
                s.telefono,
                s.email,
                s.web,
                s.descripcion
    
                FROM sede AS s
                INNER JOIN ubigeo AS u ON s.idUbigeo = u.idUbigeo
                WHERE s.idSede = ?`, [
                req.query.idSede,
            ]);

            if (result.length > 0) {
                return sendSuccess(res, result[0]);
            } else {
                return sendClient(res, "Datos no encontrados.");
            }
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async update(req, res) {
        let connection = null;
        try {

            connection = await conec.beginTransaction();
            await conec.execute(connection, `UPDATE sede SET 
            nombreSede=?,
            direccion=?,
            idUbigeo=?,

            celular=?,
            telefono=?,
            email=?,
            web=?,
            descripcion=?,

            fupdate=?,
            hupdate=?
            WHERE idSede = ?`, [
                req.body.nombreSede,
                req.body.direccion,
                req.body.idUbigeo,

                req.body.celular,
                req.body.telefono,
                req.body.email,
                req.body.web,
                req.body.descripcion,

                currentDate(),
                currentTime(),
                req.body.idSede
            ]);

            await conec.commit(connection);
            return sendSave(res, "Datos actualizados correctamente.");
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async listarCombo(req, res) {
        try {
            let result = await conec.query('SELECT idSede,nombreSede FROM sede');
            return sendSuccess(res, result);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    /**
     * Metodo usado para generar el pdf [services: cobro]/repcomprobantematricial
     * Metodo usado para generar el pdf [services: cobro]/repcomprobante
     * @param {*} req 
     * @returns object | string
     */
    async infoSedeReporte(req) {
        try {
            let sede = await conec.query(`SELECT 
                s.idSede, 
                s.nombreSede, 
                s.celular, 
                s.telefono, 
                s.email, 
                s.web,
                u.departamento,
                u.distrito
                FROM sede AS s 
                INNER JOIN ubigeo AS u ON s.idUbigeo  = u.idUbigeo 
                WHERE s.idSede = ?`, [
                req.query.idSede,
            ]);

            let empresa = await conec.query(`SELECT 
                idEmpresa,
                documento as ruc,
                razonSocial as nombreEmpresa,
                direccion,
                rutaLogo,
                rutaImage,
                usuarioEmail,
                claveEmail
                FROM empresa LIMIT 1`);

            let proyecto = await conec.query(`SELECT 
                idProyecto,
                nombre AS nombreProyecto
                FROM proyecto
                WHERE idProyecto = ?`, [
                    req.query.idProyecto,
                ]);

            let result = [...sede, ...empresa, ...proyecto];

            if (result.length > 1) {
                return {
                    ...result[0],
                    ...result[1],
                    ...result[2],
                };
            } else {
                return "Datos no encontrados";
            }
        } catch (error) {
            return 'Error interno de conexión, intente nuevamente.';
        }
    }
}

module.exports = new Sede(); 