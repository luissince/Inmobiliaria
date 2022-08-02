const Conexion = require('../database/Conexion');
const { sendSuccess, sendError } = require('../tools/Message');
const conec = new Conexion();

class TipoDocumento {

    async listcombo(req, res) {
        try {
            let result = await conec.query(`SELECT idTipoDocumento, nombre FROM tipoDocumento`);
            return sendSuccess(res, result)
        } catch (error) {
            return sendError(res, "Se produjo un error de servidor, intente nuevamente.");
        }
    }

}

module.exports = new TipoDocumento();