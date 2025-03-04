import axios from 'axios';


export function apiComprobanteListcombo(signal, params) {
    return axios.get(import.meta.env.VITE_APP_END_POINT+"/api/comprobante/listcombo", {
        signal: signal,
        params: params
    });
}

export function apiFacturaId(signal, params) {
    return axios.get(import.meta.env.VITE_APP_END_POINT+"/api/factura/id", {
        signal: signal,
        params: params
    });
}

export function apiVentaCobro(signal, params) {
    return axios.get(import.meta.env.VITE_APP_END_POINT+"/api/factura/venta/cobro", {
        signal: signal,
        params: params
    });
}

export function apiFacturaCreditoDetalle(signal, params) {
    return axios.get(import.meta.env.VITE_APP_END_POINT+"/api/factura/credito/detalle", {
        signal: signal,
        params: params
    });
}