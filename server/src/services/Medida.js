const Conexion = require('../database/Conexion');
const { sendSuccess, sendError } = require('../tools/Message');
const conec = new Conexion();

class Medida {

    async listcombo(req, res) {
        try {
            let result = await conec.query(`SELECT idMedida,nombre,preferida FROM medida`);
            return sendSuccess(res, result);
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

}

module.exports = new Medida();