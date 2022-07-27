import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { connect } from 'react-redux';
import FileDownloader from "./hooks/FileDownloader";
import { spinnerLoading, currentDate } from '../tools/Tools';

class RepClientes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            idCliente: '',
            clientes: [],
            clienteCheck: true,
            frecuenciaCheck: true,

            loading: true,
            messageWarning: '',

            cada: 0,
        }

        this.refFechaIni = React.createRef();
        this.refCliente = React.createRef();
        this.refUseFile = React.createRef();
        this.refFrecuencia = React.createRef();

        this.abortControllerView = new AbortController()
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.loadData()
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    loadData = async () => {
        try {

            const cliente = await axios.get("/api/cliente/listcombo", {
                signal: this.abortControllerView.signal
            });

            await this.setStateAsync({
                clientes: cliente.data,

                loading: false,
                // cambiar
                // fechaIni: '2022-07-19',
                fechaIni: currentDate(),
                fechaFin: currentDate()
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    async onEventRepCobro() {
        if (this.state.fechaFin < this.state.fechaIni) {
            this.setState({ messageWarning: "La Fecha inicial no puede ser mayor a la fecha final." })
            this.refFechaIni.current.focus();
            return;
        }

        if (!this.state.clienteCheck && this.state.idCliente == "") {
            this.setState({ messageWarning: "Seleccione un cliente." })
            this.refCliente.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "fechaIni": this.state.fechaIni,
            "fechaFin": this.state.fechaFin,
            "idCliente": this.state.idCliente,
            "cliente": this.refCliente.current.options[this.refCliente.current.options.selectedIndex].innerHTML
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/cliente/repcliente?" + params, "_blank");
    }

    async onEventExcelCobro() {
        if (this.state.fechaFin < this.state.fechaIni) {
            this.setState({ messageWarning: "La Fecha inicial no puede ser mayor a la fecha final." })
            this.refFechaIni.current.focus();
            return;
        }

        if (!this.state.clienteCheck && this.state.idCliente == "") {
            this.setState({ messageWarning: "Seleccione un cliente." })
            this.refCliente.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "fechaIni": this.state.fechaIni,
            "fechaFin": this.state.fechaFin,
            "idCliente": this.state.idCliente,
            "cliente": this.refCliente.current.options[this.refCliente.current.options.selectedIndex].innerHTML
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();

        this.refUseFile.current.download({
            "name": "Reporte Cliente Aportaciones",
            "file": "/api/cliente/excelcliente",
            "filename": "aportaciones.xlsx",
            "params": ciphertext
        });
    }

    async onEventRepDeudas() {
        if(!this.state.frecuenciaCheck && this.state.cada == 0){
            this.setState({ messageWarning: "Seleccione una frecuencia de pago" })
            this.refFrecuencia.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "frecuencia": this.state.cada
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/cliente/repdeudas?" + params, "_blank");
    }

    async onEventExcelDeudas() {
        if(!this.state.frecuenciaCheck && this.state.cada == 0){
            this.setState({ messageWarning: "Seleccione una frecuencia de pago" })
            this.refFrecuencia.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "frecuencia": this.state.cada
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();

        this.refUseFile.current.download({
            "name": "Reporte Deudas",
            "file": "/api/cliente/exceldeudas",
            "filename": "deudas.xlsx",
            "params": ciphertext
        });
    }

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        <>
                            <div className="card my-1">
                                <h6 className="card-header">Reporte de Cliente(s)</h6>
                                <div className="card-body">
                                    {
                                        this.state.messageWarning === '' ? null :
                                            <div className="alert alert-warning" role="alert">
                                                <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                            </div>
                                    }
                                    <div className="row">
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Filtro por fechas</label>
                                                <div className="custom-control custom-switch">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id="customSwitch1"
                                                        checked={this.state.isFechaActive}
                                                        onChange={(event) => {
                                                            this.setState({ isFechaActive: event.target.checked, fechaIni: currentDate(), fechaFin: currentDate(), messageWarning: '' })
                                                            /*// if(event.target.checked){
                                                            //     this.setState({ isFechaActive: event.target.checked, fechaIni: currentDate(), fechaFin: currentDate(), messageWarning: '' })
                                                            // }else{
                                                            //     this.setState({ isFechaActive: event.target.checked, fechaIni: '2022-07-19', fechaFin: currentDate(), messageWarning: '' })
                                                            // }*/
                                                        }}
                                                    >
                                                    </input>
                                                    <label className="custom-control-label" htmlFor="customSwitch1">{this.state.isFechaActive ? 'Activo' : 'Inactivo'}</label>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="col">
                                            <div className="form-group">
                                                <label>Fecha inicial <i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        disabled={!this.state.isFechaActive}
                                                        ref={this.refFechaIni}
                                                        value={this.state.fechaIni}
                                                        onChange={(event) => {

                                                            if (event.target.value <= this.state.fechaFin) {
                                                                this.setState({
                                                                    fechaIni: event.target.value,
                                                                    messageWarning: '',
                                                                });
                                                            } else {
                                                                this.setState({
                                                                    fechaIni: event.target.value,
                                                                    messageWarning: 'La Fecha inicial no puede ser mayor a la fecha final.',
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Fecha final <i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        disabled={!this.state.isFechaActive}
                                                        value={this.state.fechaFin}
                                                        onChange={(event) => this.setState({ fechaFin: event.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-lg-4 col-md-6 col-sm-12">
                                            <div className="form-group">
                                                <label>Cliente(s)</label>
                                                <div className="input-group">
                                                    <select
                                                        title="Lista de clientes"
                                                        className="form-control"
                                                        ref={this.refCliente}
                                                        value={this.state.idCliente}
                                                        disabled={this.state.clienteCheck}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ idCliente: event.target.value });
                                                            if (this.state.idCliente === '') {
                                                                await this.setStateAsync({ clienteCheck: true });
                                                            }

                                                        }}>
                                                        <option value="">-- Todos --</option>
                                                        {
                                                            this.state.clientes.map((item, index) => (
                                                                <option key={index} value={item.idCliente}>{item.informacion}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.clienteCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ clienteCheck: event.target.checked });
                                                                        if (this.state.clienteCheck) {
                                                                            await this.setStateAsync({ idCliente: '' });
                                                                        }
                                                                    }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-md-6 col-sm-12"></div>
                                        <div className="col-lg-4 col-md-6 col-sm-12"></div>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col"></div>
                                        <div className="col">
                                            <button className="btn btn-outline-warning btn-sm" onClick={() => this.onEventRepCobro()}><i className="bi bi-file-earmark-pdf-fill"></i> Reporte Pdf</button>
                                        </div>
                                        <div className="col">
                                            <button className="btn btn-outline-success btn-sm" onClick={() => this.onEventExcelCobro()}><i className="bi bi-file-earmark-excel-fill"></i> Reporte Excel</button>
                                        </div>
                                        <div className="col"></div>
                                    </div>

                                </div>
                            </div>

                            <div className="card my-1">
                                <h6 className="card-header">Lista de Deudas por Cliente</h6>
                                <div className="card-body">

                                    <div className="col-lg-4 col-md-6 col-sm-12">
                                        <div className="form-group">
                                            <label>Seleccione segun frecuencia de pago</label>
                                            <div className="input-group">
                                                <select
                                                    title="frecuencia de deuda"
                                                    className="form-control"
                                                    ref={this.refFrecuencia}
                                                    value={this.state.cada}
                                                    disabled={this.state.frecuenciaCheck}
                                                    onChange={async (event) => {
                                                        await this.setStateAsync({ cada: event.target.value });
                                                        if (this.state.cada === 0) {
                                                            await this.setStateAsync({ frecuenciaCheck: true });
                                                        }

                                                    }}>
                                                    <option value="0">
                                                        - Seleccione
                                                    </option>
                                                    <option value="15">
                                                        Listar Ventas de cada 15
                                                    </option>
                                                    <option value="30">
                                                        Listar Ventas de cada 30
                                                    </option>
                                                </select>
                                                <div className="input-group-append">
                                                    <div className="input-group-text">
                                                        <div className="form-check form-check-inline m-0">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={this.state.frecuenciaCheck}
                                                                onChange={async (event) => {
                                                                    await this.setStateAsync({ frecuenciaCheck: event.target.checked });
                                                                    if (this.state.frecuenciaCheck) {
                                                                        await this.setStateAsync({ cada: '' });
                                                                    }
                                                                }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col"></div>
                                        <div className="col">
                                            <button className="btn btn-outline-warning btn-sm" onClick={() => this.onEventRepDeudas()}><i className="bi bi-file-earmark-pdf-fill"></i> Reporte Pdf</button>
                                        </div>
                                        <div className="col">
                                            <button className="btn btn-outline-success btn-sm" onClick={() => this.onEventExcelDeudas()}><i className="bi bi-file-earmark-excel-fill"></i> Reporte Excel</button>
                                        </div>
                                        <div className="col"></div>
                                    </div>

                                </div>
                            </div>

                            <FileDownloader ref={this.refUseFile} />
                        </>
                }
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}


export default connect(mapStateToProps, null)(RepClientes);