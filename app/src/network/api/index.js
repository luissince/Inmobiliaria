import axios from 'axios';


export function apiComprobanteListcombo(signal, params) {
    return axios.get("/api/comprobante/listcombo", {
        signal: signal,
        params: params
    });
}

export function apiFacturaId(signal, params) {
    return axios.get("/api/factura/id", {
        signal: signal,
        params: params
    });
}

export function apiVentaCobro(signal, params) {
    return axios.get("/api/factura/venta/cobro", {
        signal: signal,
        params: params
    });
}

export function apiFacturaCreditoDetalle(signal, params) {
    return axios.get("/api/factura/credito/detalle", {
        signal: signal,
        params: params
    });
}