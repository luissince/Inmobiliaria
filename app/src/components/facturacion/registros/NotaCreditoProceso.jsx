import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    numberFormat,
    currentDate,
    calculateTaxBruto,
    calculateTax,
    ModalAlertInfo,
    ModalAlertDialog,
    ModalAlertSuccess,
    ModalAlertWarning,
    ModalAlertError,
} from '../../../helper/Tools';
import { apiComprobanteListcombo } from '../../../network/api';
import { connect } from 'react-redux';

class NotaCreditoProceso extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idComprobante: '',
            comprobantes: [],
            idMoneda: '',
            monedas: [],
            fecha: currentDate(),

            buscar: '',
            idMotivo: '',
            motivos: [],
            informacion: '',

            cabecera: {},
            detalle: [],

            idProyecto: this.props.token.project.idProyecto,
            idUsuario: this.props.token.userToken.idUsuario,

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',
        }
        this.refComprobante = React.createRef();
        this.refMoneda = React.createRef();
        this.refFecha = React.createRef();

        this.refBuscar = React.createRef();
        this.refMotivo = React.createRef();
        this.refInformacion = React.createRef();

        this.abortControllerView = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadData();
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    loadData = async () => {
        try {
            await this.setStateAsync({ loading: true, msgLoading: 'Cargando datos...', });

            const comprobante = await apiComprobanteListcombo(this.abortControllerView.signal,{
                "tipo": "3"
            });

            const moneda = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/moneda/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const motivo = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/motivo/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const comprobanteFilter = comprobante.data.filter(item => item.preferida === 1);

            await this.setStateAsync({
                comprobantes: comprobante.data,
                monedas: moneda.data,
                motivos: motivo.data,

                idComprobante: comprobanteFilter.length > 0 ? comprobanteFilter[0].idComprobante : '',
                loading: false
            });
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    async searchComprobante() {
        if (this.state.buscar === "") {
            await this.setStateAsync({ messageWarning: "Ingrese el comprobante a consultar." })
            this.refBuscar.current.focus();
            return;
        }

        try {
            await this.setStateAsync({
                idMoneda: '',
                fecha: currentDate(),

                idMotivo: '',
                informacion: '',

                cabecera: {},
                detalle: [],

                loading: true,
                msgLoading: 'Buscando comprobante...'
            });

            let result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/cobro/searchComprobante", {
                params: {
                    search: this.state.buscar
                }
            });

            await this.setStateAsync({
                idMoneda: result.data.cabecera.idMoneda,
                informacion: result.data.cabecera.informacion,

                cabecera: result.data.cabecera,
                detalle: result.data.detalle.length > 0 ? result.data.detalle : result.data.venta,

                loading: false
            });
        } catch (error) {
            if (error.response) {
                ModalAlertWarning("Nota de Crédito", error.response.data)
            } else {
                ModalAlertError("Nota de Crédito", "Se genero un error interno, intente nuevamente.")
            }

            await this.setStateAsync({
                loading: false
            });
        }
    }

    async onEventSaveNotaCredito() {
        if (this.state.idComprobante === "") {
            await this.setStateAsync({ messageWarning: "Seleccione la moneda." })
            this.refComprobante.current.focus();
            return;
        }

        if (this.state.idMoneda === "") {
            await this.setStateAsync({ messageWarning: "Seleccione la moneda." })
            this.refMoneda.current.focus();
            return;
        }

        if (this.state.idMotivo === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el motivo." })
            this.refMotivo.current.focus();
            return;
        }

        ModalAlertDialog("Nota de Crédito", "¿Estás seguro de continuar?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Nota de Crédito", "Procesando información...");

                    let result = await axios.post(import.meta.env.VITE_APP_END_POINT+'/api/notacredito/add', {
                        idComprobante: this.state.idComprobante,
                        idMoneda: this.state.idMoneda,
                        fecha: this.state.fecha,
                        idMotivo: this.state.idMotivo,
                        idCliente: this.state.cabecera.idCliente,
                        idCobro: this.state.cabecera.idCobro,
                        idProyecto: this.state.idProyecto,
                        idUsuario: this.state.idUsuario,
                        detalle: this.state.detalle
                    });

                    ModalAlertSuccess("Nota de Crédito", result.data, () => {
                        this.onEventLimpiar()
                    });
                }
                catch (error) {
                    if (error.response) {
                        ModalAlertWarning("Nota de Crédito", error.response.data)
                    } else {
                        ModalAlertWarning("Nota de Crédito", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        });
    }

    async onEventLimpiar() {
        await this.setStateAsync({
            idComprobante: '',
            comprobantes: [],
            idMoneda: '',
            monedas: [],
            fecha: currentDate(),

            buscar: '',
            idMotivo: '',
            motivos: [],
            informacion: '',

            cabecera: {},
            detalle: [],
        });

        this.loadData();
    }

    renderTotal() {
        let subTotal = 0;
        let impuestoTotal = 0;
        let total = 0;

        for (let item of this.state.detalle) {
            let cantidad = item.cantidad;
            let valor = item.precio;

            let impuesto = item.porcentaje;

            let valorActual = cantidad * valor;
            let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
            let valorImpuesto = calculateTax(impuesto, valorSubNeto);
            let valorNeto = valorSubNeto + valorImpuesto;

            subTotal += valorSubNeto;
            impuestoTotal += valorImpuesto;
            total += valorNeto;
        }

        return (
            <>
                <tr>
                    <td className="text-right">Sub Total:</td>
                    <td className="text-right">{numberFormat(subTotal, this.state.cabecera.codiso)}</td>
                </tr>
                <tr>
                    <td className="text-right">Impuesto:</td>
                    <td className="text-right">{numberFormat(impuestoTotal, this.state.cabecera.codiso)}</td>
                </tr>
                <tr className="border-bottom">
                </tr>
                <tr>
                    <td className="text-right h5">Total:</td>
                    <td className="text-right h5">{numberFormat(total, this.state.cabecera.codiso)}</td>
                </tr>
            </>
        )
    }

    render() {
        return (
            <>

                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> : null
                }

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Nota de Crédito <small className="text-secondary">REGISTRAR</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <button className="btn btn-success" onClick={() => this.onEventSaveNotaCredito()}>
                                <i className="fa fa-save"></i> Registrar
                            </button>
                            {" "}
                            <button className="btn btn-outline-secondary" onClick={() => this.onEventLimpiar()}>
                                <i className="fa fa-trash"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                {
                    this.state.messageWarning === '' ? null :
                        <div className="alert alert-warning" role="alert">
                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                        </div>
                }

                <div className="row">
                    <div className="col-md-4 col-sm-12 col-xs-12">
                        <label>Nota de Crédito</label>
                        <div className="form-group">
                            <select
                                className="form-control"
                                ref={this.refComprobante}
                                value={this.state.idComprobante}
                                onChange={(event) => this.setState({ idComprobante: event.target.value })} >
                                <option value="">- Seleccione -</option>
                                {
                                    this.state.comprobantes.map((item, index) => (
                                        <option key={index} value={item.idComprobante}>{item.nombre + " (" + item.serie + ")"}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    <div className="col-md-4 col-sm-12 col-xs-12">
                        <label>Moneda</label>
                        <div className="form-group">
                            <select className="form-control"
                                ref={this.refMoneda}
                                value={this.state.idMoneda}
                                onChange={(event) => this.setState({ idMoneda: event.target.value })} >
                                <option value="">- Seleccione -</option>
                                {
                                    this.state.monedas.map((item, index) => (
                                        <option key={index} value={item.idMoneda}>{item.nombre}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    <div className="col-md-4 col-sm-12 col-xs-12">
                        <label>Fecha de Registro</label>
                        <div className="form-group">
                            <input
                                type="date"
                                className="form-control"
                                placeholder="00/00/00000"
                                ref={this.refFecha}
                                value={this.state.fecha}
                                onChange={(event) => this.setState({ fecha: event.target.value })} />
                        </div>
                    </div>
                </div>

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h6>Documento a modificar</h6>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 col-sm-12 col-xs-12">
                        <label>Serie y Número del Comprobante(B001-1)</label>
                        <div className="form-group">
                            <div className="input-group">
                                <input
                                    title="Comprobante a Buscar"
                                    type="text"
                                    className="form-control"
                                    placeholder="B001-1, F001-1 ..."
                                    ref={this.refBuscar}
                                    value={this.state.buscar}
                                    onChange={async (event) => {
                                        if (event.target.value !== "") {
                                            await this.setStateAsync({ buscar: event.target.value, messageWarning: '' });
                                        } else {
                                            await this.setStateAsync({ buscar: event.target.value, messageWarning: 'Ingrese el comprobante a consultar.' });
                                        }
                                    }} />
                                <div className="input-group-append">
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        title="Buscar"
                                        onClick={() => this.searchComprobante()}>
                                        <i className="bi bi-search"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 col-sm-12 col-xs-12">
                        <label>Motivo</label>
                        <div className="form-group">
                            <select
                                className="form-control"
                                ref={this.refMotivo}
                                value={this.state.idMotivo}
                                onChange={async (event) => {
                                    if (event.target.value !== "") {
                                        await this.setStateAsync({ idMotivo: event.target.value, messageWarning: '' });
                                    } else {
                                        await this.setStateAsync({ idMotivo: event.target.value, messageWarning: 'Seleccione el motivo.' });
                                    }
                                }}>
                                <option value="">- Seleccione -</option>
                                {
                                    this.state.motivos.map((item, index) => (
                                        <option key={index} value={item.idMotivo}>{item.nombre}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    <div className="col-md-4 col-sm-12 col-xs-12">
                        <label>Información</label>
                        <div className="form-group">
                            <input
                                title="Cliente Asociado"
                                type="text"
                                className="form-control"
                                placeholder="Información del cliente"
                                ref={this.refInformacion}
                                value={this.state.informacion}
                                onChange={(event) => this.setState({ informacion: event.target.value })}
                                disabled
                            />
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="5%" className="text-center">#</th>
                                        <th width="20%">Detalle</th>
                                        <th width="15%">Unidad</th>
                                        <th width="15%">Cantidad</th>
                                        <th width="15%">Precio Unit.</th>
                                        <th width="15%">Importe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.detalle.length === 0 ?
                                            <tr className="text-center">
                                                <td colSpan="6">Agregar datos a la tabla</td>
                                            </tr>
                                            :
                                            this.state.detalle.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="text-center">{++index}</td>
                                                    <td>{item.concepto}</td>
                                                    <td>{item.medida}</td>
                                                    <td>{item.cantidad}</td>
                                                    <td>{numberFormat(item.precio, this.state.cabecera.codiso)}</td>
                                                    <td>{numberFormat(item.cantidad * item.precio, this.state.cabecera.codiso)}</td>
                                                </tr>
                                            ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                    </div>
                    <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                        <table width="100%">
                            <thead>
                                {this.renderTotal()}
                            </thead>
                        </table>
                    </div>
                </div>

            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.principal
    }
}

export default connect(mapStateToProps, null)(NotaCreditoProceso);