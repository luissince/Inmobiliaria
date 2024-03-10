import SuccessReponse from "../../model/class/response";
import ErrorResponse from "../../model/class/error";

class Resolve {
  static async create(value) {
    try {
        const response = await value;
      return new SuccessReponse(response);
    } catch (ex) {
      return new ErrorResponse(ex);
    }
  }
}

export default Resolve;
