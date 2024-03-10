const { currentDate, currentTime } = require('../tools/Tools');
const { sendSuccess, sendClient, sendError } = require('../tools/Message');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Perfil {

    async list(req, res) {
        try {
            let lista = await conec.query(`SELECT 
            p.idPerfil,
            s.nombreSede as empresa,
            p.descripcion,
            DATE_FORMAT(p.fecha,'%d/%m/%Y') as fecha,
            p.hora
            FROM perfil AS p 
            INNER JOIN sede AS s ON s.idSede = p.idSede 
            WHERE 
            ? = 0
            OR
            ? = 1 and p.descripcion like concat(?,'%')
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

            let total = await conec.query(`SELECT COUNT(*) AS Total 
            FROM perfil AS p 
            INNER JOIN sede AS s ON s.idSede = p.idSede 
            WHERE 
            ? = 0
            OR
            ? = 1 and p.descripcion like concat(?,'%')`, [

                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar
            ]);

            return sendSuccess(res, { "result": resultLista, "total": total[0].Total })
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async add(req, res) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let result = await conec.execute(connection, 'SELECT idPerfil FROM perfil');
            let idPerfil = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idPerfil.replace("PF", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'PF000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'PF00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'PF0' + incremental;
                } else {
                    codigoGenerado = 'PF' + incremental;
                }

                idPerfil = codigoGenerado;
            } else {
                idPerfil = "PF0001";
            }

            await conec.execute(connection, `INSERT INTO perfil
            (
            idPerfil, 
            idSede, 
            descripcion,
            fecha,
            hora,
            fupdate,
            hupdate,
            idUsuario) 
            VALUES(?,?,?,?,?,?,?,?)`, [
                idPerfil,
                req.body.idSede,
                req.body.descripcion,
                currentDate(),
                currentTime(),
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ])

            let menus = await conec.execute(connection, `SELECT idMenu,nombre FROM menu`);
            for (let menu of menus) {
                await conec.execute(connection, `INSERT INTO permisoMenu(idPerfil ,idMenu ,estado)values(?,?,?)`, [
                    idPerfil,
                    menu.idMenu,
                    0
                ]);

                let submenus = await conec.execute(connection, `SELECT idSubMenu FROM subMenu WHERE idMenu = ?`, [
                    menu.idMenu
                ]);

                for (let submenu of submenus) {
                    await conec.execute(connection, `INSERT INTO permisoSubMenu(idPerfil ,idMenu , idSubMenu ,estado)values(?,?,?,?)`, [
                        idPerfil,
                        menu.idMenu,
                        submenu.idSubMenu,
                        0
                    ]);

                    let privilegios = await conec.execute(connection, `SELECT idPrivilegio, idSubMenu, idMenu FROM privilegio WHERE idSubMenu = ? AND idMenu=?`, [
                        submenu.idSubMenu,
                        menu.idMenu
                    ]);

                    for (let privilegio of privilegios) {
                        await conec.execute(connection, `INSERT INTO permisoPrivilegio(idPrivilegio, idSubMenu ,idMenu, idPerfil, estado) VALUES (?,?,?,?,?)`, [
                            privilegio.idPrivilegio,
                            privilegio.idSubMenu,
                            privilegio.idMenu,
                            idPerfil,
                            0
                        ])
                    }
                }
            }

            await conec.commit(connection);
            return sendSuccess(res, "Se registró correctamente el perfil.");
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async id(req, res) {
        try {
            let result = await conec.query('SELECT * FROM perfil WHERE idPerfil  = ?', [
                req.query.idPerfil,
            ]);

            if (result.length > 0) {
                return sendSuccess(res, result[0]);
            } else {
                return sendClient(res, "Datos incorrectos, intente nuevamente.");
            }
        } catch (error) {
            return sendError(res);
        }
    }

    async update(req, res) {
        let connection = null;
        try {

            connection = await conec.beginTransaction();
            await conec.execute(connection, `UPDATE perfil SET idSede=?, descripcion=?, fecha=?, hora=?, idUsuario=? 
            WHERE idPerfil=?`, [
                req.body.idSede,
                req.body.descripcion,
                currentDate(),
                currentTime(),
                req.body.idUsuario,
                req.body.idPerfil
            ])

            await conec.commit(connection)
            return sendSuccess(res, "Se actualizó correctamente el Perfil.");
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

            let usuario = await conec.execute(connection, `SELECT * FROM usuario WHERE idPerfil = ?`, [
                req.query.idPerfil
            ]);

            if (usuario.length > 0) {
                await conec.rollback(connection);
                return sendClient(res, 'No se puede eliminar el perfil ya que esta ligada a un usuario.');
            }

            await conec.execute(connection, `DELETE FROM perfil WHERE idPerfil  = ?`, [
                req.query.idPerfil
            ]);

            await conec.execute(connection, `DELETE FROM permisoMenu WHERE idPerfil  = ?`, [
                req.query.idPerfil
            ]);

            await conec.execute(connection, `DELETE FROM permisoSubMenu WHERE idPerfil  = ?`, [
                req.query.idPerfil
            ]);

            await conec.execute(connection, `DELETE FROM permisoPrivilegio WHERE idPerfil = ?`, [
                req.query.idPerfil
            ]);

            await conec.commit(connection);
            return sendSuccess(res, "Se eliminó correctamente el Perfil.");
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

    async listcombo(req, res) {
        try {
            let result = await conec.query('SELECT idPerfil,descripcion FROM perfil');
            return sendSuccess(res, result);
        } catch (error) { 
            console.log(error);
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }
}

module.exports = new Perfil();