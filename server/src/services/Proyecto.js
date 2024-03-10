const {
    currentDate,
    currentTime,
    isDirectory,
    removeFile,
    writeFile,
    mkdir,
    chmod,
} = require('../tools/Tools');
const path = require("path");
const { sendSuccess, sendSave, sendClient, sendError } = require('../tools/Message');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Proyecto {

    async list(req, res) {
        try {
            const lista = await conec.query(`SELECT  
            p.idProyecto,
            p.nombre,
            p.ubicacion,
            p.area,
            p.idMoneda,
            p.preciometro,
            m.simbolo,
            p.estado
            FROM proyecto AS p INNER JOIN moneda AS m
            ON m.idMoneda = p.idMoneda 
            WHERE 
            ? = 0
            OR
            ? = 1 AND p.nombre LIKE concat(?,'%')
            LIMIT ?,?`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

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
            FROM proyecto AS p INNER JOIN moneda AS m
            ON m.idMoneda = p.idMoneda 
            WHERE 
            ? = 0
            OR
            ? = 1 AND p.nombre LIKE concat(?,'%')`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

            ]);

            return sendSuccess(res,{ "result": resultLista, "total": total[0].Total });
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async add(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let result = await conec.execute(connection, 'SELECT idProyecto FROM proyecto');
            let idProyecto = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idProyecto.replace("PR", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'PR000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'PR00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'PR0' + incremental;
                } else {
                    codigoGenerado = 'PR' + incremental;
                }

                idProyecto = codigoGenerado;
            } else {
                idProyecto = "PR0001";
            }

            let file = path.join(__dirname, '../', 'path/proyect');

            if (!isDirectory(file)) {
                mkdir(file);
                chmod(file);
            }

            let fileImage = "";
            if (req.body.imagen !== "") {
                let nameImage = `${Date.now() + idProyecto}.${req.body.extension}`;

                writeFile(path.join(file, nameImage), req.body.imagen);
                fileImage = nameImage;
            }

            await conec.execute(connection, `INSERT INTO proyecto (
                idProyecto,
                nombre, 
                idSede, 
                area,
                estado, 
                ubicacion,
                idUbigeo, 
                lnorte,
                leste, 
                lsur, 
                loeste, 
                idMoneda,
                tea, 
                preciometro, 
                costoxlote,
                numContratoCorrelativo, 
                numRecibocCorrelativo, 
                imagen,
                extension,
                ruta,
                fecha,
                hora,
                fupdate,
                hupdate,
                idUsuario) 
                values (?, ?,?,?,?, ?,?, ?,?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                idProyecto,
                //datos
                req.body.nombre,
                req.body.idSede,
                req.body.area,
                req.body.estado,
                //ubicacion
                req.body.ubicacion,
                req.body.idUbigeo,
                //limite
                req.body.lnorte,
                req.body.leste,
                req.body.lsur,
                req.body.loeste,
                //ajustes
                req.body.idMoneda,
                req.body.tea,
                req.body.preciometro,
                req.body.costoxlote,
                req.body.numContratoCorrelativo,
                req.body.numRecibocCorrelativo,
                //imagen
                req.body.imagen,
                req.body.extension,
                '',
                currentDate(),
                currentTime(),
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ])

            await conec.commit(connection);
            return sendSave(res, "Se registró correctamente el proyecto.");
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
            p.idProyecto,
            p.nombre,
            p.idSede,
            p.area,
            p.estado,
            p.ubicacion,

            p.idUbigeo,
            u.ubigeo,
            u.departamento,
            u.provincia,
            u.distrito,

            p.lnorte,
            p.leste,
            p.lsur,
            p.loeste,
            p.idMoneda,
            p.tea,
            p.preciometro,
            p.costoxlote,
            p.numContratoCorrelativo,
            p.numRecibocCorrelativo,
            p.ruta
            FROM proyecto AS p
            INNER JOIN ubigeo AS u ON u.idUbigeo = p.idUbigeo
            WHERE p.idProyecto = ?`, [
                req.query.idProyecto,
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

            let file = path.join(__dirname, '../', 'path/proyect');

            if (!isDirectory(file)) {
                mkdir(file);
                chmod(file);
            }

            let proyecto = await conec.execute(connection, `SELECT
            imagen,
            extension,
            ruta
            FROM proyecto
            WHERE idProyecto = ?`, [
                req.body.idProyecto
            ]);

            let fileImage = "";
            let extImage = "";
            let rutaImage = "";
            if (req.body.imagen !== "") {
                removeFile(path.join(file, proyecto[0].ruta));

                let nameImage = `${Date.now() + req.body.idProyecto}.${req.body.extension}`;
                writeFile(path.join(file, nameImage), req.body.imagen);
                fileImage = req.body.imagen;
                extImage = req.body.extension;
                rutaImage = nameImage;
            } else {
                fileImage = proyecto[0].imagen;
                extImage = proyecto[0].extension;
                rutaImage = proyecto[0].ruta;
            }

            await conec.execute(connection, `UPDATE proyecto SET
                nombre=?, 
                idSede=?,
                area=?,
                estado=?, 
                ubicacion=?,
                idUbigeo=?, 
                lnorte=?, 
                leste=?,
                lsur=?,
                loeste=?, 
                idMoneda=?,
                tea=?, 
                preciometro=?,
                costoxlote=?, 
                numContratoCorrelativo=?, 
                numRecibocCorrelativo=?,
                imagen=?,
                extension=?,
                ruta=?,
                fupdate=?,
                hupdate=?,
                idUsuario=?
                WHERE idProyecto=?`, [
                //datos
                req.body.nombre,
                req.body.idSede,
                req.body.area,
                req.body.estado,
                //ubicacion
                req.body.ubicacion,
                req.body.idUbigeo,
                //limite
                req.body.lnorte,
                req.body.leste,
                req.body.lsur,
                req.body.loeste,
                //ajustes
                req.body.idMoneda,
                req.body.tea,
                req.body.preciometro,
                req.body.costoxlote,
                req.body.numContratoCorrelativo,
                req.body.numRecibocCorrelativo,
                //imagen
                fileImage,
                extImage,
                rutaImage,
                currentDate(),
                currentTime(),
                req.body.idUsuario,
                req.body.idProyecto
            ]);

            await conec.commit(connection)
            return sendSave(res, 'Se actualizó correctamente el proyecto.');
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

            let proyecto = await conec.execute(connection, `SELECT ruta FROM proyecto WHERE idProyecto = ?`, [
                req.query.idProyecto
            ]);

            if (proyecto.length == 0) {
                await conec.rollback(connection);
                return sendClient(res, "El proyecto a eliminar no existe, recargue su pantalla.");
            }

            let manzana = await conec.execute(connection, `SELECT * FROM manzana WHERE idProyecto = ?`, [
                req.query.idProyecto
            ]);

            if (manzana.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el proyecto ya que esta ligada a una manzana.');
            }

            let cobro = await conec.execute(connection, `SELECT idCobro FROM cobro WHERE idProyecto = ?`, [
                req.query.idProyecto
            ]);

            if (cobro.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el proyecto ya que esta ligada a unos cobros.');
            }

            let gasto = await conec.execute(connection, `SELECT idGasto FROM gasto WHERE idProyecto = ?`, [
                req.query.idProyecto
            ]);

            if (gasto.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el proyecto ya que esta ligada a unos gastos.');
            }

            let venta = await conec.execute(connection, `SELECT idVenta  FROM venta WHERE idProyecto = ?`, [
                req.query.idProyecto
            ]);

            if (venta.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el proyecto ya que esta ligada a unas ventas.');
            }

            let file = path.join(__dirname, '../', 'path/proyect');
            removeFile(path.join(file, proyecto[0].ruta));

            await conec.execute(connection, `DELETE FROM proyecto WHERE idProyecto = ?`, [
                req.query.idProyecto
            ]);

            await conec.commit(connection);
            return sendSave(res, "Se eliminó correctamente el proyecto.");
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async inicio(req, res) {
        try {
            const result = await conec.query(`SELECT 
            p.idProyecto,
            p.nombre,
            p.ubicacion,
            p.area,
            m.codiso,
            m.nombre as moneda,
            m.simbolo,
            p.ruta,
            p.estado
            FROM proyecto AS p
            INNER JOIN moneda AS m ON m.idMoneda = p.idMoneda
            `);

            const proyectos = await Promise.all(result.map(async (proyecto) => {
                const lotes = await conec.query(`SELECT estado FROM 
                lote AS l INNER JOIN manzana AS m
                ON l.idManzana = m.idManzana
                WHERE m.idProyecto = ?`, [
                    proyecto.idProyecto
                ]);
                return await {
                    ...proyecto,
                    lotes
                }
            }))

            return sendSuccess(res, proyectos);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async combo(req, res){
        try{
            const proyectos = await conec.query(`SELECT idProyecto,nombre FROM proyecto`)
            return sendSuccess(res, proyectos);
        }catch(error){
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

}

module.exports = new Proyecto();