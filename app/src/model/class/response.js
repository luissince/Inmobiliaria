
class SuccessReponse {

    data = "";

    headers = {};

    status = 200;

    statusText = "Ok";

    constructor(response){
        this.data = response.data;
        this.headers = response.headers;
        this.status = response.status;
        this.statusText = response.statusText
    }

}

export default SuccessReponse;