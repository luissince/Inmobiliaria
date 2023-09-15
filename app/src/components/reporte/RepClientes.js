import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { connect } from 'react-redux';
import FileDownloader from "./hooks/FileDownloader";
import { spinnerLoading, currentDate, getCurrentYear } from '../../helper/Tools';
import SearchBarClient from "../../helper/SearchBarClient";

class RepClientes extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            idProyecto: this.props.token.project.idProyecto,
            nombreProyecto: this.props.token.project.nombre,

            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            idCliente: '',
            clientes: [],
            cliente: '',

            frecuenciaCheck: true,

            loading: true,
            messageWarning: '',

            cada: 0,

            yearPago: getCurrentYear(),
            year: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2020, 2021, 2022, 2023],
            yearCheck: true,

            porProyecto: "0",
            proyectoCkeck: true,
        }

        this.refFechaIni = React.createRef();
        this.refCliente = React.createRef();
        this.refUseFile = React.createRef();
        this.refFrecuencia = React.createRef();
        this.refYearPago = React.createRef();

        this.selectItem = false;
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

    }

    loadData = async () => {
        await this.setStateAsync({
            // clientes: cliente.data,
            loading: false,
            // cambiar
            // fechaIni: '2022-07-19',
            fechaIni: currentDate(),
            fechaFin: currentDate()
        });
    }

    onEventClearInput = async () => {
        await this.setStateAsync({ clientes: [], idCliente: '', cliente: "" });
        this.selectItem = false;
    }

    handleFilter = async (event) => {
        const searchWord = this.selectItem ? "" : event.target.value;
        await this.setStateAsync({
            idCliente: '',
            cliente: searchWord,
            idLote: '',
            lotes: [],
        });
        this.selectItem = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ clientes: [] });
            return;
        }

        if (this.state.filter) return;

        try {
            await this.setStateAsync({ filter: true });
            let result = await axios.get("/api/cliente/listfiltrar", {
                params: {
                    filtrar: searchWord,
                },
            });
            await this.setStateAsync({ filter: false, clientes: result.data });
        } catch (error) {
            await this.setStateAsync({ filter: false, clientes: [] });
        }
    }

    onEventSelectItem = async (value) => {
        await this.setStateAsync({
            cliente: value.documento + " - " + value.informacion,
            clientes: [],
            idCliente: value.idCliente
        });
        this.selectItem = true;
    }

    async onEventRepCobro() {
        if (this.state.fechaFin < this.state.fechaIni) {
            this.setState({ messageWarning: "La Fecha inicial no puede ser mayor a la fecha final." })
            this.refFechaIni.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "fechaIni": this.state.fechaIni,
            "fechaFin": this.state.fechaFin,
            "idCliente": this.state.idCliente,
            "cliente": this.state.cliente
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

        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "fechaIni": this.state.fechaIni,
            "fechaFin": this.state.fechaFin,
            "idCliente": this.state.idCliente,
            "cliente": this.state.cliente
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();

        let filename = this.state.idCliente ? "aportaciones.xlsx": "Reporte de Clientes"

        this.refUseFile.current.download({
            "name": "Reporte Cliente Aportaciones",
            "file": "/api/cliente/excelcliente",
            "filename": filename,
            "params": ciphertext
        });
    }

    async onEventRepDeudas() {
        if (!this.state.frecuenciaCheck && this.state.cada == 0) {
            this.setState({ messageWarning: "Seleccione una frecuencia de pago" })
            this.refFrecuencia.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "seleccionado": this.state.frecuenciaCheck,
            "frecuencia": this.state.cada
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/cliente/repdeudas?" + params, "_blank");
    }

    async onEventExcelDeudas() {
        if (!this.state.frecuenciaCheck && this.state.cada == 0) {
            this.setState({ messageWarning: "Seleccione una frecuencia de pago" })
            this.refFrecuencia.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "seleccionado": this.state.frecuenciaCheck,
            "frecuencia": this.state.cada
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();

        this.refUseFile.current.download({
            "name": "Reporte Deudas",
            "file": "/api/cliente/exceldeudas",
            "filename": "Lista de Dudas por Cliente.xlsx",
            "params": ciphertext
        });
    }

    async onEventPdfRegistro() {
        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "yearPago": this.state.yearPago,
            "porProyecto": this.state.porProyecto
        }
        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/cliente/replistarsociosporfecha?" + params, "_blank");
    }

    async onEventExcelRegistro() {
        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "yearPago": this.state.yearPago,
            "porProyecto": this.state.porProyecto
        }
        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();

        this.refUseFile.current.download({
            "name": "Listar de Cliente Por Fecha",
            "file": "/api/cliente/exacellistarsociosporfecha",
            "filename": "Listar de Cliente Por Fecha.xlsx",
            "params": ciphertext
        });
    }

    render() {
        return (
            <>
                {
                    this.state.loading
                        ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div>
                        :
                        <>
                            {/*
                             *
                             * Reporte de Cliente(s)
                             *
                            */}
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
                                        <div className="col-lg-6 col-md-12 col-sm-12 col-12">
                                            <div className="form-group">
                                                <label>Cliente(s)</label>
                                                <SearchBarClient
                                                    placeholder="Filtrar clientes..."
                                                    refCliente={this.refCliente}
                                                    cliente={this.state.cliente}
                                                    clientes={this.state.clientes}
                                                    onEventClearInput={this.onEventClearInput}
                                                    handleFilter={this.handleFilter}
                                                    onEventSelectItem={this.onEventSelectItem}
                                                />
                                            </div>
                                        </div>
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

                            {/*
                             *
                             * Lista de Deudas por Cliente
                             *
                            */}
                            <div className="card my-1">
                                <h6 className="card-header">Lista de Deudas por Cliente</h6>
                                <div className="card-body">

                                    <div className="row">
                                        <div className="col-lg-6 col-md-12 col-sm-12 col-12">
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

                            {/*
                             *
                             * Lista de Clientes por Fecha
                             *
                            */}
                            <div className="card my-1">
                                <h6 className="card-header">Listar de Clientes Registrados por Fecha</h6>
                                <div className="card-body">

                                    <div className="row">
                                        <div className="col-lg-6 col-md-12 col-sm-12 col-12">
                                            <div className="form-group">
                                                <label>Año de inicio<i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
                                                    <select
                                                        title="Año"
                                                        className="form-control"
                                                        disabled={this.state.yearCheck}
                                                        ref={this.refYearPago}
                                                        value={this.state.yearPago}
                                                        onChange={(event) => this.setState({ yearPago: event.target.value })}>
                                                        {
                                                            this.state.year.map((item, index) => (
                                                                <option key={index} value={item}>{item}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.yearCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ yearCheck: event.target.checked });
                                                                        if (this.state.yearCheck) {
                                                                            await this.setStateAsync({ yearPago: getCurrentYear() });
                                                                        }
                                                                    }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-lg-6 col-md-12 col-sm-12 col-12">
                                            <div className="form-group">
                                                <label>Proyecto<i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
                                                    <select
                                                        title="Año"
                                                        className="form-control"
                                                        disabled={this.state.proyectoCkeck}
                                                        value={this.state.porProyecto}
                                                        onChange={(event) => this.setState({ porProyecto: event.target.value })}>
                                                        <option value={"0"}>{"Por proyecto"}</option>
                                                        <option value={"1"}>{"Todos"}</option>
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.proyectoCkeck}
                                                                    onChange={async (event) => await this.setStateAsync({ proyectoCkeck: event.target.checked })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col"></div>
                                        <div className="col">
                                            <button className="btn btn-outline-warning btn-sm" onClick={() => this.onEventPdfRegistro()}><i className="bi bi-file-earmark-pdf-fill"></i> Reporte Pdf</button>
                                        </div>
                                        <div className="col">
                                            <button className="btn btn-outline-success btn-sm" onClick={() => this.onEventExcelRegistro()}><i className="bi bi-file-earmark-excel-fill"></i> Reporte Excel</button>
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