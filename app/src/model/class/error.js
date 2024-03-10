import { RESPOSE, REQUEST, ERROR, CANCELED } from '../types/types';

class ErrorResponse {

    type = '';
    message = '';
    status = 400;

    constructor(error) {
        if (error.response) {
            this.type = RESPOSE;
            this.status = error.response.status;
            this.message = error.response.data;
        } else if (error.request) {
            this.type = REQUEST;
            this.message = "No se pudo obtener la respuesta del servidor.";
        } else {
            if (error.message === "canceled") {
                this.type = CANCELED;
                this.message = "Se canceló la solicitud la servidor";
            } else {
                this.type = ERROR;
                this.message = error.message ? error.message : "Algo salió mal, intente en un par de minutos.";
            }
        }
    }

    getMessage() {
        return this.message;
    }

    getType() {
        return this.type;
    }

    getStatus() {
        return this.status;
    }
}

export default ErrorResponse;