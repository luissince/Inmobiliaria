import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
    makeid,
    numberFormat,
    formatMoney,
    timeForma24,
    spinnerLoading,
} from '../../../helper/Tools';
import { connect } from 'react-redux';

class ClienteDetalle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idCliente: '',
            tipoDocumento: '',
            documento: '',
            informacion: '',
            celular: '',
            telefono: '',
            email: '',
            direccion: '',

            venta: [],

            loading: true,
            msgLoading: 'Cargando datos...',
        }

        this.abortControllerView = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        const url = this.props.location.search;
        const idResult = new URLSearchParams(url).get("idCliente");
        if (idResult !== null) {
            this.loadDataId(idResult);
        } else {
            this.props.history.goBack();
        }
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    async loadDataId(id) {
        try {
            const result = await axios.get("/api/cliente/listventasasociadas", {
                signal: this.abortControllerView.signal,
                params: {
                    idCliente: id
                }
            });

            let cliente = result.data.cliente;

            await this.setStateAsync({
                idCliente: id,
                tipoDocumento: cliente.tipoDocumento,
                documento: cliente.documento,
                informacion: cliente.informacion,
                celular: cliente.celular,
                telefono: cliente.telefono,
                email: cliente.email,
                direccion: cliente.direccion,
                venta: result.data.venta,

                loading: false
            });

        } catch (error) {
            if (error.message !== "canceled") {
                this.props.history.goBack();
            }
        }
    }

    async onEventImprimir() {
        const data = {
            "idSede": "SD0001",
            "idCliente": this.state.idCliente,
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/cliente/repclientehistorial?" + params, "_blank");
    }

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        null
                }

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Cliente
                                <small className="text-secondary"> detalle</small>
                            </h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <button type="button" className="btn btn-light" onClick={() => this.onEventImprimir()}><i className="fa fa-print"></i> Imprimir</button>
                            {" "}
                            {/* <button type="button" className="btn btn-light"><i className="fa fa-edit"></i> Editar</button> */}
                            {" "}
                            {/* <button type="button" className="btn btn-light"><i className="fa fa-remove"></i> Eliminar</button> */}
                            {" "}
                            <button type="button" className="btn btn-light"><i className="fa fa-file-archive-o"></i> Adjuntar</button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <div className="table-responsive">
                                <table width="100%">
                                    <thead>
                                        <tr>
                                            <th className="table-secondary w-25 p-1 font-weight-normal ">N° de Documento</th>
                                            <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.tipoDocumento + " - " + this.state.documento}</th>
                                        </tr>
                                        <tr>
                                            <th className="table-secondary w-25 p-1 font-weight-normal ">Información</th>
                                            <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.informacion}</th>
                                        </tr>
                                        <tr>
                                            <th className="table-secondary w-25 p-1 font-weight-normal ">Celular</th>
                                            <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.celular}</th>
                                        </tr>
                                        <tr>
                                            <th className="table-secondary w-25 p-1 font-weight-normal ">Teléfono</th>
                                            <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.telefono}</th>
                                        </tr>
                                        <tr>
                                            <th className="table-secondary w-25 p-1 font-weight-normal ">Email</th>
                                            <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.email}</th>
                                        </tr>
                                        <tr>
                                            <th className="table-secondary w-25 p-1 font-weight-normal ">Dirección</th>
                                            <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.direccion}</th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <p className="lead">Historial</p>
                        <div className="form-group">
                            <div className="table-responsive">
                                <table className="table table-light">
                                    <thead>
                                        <tr className="table-active">
                                            <th>#</th>
                                            <th colSpan="2">Fecha</th>
                                            <th colSpan="2">Comprobante</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            this.state.venta.map((venta, index) => {
                                                return <React.Fragment key={makeid((index + 1))}>
                                                    <tr className="table-success">
                                                        <td>{(index + 1)}</td>
                                                        <td colSpan="2">{venta.fecha}{<br />}{timeForma24(venta.hora)}</td>
                                                        <td colSpan="2">{venta.comprobante}{<br />}{venta.serie + "-" + venta.numeracion}</td>
                                                        <td>{numberFormat(venta.total, venta.codiso)}</td>
                                                    </tr>
                                                    <tr><td colSpan="6" className="pb-0">Detalle</td></tr>
                                                    <tr>
                                                        <td className="pb-0">#</td>
                                                        <td className="pb-0">Descripción</td>
                                                        <td className="pb-0">Cantidad</td>
                                                        <td className="pb-0">Impuesto</td>
                                                        <td className="pb-0">Precio</td>
                                                        <td className="pb-0">Total</td>
                                                    </tr>
                                                    {
                                                        venta.detalle.map((detalle, index) => (
                                                            <tr key={index}>
                                                                <td>{index + 1}</td>
                                                                <td>{detalle.descripcion}{<br />}{<small>{detalle.manzana}</small>}{<br />}{<small>{detalle.proyecto}</small>}</td>
                                                                <td>{formatMoney(detalle.cantidad)}</td>
                                                                <td>{detalle.impuesto}</td>
                                                                <td>{numberFormat(detalle.precio, venta.codiso)}</td>
                                                                <td>{numberFormat(detalle.cantidad * detalle.precio, venta.codiso)}</td>
                                                            </tr>
                                                        ))
                                                    }
                                                </React.Fragment>
                                            })
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(ClienteDetalle);