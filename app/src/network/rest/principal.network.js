import axios from "axios";
import SuccessReponse from "../../model/class/response";
import ErrorResponse from "../../model/class/error";
import Resolve from "../../model/class/resolve";

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_END_POINT,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use((config) => {
  const data = JSON.parse(window.localStorage.getItem("login"));
  if (data !== null) {
    config.headers.Authorization = "Bearer " + data.token;
  }
  return config;
});

/**
 * @author Luis Alexander Lara Serna <https://github.com/luissince/>
 * @param {Object} Login - Objecto que almacen un usuario, password.
 * @param {AbortSignal} AbortSignal - Objeto que anula la petición de la consulta
 * @returns {SuccessReponse | ErrorResponse} SuccessReponse | ErrorResponse
 */
export async function loginApi(params, signal = null) {
  return await Resolve.create(
    instance.get("/api/login/createsession", {
      params: params,
      signal: signal,
    })
  );
}

/**
 * @method POST
 * @param {{}} params
 * @param {AbortController} signal
 * @returns SuccessReponse | Object
 */
export async function liberarTerreno(params, signal = null) {
  try {
    const response = await instance.post("/api/lote/liberar", params, {
      signal: signal,
    });
    return new SuccessReponse(response);
  } catch (ex) {
    return new ErrorResponse(ex);
  }
}

/**
 * @method GET
 * @param {AbortController} signal
 * @returns SuccessReponse | Object
 */
export async function listarComboCliente(signal = null) {
  try {
    const response = await instance.get("/api/cliente/listcombo", {
      signal: signal,
    });
    return new SuccessReponse(response);
  } catch (ex) {
    return new ErrorResponse(ex);
  }
}

/**
 * @method GET
 * @param {{}} params
 * @param {AbortController} signal
 * @returns SuccessReponse | Object
 */
export async function loteDetalle(params, signal = null) {
  try {
    const response = await instance.get("/api/lote/detalle", {
      signal: signal,
      params: params,
    });
    return new SuccessReponse(response);
  } catch (ex) {
    return new ErrorResponse(ex);
  }
}

/**
 * @method POST
 * @param {{}} params
 * @returns SuccessReponse | Object
 */
export async function loteSocio(params) {
  try {
    const response = await instance.post("/api/lote/socio", params);
    return new SuccessReponse(response);
  } catch (ex) {
    return new ErrorResponse(ex);
  }
}

/**
 * @method POST
 * @param {{}} params
 * @returns SuccessReponse | Object
 */
export async function loteRestablecer(params) {
  try {
    const response = await instance.post("/api/lote/restablecer", params);
    return new SuccessReponse(response);
  } catch (ex) {
    return new ErrorResponse(ex);
  }
}

/**
 * @method GET
 * @param {{}} SuccessReponse
 * @returns SuccesReponse | Object
 */
export async function empresaConfig() {
  try {
    const response = await instance.get("/api/empresa/config");
    return new SuccessReponse(response);
  } catch (ex) {
    return new ErrorResponse(ex);
  }
}

/**
 * @method GET
 * @param {{}} SuccessReponse
 * @returns SuccesReponse | Object
 */
export async function validToken() {
  try {
    const response = await instance.get("/api/login/validtoken");
    return new SuccessReponse(response);
  } catch (ex) {
    return new ErrorResponse(ex);
  }
}

/**
 *
 * @param {*} params
 * @param {*} signal
 * @returns
 */
export async function listarBancos(params, signal = null) {
  return await Resolve.create(
    instance.get("/api/banco/list", {
      signal: signal,
      params: params,
    })
  );
}

export async function listarManzana(params, signal = null) {
  return await Resolve.create(
    instance.get("/api/manzana/list", {
      signal: signal,
      params: params,
    })
  );
}

/**
 *
 * @param {*} params
 * @param {*} signal
 * @returns
 */
export async function trasladarManzana(params, signal = null) {
  return await Resolve.create(
    instance.get("/api/manzana/traslado", {
      signal: signal,
      params: params,
    })
  );
}

/**
 *
 * @param {*} signal
 * @returns
 */
export async function comboProyectos(signal = null) {
  return await Resolve.create(
    instance.get("/api/proyecto/combo", {
      signal: signal,
    })
  );
}
